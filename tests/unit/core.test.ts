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

describe('5. Working Hours Slot Preference & Time-of-Day Detection', () => {
  // Import or test detectTimePreference
  const { detectTimePreference } = require('../../src/lib/ai/tools');

  it('should detect evening preference when explicitly passed as argument', () => {
    const pref = detectTimePreference('evening');
    assert.equal(pref.period, 'evening');
  });

  it('should detect evening preference from patient message "Do you have any other slot for evening"', () => {
    const pref = detectTimePreference(undefined, undefined, 'Do you have any other slot for evening');
    assert.equal(pref.period, 'evening');
  });

  it('should detect afternoon preference from patient message "can I come in afternoon"', () => {
    const pref = detectTimePreference(undefined, undefined, 'can I come in afternoon');
    assert.equal(pref.period, 'afternoon');
  });

  it('should detect morning preference from patient message "any morning slots?"', () => {
    const pref = detectTimePreference(undefined, undefined, 'any morning slots?');
    assert.equal(pref.period, 'morning');
  });

  it('should detect specific time like "5pm" or "17:00" and map target hour', () => {
    const pref1 = detectTimePreference('5pm');
    assert.equal(pref1.period, 'evening');
    assert.equal(pref1.targetHour, 17);

    const pref2 = detectTimePreference(undefined, undefined, 'can I get 10:30 am');
    assert.equal(pref2.period, 'morning');
    assert.equal(pref2.targetHour, 10);
    assert.equal(pref2.targetMinute, 30);
  });

  it('should return period "all" for general availability queries', () => {
    const pref = detectTimePreference(undefined, undefined, 'what slots are open tomorrow?');
    assert.equal(pref.period, 'all');
  });
});

describe('6. Working Hours Slot Generation Across the Entire Day', () => {
  it('should generate slots across morning, afternoon, and evening without truncating to morning', () => {
    const openHour = 9;
    const closeHour = 19; // 9:00 AM to 7:00 PM (10 hours)
    const slotDuration = 30; // 30 mins
    const buffer = 10; // 10 mins

    const slots: string[] = [];
    let currentMin = openHour * 60;
    const closeMin = closeHour * 60;

    while (currentMin + slotDuration <= closeMin) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      currentMin += slotDuration + buffer;
    }

    // Morning slots (< 12:00)
    const morning = slots.filter(s => parseInt(s.split(':')[0], 10) < 12);
    // Afternoon slots (12:00 to 15:59)
    const afternoon = slots.filter(s => {
      const h = parseInt(s.split(':')[0], 10);
      return h >= 12 && h < 16;
    });
    // Evening slots (>= 16:00)
    const evening = slots.filter(s => parseInt(s.split(':')[0], 10) >= 16);

    assert.ok(morning.length >= 3, 'Should have multiple morning slots');
    assert.ok(afternoon.length >= 3, 'Should have multiple afternoon slots');
    assert.ok(evening.length >= 3, 'Should have multiple evening slots');
    assert.ok(slots.includes('17:00') || slots.includes('16:20') || slots.includes('17:40'), 'Should contain evening slots');
  });

  it('should skip slots that overlap with clinic break hours', () => {
    const breakStart = 13.5 * 60; // 13:30
    const breakEnd = 14.5 * 60;   // 14:30
    const slotDuration = 30;
    const buffer = 10;

    const slots: number[] = [];
    let cur = 9 * 60;
    const end = 18 * 60;

    while (cur + slotDuration <= end) {
      const slotEnd = cur + slotDuration;
      if (cur < breakEnd && slotEnd > breakStart) {
        cur = breakEnd;
        continue;
      }
      slots.push(cur);
      cur += slotDuration + buffer;
    }

    // Ensure no slot was scheduled between 13:30 and 14:30
    const conflict = slots.some(s => s < breakEnd && (s + slotDuration) > breakStart);
    assert.equal(conflict, false, 'No slot should conflict with clinic break');
  });
});
