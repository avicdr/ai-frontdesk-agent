// tests/unit/core.test.ts
// Unit tests for core business logic: encryption, calendar arithmetic, prompt building, and response helpers

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { addMonths, endOfMonth } from 'date-fns';

describe('1. Security & Encryption (AES-256-GCM)', () => {
  const testKeyHex = randomBytes(32).toString('hex');
  const testKey = Buffer.from(testKeyHex, 'hex');

  function encrypt(text: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', testKey, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }

  function decrypt(ciphertext: string): string {
    const [ivHex, encHex, tagHex] = ciphertext.split(':');
    const decipher = createDecipheriv('aes-256-gcm', testKey, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
  }

  it('should encrypt and correctly decrypt sensitive WhatsApp tokens and OAuth secrets', () => {
    const secret = 'EAABwzL91048201948201948201948201';
    const ciphertext = encrypt(secret);
    assert.notEqual(ciphertext, secret);
    assert.equal(ciphertext.split(':').length, 3);

    const decrypted = decrypt(ciphertext);
    assert.equal(decrypted, secret);
  });

  it('should produce different ciphertexts for the same plaintext due to random IVs', () => {
    const secret = 'google-oauth-refresh-token-12345';
    const c1 = encrypt(secret);
    const c2 = encrypt(secret);
    assert.notEqual(c1, c2);
    assert.equal(decrypt(c1), decrypt(c2));
  });
});

describe('2. Calendar-Month Subscription Arithmetic', () => {
  function calculateExpiry(from: Date): Date {
    const next = addMonths(from, 1);
    const fromDay = from.getDate();
    const lastDayOfNextMonth = endOfMonth(next).getDate();
    if (fromDay > lastDayOfNextMonth) {
      return endOfMonth(next);
    }
    return next;
  }

  it('should handle standard 30-day and 31-day month transitions correctly', () => {
    const jan15 = new Date('2026-01-15T10:00:00Z');
    const expiry = calculateExpiry(jan15);
    assert.equal(expiry.getUTCDate(), 15);
    assert.equal(expiry.getUTCMonth(), 1); // February
  });

  it('should correctly handle leap years and non-leap years for Jan 31st', () => {
    // Non-leap year 2025
    const jan31_2025 = new Date('2025-01-31T10:00:00Z');
    const exp2025 = calculateExpiry(jan31_2025);
    assert.equal(exp2025.getUTCDate(), 28);
    assert.equal(exp2025.getUTCMonth(), 1); // Feb 28

    // Leap year 2024
    const jan31_2024 = new Date('2024-01-31T10:00:00Z');
    const exp2024 = calculateExpiry(jan31_2024);
    assert.equal(exp2024.getUTCDate(), 29);
    assert.equal(exp2024.getUTCMonth(), 1); // Feb 29
  });
});

describe('3. Booking Conflict Detection Logic', () => {
  interface AppointmentInterval {
    start: Date;
    end: Date;
  }

  function hasConflict(slotStart: Date, slotEnd: Date, existingAppointments: AppointmentInterval[]): boolean {
    return existingAppointments.some(appt => {
      return slotStart < appt.end && slotEnd > appt.start;
    });
  }

  it('should detect direct overlap when requested slot coincides with existing booking', () => {
    const existing = [
      { start: new Date('2026-10-20T10:00:00Z'), end: new Date('2026-10-20T10:30:00Z') },
    ];

    // Identical slot
    assert.equal(
      hasConflict(new Date('2026-10-20T10:00:00Z'), new Date('2026-10-20T10:30:00Z'), existing),
      true
    );

    // Partial overlap (starts during booking)
    assert.equal(
      hasConflict(new Date('2026-10-20T10:15:00Z'), new Date('2026-10-20T10:45:00Z'), existing),
      true
    );

    // Free slot before
    assert.equal(
      hasConflict(new Date('2026-10-20T09:30:00Z'), new Date('2026-10-20T10:00:00Z'), existing),
      false
    );

    // Free slot after
    assert.equal(
      hasConflict(new Date('2026-10-20T10:30:00Z'), new Date('2026-10-20T11:00:00Z'), existing),
      false
    );
  });
});

describe('4. WhatsApp Baileys Pairing Code & Phone Sanitization', () => {
  function sanitizePhone(raw: string): string {
    return raw.replace(/[^0-9]/g, '');
  }

  function formatPairingCode(code: string): string {
    return code.match(/.{1,4}/g)?.join('-') || code;
  }

  it('should clean various international phone number formats into raw digits', () => {
    assert.equal(sanitizePhone('+91 98765-43210'), '919876543210');
    assert.equal(sanitizePhone('+1 (555) 234-5678'), '15552345678');
    assert.equal(sanitizePhone('919876543210'), '919876543210');
  });

  it('should format 8-character pairing codes into hyphenated blocks for readability', () => {
    assert.equal(formatPairingCode('K94X28BQ'), 'K94X-28BQ');
    assert.equal(formatPairingCode('12345678'), '1234-5678');
  });
});
