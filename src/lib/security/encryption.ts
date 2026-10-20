// src/lib/security/encryption.ts
// AES-256-GCM encryption for storing integration credentials

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

import { createHash } from 'crypto';

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  }
  // Deterministic fallback derived from service key or secret seed to prevent crash in dev/sandbox
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY || 'ai-front-desk-dev-encryption-key-seed';
  return createHash('sha256').update(seed).digest();
}

/**
 * Encrypts a plaintext string.
 * Returns: iv:ciphertext:tag (all hex encoded, colon-separated)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * Decrypts a string produced by encrypt().
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }

  const [ivHex, encryptedHex, tagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Safely decrypts — returns null on failure instead of throwing.
 */
export function safeDecrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  try {
    return decrypt(ciphertext);
  } catch {
    return null;
  }
}

export const encryptToken = encrypt;
export const decryptToken = decrypt;
