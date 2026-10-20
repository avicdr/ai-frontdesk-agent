// src/lib/whatsapp/baileys-service.ts
// Baileys WhatsApp Multi-Device client manager
// Supports both dynamic QR code scanning and 8-digit Pairing Code linking

import fs from 'fs';
import path from 'path';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  fetchLatestWaWebVersion,
  Browsers,
  WASocket,
  WAVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import { getPersistentAuthState, getSessionsBaseDir } from './session-storage';
import { processTenantIncomingMessage } from './message-processor';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getClinicInfo, cacheClinicPhone, formatPhone } from './clinic-resolver';

export interface BaileysSessionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;         // Base64 PNG data URL
  pairingCode?: string;    // e.g. "K94X-28BQ"
  phoneNumber?: string;
  jid?: string;
  error?: string;
}

interface ActiveSessionEntry {
  socket: WASocket;
  state: BaileysSessionState;
  clearSession: () => Promise<void>;
}

// Preserve active sessions and reconnect timers across Next.js dev reloads using globalThis
const globalStore = globalThis as unknown as {
  __baileysSessions?: Map<string, ActiveSessionEntry>;
  __baileysReconnectTimers?: Map<string, NodeJS.Timeout>;
  __baileysConnectingPromises?: Map<string, Promise<BaileysSessionState>>;
  __baileysAutoResumeStarted?: boolean;
};

if (!globalStore.__baileysSessions) {
  globalStore.__baileysSessions = new Map<string, ActiveSessionEntry>();
}
if (!globalStore.__baileysReconnectTimers) {
  globalStore.__baileysReconnectTimers = new Map<string, NodeJS.Timeout>();
}
if (!globalStore.__baileysConnectingPromises) {
  globalStore.__baileysConnectingPromises = new Map<string, Promise<BaileysSessionState>>();
}

const sessions = globalStore.__baileysSessions;
const reconnectTimers = globalStore.__baileysReconnectTimers;
const connectingPromises = globalStore.__baileysConnectingPromises;

function clearReconnectTimer(organizationId: string) {
  const t = reconnectTimers.get(organizationId);
  if (t) {
    clearTimeout(t);
    reconnectTimers.delete(organizationId);
  }
}

const logger = pino({ level: 'silent' });

/**
 * Initializes or starts a Baileys WhatsApp connection for a specific organization.
 */
export async function startBaileysSession(
  organizationId: string,
  options?: {
    mode?: 'qr' | 'pairing_code';
    phoneNumber?: string;
    forceReconnect?: boolean;
  }
): Promise<BaileysSessionState> {
  const existing = sessions.get(organizationId);

  // If already connected and NOT explicitly requesting a new link mode or forced reconnect, return connected state
  if (!options?.forceReconnect && !options?.mode && existing && existing.state.status === 'connected') {
    return existing.state;
  }

  // If a connection handshake is actively in-flight, return the running promise
  const inFlight = connectingPromises.get(organizationId);
  if (!options?.forceReconnect && !options?.mode && inFlight) {
    return inFlight;
  }

  // If auto-reconnect is scheduled (e.g. from 515 restartRequired) and user is polling, do not disrupt it
  if (!options?.forceReconnect && reconnectTimers.has(organizationId) && existing) {
    return existing.state;
  }

  // If already connecting with active QR and not requesting a fresh mode or reconnect, reuse state
  if (
    !options?.forceReconnect &&
    existing &&
    existing.state.status === 'connecting' &&
    options?.mode === 'qr' &&
    existing.state.qrCode
  ) {
    return existing.state;
  }

  // If already connecting with active pairing code for the same phone number, reuse state
  if (
    !options?.forceReconnect &&
    existing &&
    existing.state.status === 'connecting' &&
    options?.mode === 'pairing_code' &&
    existing.state.pairingCode
  ) {
    const existingPhone = existing.state.phoneNumber?.replace(/[^0-9]/g, '');
    let reqClean = options.phoneNumber?.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (reqClean && reqClean.length === 10 && /^[6-9]/.test(reqClean)) reqClean = `91${reqClean}`;
    if (!reqClean || !existingPhone || existingPhone.endsWith(reqClean) || reqClean.endsWith(existingPhone)) {
      return existing.state;
    }
  }

  const connectTask = (async () => {
    // Clean up previous socket if any (detach listeners so end() does NOT trigger recursive close events)
    if (existing) {
      clearReconnectTimer(organizationId);
      try {
        existing.socket.ev.removeAllListeners('connection.update');
        existing.socket.ev.removeAllListeners('messages.upsert');
        existing.socket.ev.removeAllListeners('creds.update');
        existing.socket.end(undefined);
      } catch {
        // ignore
      }
    }

    clearReconnectTimer(organizationId);

    let { state: authState, saveCreds, clearSession } = await getPersistentAuthState(organizationId);

    const isRegistered = !!authState.creds.registered;
    const isMidHandshake = Boolean(authState.creds.account || reconnectTimers.has(organizationId));
    const existingPhone = authState.creds.me?.id?.split('@')[0]?.split(':')[0];
    let requestedPhone = options?.phoneNumber?.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (requestedPhone && requestedPhone.length === 10 && /^[6-9]/.test(requestedPhone)) {
      requestedPhone = `91${requestedPhone}`;
    }
    const isPhoneMismatch = Boolean(requestedPhone && existingPhone && !existingPhone.endsWith(requestedPhone) && !requestedPhone.endsWith(existingPhone));

    // Only clear session if:
    // 1. Phone is NOT in the middle of completing a login handshake (authState.creds.account)
    // 2. Not already registered
    // 3. User explicitly requested a new mode AND (phone number changed OR no active credentials exist OR forced)
    const shouldClear = Boolean(
      options?.mode &&
      !isRegistered &&
      !isMidHandshake &&
      (isPhoneMismatch || options.forceReconnect || (!existing?.state.pairingCode && !existing?.state.qrCode))
    );

    if (shouldClear) {
      const clinic = await getClinicInfo(organizationId, requestedPhone || existingPhone);
      console.log(`[Baileys] Clearing stale/unregistered session keys for clinic "${clinic.name}" - ${clinic.phone || requestedPhone || 'unlinked'}`);
      await clearSession();
      const fresh = await getPersistentAuthState(organizationId);
      authState = fresh.state;
      saveCreds = fresh.saveCreds;
      clearSession = fresh.clearSession;
    }

    let version: WAVersion;
    try {
      const waWeb = await fetchLatestWaWebVersion({});
      version = waWeb.version;
    } catch {
      const baileysVer = await fetchLatestBaileysVersion();
      version = baileysVer.version;
    }

    const sessionState: BaileysSessionState = {
      status: 'connecting',
    };

    const sock = makeWASocket({
      version,
      auth: authState,
      logger,
      browser: Browsers.macOS('Desktop'),
      printQRInTerminal: false,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    const entry: ActiveSessionEntry = {
      socket: sock,
      state: sessionState,
      clearSession,
    };
    sessions.set(organizationId, entry);

  // 1. Handle credentials update
  sock.ev.on('creds.update', saveCreds);

  // 2. Handle connection updates (QR, pairing, connect, disconnect)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // A. QR Code received
    if (qr && options?.mode !== 'pairing_code') {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        sessionState.qrCode = qrDataUrl;
        sessionState.status = 'connecting';
      } catch (err) {
        console.error('Failed to generate QR data URL:', err);
      }
    }

    // B. Connected successfully
    if (connection === 'open') {
      const jid = sock.user?.id;
      const cleanPhone = jid?.split('@')[0]?.split(':')[0] ?? '';
      const formattedCleanPhone = formatPhone(cleanPhone);

      sessionState.status = 'connected';
      sessionState.jid = jid;
      sessionState.phoneNumber = cleanPhone;
      sessionState.qrCode = undefined;
      sessionState.pairingCode = undefined;
      sessionState.error = undefined;

      cacheClinicPhone(organizationId, cleanPhone);
      const clinic = await getClinicInfo(organizationId, cleanPhone);
      console.log(`[Baileys] Clinic "${clinic.name}" connected as ${formattedCleanPhone}`);

      // Update Supabase integration status
      try {
        const admin = createSupabaseAdminClient();
        const { error: upsertErr } = await admin.from('whatsapp_integrations').upsert(
          {
            organization_id: organizationId,
            display_phone_number: formattedCleanPhone,
            jid,
            status: 'connected',
            connection_type: 'baileys',
            connected_at: new Date().toISOString(),
            last_error: null,
            last_error_at: null,
          },
          { onConflict: 'organization_id' }
        );

        if (upsertErr) {
          // Fallback if migration 002 has not been applied to Supabase yet
          await admin.from('whatsapp_integrations').upsert(
            {
              organization_id: organizationId,
              display_phone_number: formattedCleanPhone,
              status: 'connected',
              connected_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
          );
        }
      } catch (err) {
        console.warn('Failed to update integration status in DB:', err);
      }
    }

    // C. Connection closed
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;
      const isRestartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;

      const clinic = await getClinicInfo(organizationId, sessionState.phoneNumber);
      console.log(
        `[Baileys] Socket closed for clinic "${clinic.name}" (${clinic.phone || 'unlinked'}). Status code: ${statusCode}, LoggedOut: ${isLoggedOut}, Replaced: ${isReplaced}, RestartRequired: ${isRestartRequired}`
      );

      clearReconnectTimer(organizationId);

      if (isLoggedOut) {
        sessions.delete(organizationId);
        sessionState.status = 'disconnected';
        sessionState.error = 'WhatsApp session unlinked or logged out.';
        await clearSession();

        try {
          const admin = createSupabaseAdminClient();
          await admin
            .from('whatsapp_integrations')
            .update({
              status: 'disconnected',
              disconnected_at: new Date().toISOString(),
              last_error: 'Logged out from mobile device',
            })
            .eq('organization_id', organizationId);
        } catch {
          // ignore
        }
      } else if (isReplaced) {
        console.warn(`[Baileys] Socket for clinic "${clinic.name}" was replaced by another active connection (440). Halting auto-reconnect.`);
        sessions.delete(organizationId);
        sessionState.status = 'disconnected';
        sessionState.error = 'Session was replaced by another active connection.';
      } else {
        const isRegistered = sock.authState.creds.registered || !!sock.authState.creds.account;

        // If an unregistered socket times out (408), QR code or pairing code expired without being linked
        if (!isRegistered && (statusCode === 408 || statusCode === DisconnectReason.timedOut)) {
          console.log(`[Baileys] Pairing timed out for clinic "${clinic.name}" (code 408). Stopping reconnect loop.`);
          sessions.delete(organizationId);
          sessionState.status = 'disconnected';
          sessionState.error = 'Pairing window expired. Please click below to generate a new QR code or pairing code.';
          sessionState.qrCode = undefined;
          sessionState.pairingCode = undefined;
          return;
        }

        // Keep in sessions map as 'connecting' to prevent concurrent re-initialization from status polling
        sessionState.status = 'connecting';
        const delay = isRestartRequired ? 500 : 3000;
        console.log(`[Baileys] Reconnecting socket for clinic "${clinic.name}" in ${delay}ms...`);
        const timer = setTimeout(() => {
          reconnectTimers.delete(organizationId);
          startBaileysSession(organizationId, { forceReconnect: true }).catch(err => {
            console.error(`[Baileys] Auto-reconnect error for clinic "${clinic.name}":`, err);
          });
        }, delay);
        reconnectTimers.set(organizationId, timer);
      }
    }
  });

  // 3. Handle Pairing Code mode (only if not registered)
  if (options?.mode === 'pairing_code' && options.phoneNumber && !sock.authState.creds.registered) {
    let rawNumber = options.phoneNumber.replace(/[^0-9]/g, '').replace(/^0+/, '');
    // If user entered a 10-digit number (e.g. 8948006900 starting with 6,7,8,9), automatically prepend India country code 91
    if (rawNumber.length === 10 && /^[6-9]/.test(rawNumber)) {
      rawNumber = `91${rawNumber}`;
    }

    if (rawNumber.length >= 10) {
      try {
        // Allow socket sufficient handshake time before requesting pairing code
        await new Promise(r => setTimeout(r, 2500));
        const rawCode = await sock.requestPairingCode(rawNumber);
        const formatted = rawCode?.match(/.{1,4}/g)?.join('-') || rawCode;
        sessionState.pairingCode = formatted;
        sessionState.phoneNumber = rawNumber;
        sessionState.qrCode = undefined;
      } catch (err: any) {
        console.error('Failed to request pairing code:', err);
        sessionState.error = err?.message || 'Could not request pairing code.';
      }
    }
  }

  // 4. Handle incoming patient messages & route to AI receptionist
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
        continue; // Skip group chats and broadcast status updates
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      const contactPhone = remoteJid.split('@')[0].split(':')[0];

      // If doctor manually messages or replies from their own WhatsApp:
      if (msg.key.fromMe) {
        const clinic = await getClinicInfo(organizationId, sessionState.phoneNumber);
        const formattedContact = formatPhone(contactPhone);
        console.log(`[WhatsApp Staff Reply] Clinic "${clinic.name}" (${clinic.phone || 'phone'}) staff replied manually from phone to ${formattedContact}: "${text.trim()}". Handed off to human.`);

        // Automatically switch conversation to human / handed off so AI doesn't interrupt
        try {
          const admin = createSupabaseAdminClient();
          const { data: conv } = await admin
            .from('conversations')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('patient_phone', contactPhone)
            .in('status', ['active', 'handed_off'])
            .order('last_message_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let targetConvId = conv?.id;
          if (!targetConvId) {
            const { data: newConv } = await admin
              .from('conversations')
              .insert({
                organization_id: organizationId,
                patient_phone: contactPhone,
                channel: 'whatsapp',
                status: 'handed_off',
                owner: 'human',
                handoff_reason: 'manual_reply_from_phone',
                last_message_at: new Date().toISOString(),
              })
              .select('id')
              .single();
            targetConvId = newConv?.id;
          } else {
            await admin
              .from('conversations')
              .update({
                owner: 'human',
                status: 'handed_off',
                handoff_reason: 'manual_reply_from_phone',
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetConvId);
          }

          if (targetConvId && text.trim()) {
            await admin.from('messages').insert({
              conversation_id: targetConvId,
              organization_id: organizationId,
              external_id: msg.key.id || `doc-${Date.now()}`,
              role: 'assistant',
              content: text.trim(),
              status: 'sent',
              sent_at: new Date().toISOString(),
              metadata: { sent_by_owner: true, from_me: true },
            });
          }
        } catch (err) {
          console.error(`[Baileys] Error updating handoff on manual phone reply for clinic "${clinic.name}" to ${formattedContact}:`, err);
        }
        continue;
      }

      if (!text.trim()) continue;

      const senderPhone = contactPhone;
      const formattedSender = formatPhone(senderPhone);
      const messageId = msg.key.id || `baileys-${Date.now()}`;
      const senderName = msg.pushName || undefined;

      const clinic = await getClinicInfo(organizationId, sessionState.phoneNumber);
      console.log(
        `[WhatsApp Incoming] Clinic "${clinic.name}" (${clinic.phone || 'agent'}) received text from patient ${formattedSender}${senderName ? ` (${senderName})` : ''}: "${text.trim()}"`
      );

      // Dispatch to AI Agent Pipeline
      processTenantIncomingMessage({
        organizationId,
        fromPhone: senderPhone,
        senderName,
        text: text.trim(),
        messageId,
        sendReply: async (replyText: string) => {
          try {
            const currentEntry = sessions.get(organizationId);
            const activeSock = currentEntry?.socket ?? sock;
            const sent = await activeSock.sendMessage(remoteJid, { text: replyText });
            return { success: true, messageId: sent?.key.id ?? undefined };
          } catch (err: any) {
            console.error(`Failed to send WhatsApp reply for clinic "${clinic.name}" to ${remoteJid}:`, err);
            return { success: false, error: err?.message || 'Send failed' };
          }
        },
      }).catch(async err => {
        console.error(`[WhatsApp Error] Error processing message for clinic "${clinic.name}":`, err);
      });
    }
  });

    // Wait up to 3.5 seconds for QR code if requested in this turn
    if (options?.mode === 'qr' && !sessionState.qrCode) {
      let waited = 0;
      while (!sessionState.qrCode && waited < 3500 && sessionState.status === 'connecting') {
        await new Promise(r => setTimeout(r, 200));
        waited += 200;
      }
    }

    return sessionState;
  })();

  connectingPromises.set(organizationId, connectTask);
  try {
    return await connectTask;
  } finally {
    connectingPromises.delete(organizationId);
  }
}

/**
 * Gets the current Baileys session status for an organization.
 */
export async function getBaileysSessionStatus(organizationId: string): Promise<BaileysSessionState> {
  const active = sessions.get(organizationId);
  if (active) {
    return active.state;
  }

  // If auto-reconnect is already scheduled or an in-flight connection is running, don't spawn a second duplicate socket
  if (reconnectTimers.has(organizationId) || connectingPromises.has(organizationId)) {
    return { status: 'connecting' };
  }

  // 1. Check if registered credentials already exist in local session storage
  const sessionDir = path.join(getSessionsBaseDir(), organizationId);
  const credsFile = path.join(sessionDir, 'creds.json');
  if (fs.existsSync(credsFile)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
      if (creds.registered && creds.me?.id) {
        const cleanPhone = creds.me.id.split('@')[0].split(':')[0];
        cacheClinicPhone(organizationId, cleanPhone);
        getClinicInfo(organizationId, cleanPhone).then(clinic => {
          console.log(`[Baileys] Found registered credentials for clinic "${clinic.name}" (${formatPhone(cleanPhone)}). Resuming socket...`);
        });
        // Resume socket connection to keep WhatsApp active
        startBaileysSession(organizationId).catch(err => {
          console.warn('[Baileys] Socket resume error:', err);
        });

        return {
          status: 'connected',
          phoneNumber: cleanPhone,
          jid: creds.me.id,
        };
      }
    } catch (err) {
      console.warn('[Baileys] Error parsing local creds.json:', err);
    }
  }

  // 2. Fallback check database if previously marked connected
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from('whatsapp_integrations')
      .select('status, display_phone_number')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (data && data.status === 'connected') {
      startBaileysSession(organizationId).catch(err => {
        console.warn('Rehydration error:', err);
      });

      return {
        status: 'connected',
        phoneNumber: data.display_phone_number?.replace('+', '') || undefined,
      };
    }
  } catch (err) {
    console.warn('Error querying whatsapp_integrations status:', err);
  }

  return { status: 'disconnected' };
}

/**
 * Disconnects and unlinks the WhatsApp session.
 */
export async function disconnectBaileysSession(organizationId: string): Promise<void> {
  clearReconnectTimer(organizationId);
  const active = sessions.get(organizationId);
  if (active) {
    try {
      active.socket.ev.removeAllListeners('connection.update');
      active.socket.ev.removeAllListeners('messages.upsert');
      active.socket.ev.removeAllListeners('creds.update');
      await active.socket.logout();
    } catch {
      // ignore
    }
    await active.clearSession();
    sessions.delete(organizationId);
  } else {
    // Crucial: ALWAYS wipe persistent auth state from disk & Supabase even if socket wasn't in memory!
    try {
      const { clearSession } = await getPersistentAuthState(organizationId);
      await clearSession();
    } catch (e) {
      console.warn('Error clearing persistent auth state on disconnect:', e);
    }
  }

  try {
    const admin = createSupabaseAdminClient();
    await admin
      .from('whatsapp_integrations')
      .update({
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
        jid: null,
        display_phone_number: null,
        last_error: null,
      })
      .eq('organization_id', organizationId);
  } catch (err) {
    console.error('Error recording disconnect in DB:', err);
  }
}

/**
 * Automatically resumes all registered WhatsApp sessions across organizations on server boot.
 */
export async function autoResumeAllActiveBaileysSessions(): Promise<void> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }
  if (globalStore.__baileysAutoResumeStarted) {
    return;
  }
  globalStore.__baileysAutoResumeStarted = true;

  console.log('[Baileys] Scanning for registered WhatsApp sessions to auto-resume...');
  const orgsToResume = new Set<string>();

  // 1. Scan filesystem .whatsapp-sessions directory
  try {
    const sessionsBaseDir = getSessionsBaseDir();
    if (fs.existsSync(sessionsBaseDir)) {
      const entries = fs.readdirSync(sessionsBaseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const orgId = entry.name;
          const credsFile = path.join(sessionsBaseDir, orgId, 'creds.json');
          if (fs.existsSync(credsFile)) {
            try {
              const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
              if ((creds.registered || creds.account) && creds.me?.id) {
                orgsToResume.add(orgId);
              }
            } catch {
              // ignore unparseable creds
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Baileys] Error scanning local sessions directory:', err);
  }

  // 2. Scan DB for organizations with registered credentials in whatsapp_sessions table
  try {
    const admin = createSupabaseAdminClient();
    const { data: sessionRows } = await admin
      .from('whatsapp_sessions')
      .select('organization_id, value')
      .eq('key_id', 'creds');

    if (sessionRows) {
      for (const row of sessionRows) {
        if (row.organization_id && row.value) {
          const creds = row.value as any;
          if ((creds.registered || creds.account) && creds.me?.id) {
            orgsToResume.add(row.organization_id);
          }
        }
      }
    }

    // Clean up any stale integrations in whatsapp_integrations marked 'connected' that have no actual credentials
    const { data: staleIntegrations } = await admin
      .from('whatsapp_integrations')
      .select('organization_id')
      .eq('status', 'connected');

    if (staleIntegrations) {
      for (const row of staleIntegrations) {
        if (!orgsToResume.has(row.organization_id)) {
          await admin
            .from('whatsapp_integrations')
            .update({ status: 'disconnected', last_error: 'Session credentials not found' })
            .eq('organization_id', row.organization_id);
        }
      }
    }
  } catch (err) {
    console.warn('[Baileys] Error querying DB for saved credentials:', err);
  }

  if (orgsToResume.size === 0) {
    console.log('[Baileys] No active WhatsApp sessions found to auto-resume.');
    return;
  }

  console.log(`[Baileys] Auto-resuming ${orgsToResume.size} active WhatsApp session(s)...`);
  for (const orgId of orgsToResume) {
    const existing = sessions.get(orgId);
    if (!existing || existing.state.status !== 'connected') {
      getClinicInfo(orgId).then(clinic => {
        console.log(`[Baileys] Auto-resuming session for clinic "${clinic.name}" (${clinic.phone || 'registered'})...`);
      });
      startBaileysSession(orgId).catch(async err => {
        const clinic = await getClinicInfo(orgId);
        console.error(`[Baileys] Failed to auto-resume session for clinic "${clinic.name}":`, err);
      });
    }
  }
}

// Keep-alive heartbeat: ping external URL every 10 minutes to prevent Render free-tier idle spin down
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (Render spins down at 15 mins)
const globalKeepAlive = globalThis as unknown as { __renderKeepAliveTimer?: NodeJS.Timeout };

function initRenderKeepAlive() {
  if (globalKeepAlive.__renderKeepAliveTimer) return;
  const targetUrl = process.env.RENDER_EXTERNAL_URL 
    ? `${process.env.RENDER_EXTERNAL_URL}/api/health` 
    : (process.env.NODE_ENV === 'production' ? 'https://ai-frontdesk-agent.onrender.com/api/health' : null);

  if (!targetUrl) return;

  globalKeepAlive.__renderKeepAliveTimer = setInterval(async () => {
    try {
      const res = await fetch(targetUrl, { 
        method: 'HEAD', 
        headers: { 'user-agent': 'ai-front-desk-keepalive' },
      });
      console.log(`[KeepAlive] Heartbeat ping to ${targetUrl} returned ${res.status}`);
    } catch (err: any) {
      console.warn('[KeepAlive] Heartbeat ping error:', err?.message || err);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

// Automatically trigger on server module initialization
if (
  typeof window === 'undefined' &&
  process.env.NEXT_RUNTIME !== 'edge' &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  setImmediate(() => {
    autoResumeAllActiveBaileysSessions().catch(err => {
      console.warn('[Baileys] Background auto-resume trigger error:', err);
    });
    initRenderKeepAlive();
  });
}
