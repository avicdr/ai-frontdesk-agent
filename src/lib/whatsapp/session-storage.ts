// src/lib/whatsapp/session-storage.ts
// Dual-layer session storage: High-speed local disk cache + persistent Supabase Cloud sync
// Ensures WhatsApp session keys survive server restarts, container redeployments, and host changes for 30+ days.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { useMultiFileAuthState as initMultiFileAuthState, AuthenticationState, BufferJSON } from '@whiskeysockets/baileys';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Returns the writable base directory for WhatsApp session storage.
 * On serverless platforms (Vercel, AWS Lambda), the deployment root is read-only (/var/task),
 * so we use os.tmpdir() (/tmp/.whatsapp-sessions).
 * On persistent servers/containers or local dev, process.cwd()/.whatsapp-sessions is used.
 */
export function getSessionsBaseDir(): string {
  if (process.env.WHATSAPP_SESSIONS_DIR) {
    return process.env.WHATSAPP_SESSIONS_DIR;
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return path.join(os.tmpdir(), '.whatsapp-sessions');
  }
  try {
    const localDir = path.resolve(process.cwd(), '.whatsapp-sessions');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    return path.join(os.tmpdir(), '.whatsapp-sessions');
  }
}

export function getOrgSessionDir(organizationId: string): string {
  const baseDir = getSessionsBaseDir();
  const dir = path.join(/*turbopackIgnore: true*/ baseDir, organizationId);
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
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
    const credsFile = path.join(/*turbopackIgnore: true*/ sessionDir, 'creds.json');
    if (fs.existsSync(/*turbopackIgnore: true*/ credsFile)) {
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
      const fileName = row.key_id.endsWith('.json') ? row.key_id : `${row.key_id}.json`;
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

  // 3. Wrap state.keys.set to sync all cryptographic keys (pre-keys, app-state, session keys) to Supabase
  const originalKeysSet = state.keys.set;
  state.keys.set = async (data: any) => {
    await originalKeysSet(data);
    try {
      const admin = createSupabaseAdminClient();
      const upserts: Array<{ organization_id: string; key_id: string; value: any; updated_at: string }> = [];
      const deletes: string[] = [];

      for (const category in data) {
        for (const id in data[category]) {
          const value = data[category][id];
          const keyId = `${category}-${id}`;
          if (value) {
            upserts.push({
              organization_id: organizationId,
              key_id: keyId,
              value: JSON.parse(JSON.stringify(value, BufferJSON.replacer)),
              updated_at: new Date().toISOString(),
            });
          } else {
            deletes.push(keyId);
          }
        }
      }

      if (upserts.length > 0) {
        await admin.from('whatsapp_sessions').upsert(upserts, { onConflict: 'organization_id,key_id' });
      }
      if (deletes.length > 0) {
        await admin.from('whatsapp_sessions').delete().eq('organization_id', organizationId).in('key_id', deletes);
      }
    } catch (err) {
      console.warn(`[Baileys Storage] Error syncing keys to Supabase for ${organizationId}:`, err);
    }
  };

  // 4. Wrapped saveCreds that syncs to Supabase safely directly from in-memory state
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

  // 5. Wrapped clearSession to completely wipe keys on logout
  const clearSession = async () => {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ sessionDir)) {
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
