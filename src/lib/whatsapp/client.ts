// src/lib/whatsapp/client.ts
// Official WhatsApp Business Platform API client
// Uses Meta's Cloud API — NOT unofficial web automation

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { safeDecrypt } from '@/lib/security/encryption';

const WA_API_VERSION = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
const WA_BASE_URL = `https://graph.facebook.com/${WA_API_VERSION}`;

export interface WaSendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Gets the decrypted WhatsApp access token for an organization.
 * Never returns the token to the browser.
 */
async function getWaToken(organizationId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('whatsapp_integrations')
    .select('access_token_encrypted')
    .eq('organization_id', organizationId)
    .eq('status', 'connected')
    .single();

  if (!data?.access_token_encrypted) return null;
  return safeDecrypt(data.access_token_encrypted);
}

/**
 * Gets the phone_number_id for an organization.
 */
async function getPhoneNumberId(organizationId: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('whatsapp_integrations')
    .select('phone_number_id')
    .eq('organization_id', organizationId)
    .eq('status', 'connected')
    .single();
  return data?.phone_number_id ?? null;
}

/**
 * Sends a text message to a WhatsApp number.
 * Returns success only when Meta API confirms delivery.
 */
export async function sendWhatsAppMessage(
  organizationId: string,
  toPhoneNumber: string,
  text: string
): Promise<WaSendMessageResult> {
  const [token, phoneNumberId] = await Promise.all([
    getWaToken(organizationId),
    getPhoneNumberId(organizationId),
  ]);

  if (!token || !phoneNumberId) {
    return { success: false, error: 'WhatsApp integration not configured or disconnected.' };
  }

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: toPhoneNumber,
    type: 'text',
    text: { body: text, preview_url: false },
  };

  try {
    const response = await fetch(`${WA_BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json() as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code: number };
    };

    if (!response.ok || result.error) {
      return { success: false, error: result.error?.message ?? `HTTP ${response.status}` };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/**
 * Verifies a WhatsApp webhook verification request from Meta.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export function verifyWebhookChallenge(
  mode: string,
  token: string,
  challenge: string
): string | null {
  if (
    mode === 'subscribe' &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return challenge;
  }
  return null;
}

/**
 * Verifies the signature of an incoming WhatsApp webhook payload.
 * https://developers.facebook.com/docs/messenger-platform/webhooks#security
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  appSecret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');
  const providedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  );
}

/**
 * Parses incoming WhatsApp webhook payload.
 * Returns null for non-message events (status updates, etc.)
 */
export interface IncomingWaMessage {
  messageId: string;
  phoneNumberId: string;
  fromPhone: string;
  text: string;
  timestamp: number;
  wabaId: string;
}

export function parseIncomingMessage(
  payload: Record<string, unknown>
): IncomingWaMessage | null {
  try {
    const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value = changes?.value as Record<string, unknown>;

    if (!value?.messages) return null; // Status update or other event

    const message = (value.messages as unknown[])?.[0] as Record<string, unknown>;
    if (message?.type !== 'text') return null; // Only handle text messages for now

    const text = (message.text as Record<string, unknown>)?.body as string;
    if (!text) return null;

    return {
      messageId: message.id as string,
      phoneNumberId: (value.metadata as Record<string, unknown>)?.phone_number_id as string,
      fromPhone: (message.from as string),
      text,
      timestamp: parseInt(message.timestamp as string, 10),
      wabaId: entry?.id as string,
    };
  } catch {
    return null;
  }
}
