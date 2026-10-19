// src/lib/whatsapp/session-storage.ts
// Dual-layer session storage: High-speed local disk cache + persistent Supabase Cloud sync
// Ensures WhatsApp session keys survive server restarts, container redeployments, and host changes for 30+ days.

import fs from 'fs';
import path from 'path';
import { useMultiFileAuthState as initMultiFileAuthState, AuthenticationState, BufferJSON } from '@whiskeysockets/baileys';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const SESSIONS_BASE_DIR = path.resolve(process.cwd(), '.whatsapp-sessions');

function getOrgSessionDir(organizationId: string): string {
  const dir = path.join(SESSIONS_BASE_DIR, organizationId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Restores session keys from Supabase into the local filesystem if the local folder is empty.
 * This runs automatically whenever the server is spun up or deployed to a new instance.
 */
async function restoreSessionFromDatabase(organizationId: string, sessionDir: string): Promise<boolean> {
  try {
    const credsFile = path.join(sessionDir, 'creds.json');
    if (fs.existsSync(credsFile)) {
      return true; // Already exists locally
    }

    const admin = createSupabaseAdminClient();
    const { data: rows, error } = await admin
      .from('whatsapp_sessions')
      .select('key_id, value')
      .eq('organization_id', organizationId);

    if (error || !rows || rows.length === 0) {
      return false;
    }

    // Restore each saved file
    for (const row of rows) {
      const fileName = `${row.key_id}.json`;
      const filePath = path.join(sessionDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(row.value));
    }

    return true;
  } catch (err) {
    console.error(`[Baileys Storage] Error restoring session for org ${organizationId}:`, err);
    return false;
  }
}

/**
 * Syncs updated session keys/creds to Supabase in the background.
 */
async function syncFileToDatabase(organizationId: string, keyId: string, value: any): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from('whatsapp_sessions').upsert(
      {
        organization_id: organizationId,
        key_id: keyId,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,key_id' }
    );
  } catch (err) {
    console.warn(`[Baileys Storage] Failed to backup key ${keyId} for org ${organizationId}:`, err);
  }
}

/**
 * Provides an augmented AuthenticationState backed by both local disk and Supabase.
 */
export async function getPersistentAuthState(organizationId: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearSession: () => Promise<void>;
}> {
  const sessionDir = getOrgSessionDir(organizationId);

  // 1. Restore from Supabase if starting fresh on a new machine/deployment
  await restoreSessionFromDatabase(organizationId, sessionDir);

  // 2. Initialize Baileys multi-file auth state
  const { state, saveCreds: baseSaveCreds } = await initMultiFileAuthState(sessionDir);

  // 3. Wrapped saveCreds that syncs to Supabase safely directly from in-memory state
  const saveCreds = async () => {
    await baseSaveCreds();
    try {
      if (state.creds) {
        // Direct in-memory serialization avoids disk read race conditions while creds.json is being flushed
        const credsData = JSON.parse(JSON.stringify(state.creds, BufferJSON.replacer));
        await syncFileToDatabase(organizationId, 'creds', credsData);
      }
    } catch (err) {
      console.warn(`[Baileys Storage] Failed to sync creds to Supabase for ${organizationId}:`, err);
    }
  };

  // 4. Wrapped clearSession to completely wipe keys on logout
  const clearSession = async () => {
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
      const admin = createSupabaseAdminClient();
      await admin.from('whatsapp_sessions').delete().eq('organization_id', organizationId);
    } catch (err) {
      console.error(`[Baileys Storage] Error clearing session for ${organizationId}:`, err);
    }
  };

  return { state, saveCreds, clearSession };
}
