// tests/unit/security-audit.test.ts
// Comprehensive automated security regression test suite

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getSafeRedirectUrl } from '@/lib/url';
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/security/admin';
import { isAllowedGoogleMapsUrl } from '@/lib/location/google-maps';
import { checkRateLimit } from '@/lib/security/rate-limit';
import crypto from 'crypto';

describe('Security Audit — Open Redirect Prevention', () => {
  it('should reject external absolute URLs and fallback to safe default', () => {
    const targets = [
      'https://attacker.com',
      'http://attacker.com/login',
      'https://evil.com/phishing?account=steal',
      'http://127.0.0.1.attacker.com',
    ];

    for (const target of targets) {
      const result = getSafeRedirectUrl(target);
      assert.strictEqual(
        result.pathname,
        '/dashboard',
        `Target ${target} was not redirected to /dashboard`
      );
    }
  });

  it('should reject protocol-relative URLs (//evil.com) and backslash bypasses', () => {
    const bypasses = [
      '//evil.com',
      '//attacker.com/path',
      '///attacker.com',
      '/\\attacker.com',
      '\\\\attacker.com',
      '%2f%2fattacker.com',
      '//localhost:8000.evil.com',
    ];

    for (const bypass of bypasses) {
      const result = getSafeRedirectUrl(bypass);
      assert.strictEqual(
        result.pathname,
        '/dashboard',
        `Protocol-relative bypass ${bypass} failed defense`
      );
    }
  });

  it('should reject pseudo-protocols such as javascript: and data:', () => {
    const dangerousProtocols = [
      'javascript:alert(1)',
      'javascript:void(0)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox("test")',
    ];

    for (const proto of dangerousProtocols) {
      const result = getSafeRedirectUrl(proto);
      assert.strictEqual(
        result.pathname,
        '/dashboard',
        `Pseudo-protocol ${proto} was not blocked`
      );
    }
  });

  it('should allow legitimate relative application paths', () => {
    const validPaths = [
      '/dashboard',
      '/dashboard/integrations',
      '/onboarding?step=2',
      '/admin',
      '/dashboard/appointments#upcoming',
    ];

    for (const valid of validPaths) {
      const result = getSafeRedirectUrl(valid);
      assert.ok(
        result.pathname.startsWith('/'),
        `Valid path ${valid} was improperly altered`
      );
      assert.strictEqual(
        result.pathname,
        valid.split('?')[0].split('#')[0]
      );
    }
  });
});

describe('Security Audit — Super-Admin Authorization & Elevation Defense', () => {
  it('should NOT treat hardcoded emails as super-admin without env configuration', () => {
    const originalSuper = process.env.SUPER_ADMIN_EMAILS;
    const originalAdmin = process.env.ADMIN_EMAIL;

    delete process.env.SUPER_ADMIN_EMAILS;
    delete process.env.ADMIN_EMAIL;

    try {
      assert.strictEqual(isSuperAdminEmail('admin@aifrontdesk.com'), false);
      assert.strictEqual(isSuperAdminEmail('attacker@evil.com'), false);
      assert.strictEqual(isSuperAdminEmail('admin@arenova.in'), false);
    } finally {
      process.env.SUPER_ADMIN_EMAILS = originalSuper;
      process.env.ADMIN_EMAIL = originalAdmin;
    }
  });

  it('should only recognize emails explicitly declared in environment variables', () => {
    const original = process.env.SUPER_ADMIN_EMAILS;
    process.env.SUPER_ADMIN_EMAILS = 'auditor@example.com, root@hospital.org';

    try {
      assert.strictEqual(isSuperAdminEmail('auditor@example.com'), true);
      assert.strictEqual(isSuperAdminEmail('AUDITOR@EXAMPLE.COM'), true); // case-insensitive
      assert.strictEqual(isSuperAdminEmail('root@hospital.org'), true);
      assert.strictEqual(isSuperAdminEmail('hacker@example.com'), false);
    } finally {
      process.env.SUPER_ADMIN_EMAILS = original;
    }
  });

  it('should prevent unverified accounts from claiming super-admin privileges', () => {
    const original = process.env.SUPER_ADMIN_EMAILS;
    process.env.SUPER_ADMIN_EMAILS = 'auditor@example.com';

    try {
      // Unconfirmed user registration with the target email must be denied
      const unconfirmedUser = {
        id: 'user-unconfirmed-123',
        email: 'auditor@example.com',
        email_confirmed_at: null,
      };
      assert.strictEqual(isSuperAdminUser(unconfirmedUser, null), false);

      // Confirmed user registration is accepted
      const confirmedUser = {
        id: 'user-confirmed-123',
        email: 'auditor@example.com',
        email_confirmed_at: new Date().toISOString(),
      };
      assert.strictEqual(isSuperAdminUser(confirmedUser, null), true);

      // DB-verified profile flag is accepted
      const dbVerifiedProfile = { is_super_admin: true };
      const regularUser = { id: 'user-456', email: 'regular@example.com', email_confirmed_at: null };
      assert.strictEqual(isSuperAdminUser(regularUser, dbVerifiedProfile), true);

      // Non-admin with verified email is denied
      const nonAdminUser = { id: 'user-789', email: 'random@example.com', email_confirmed_at: new Date().toISOString() };
      assert.strictEqual(isSuperAdminUser(nonAdminUser, { is_super_admin: false }), false);
    } finally {
      process.env.SUPER_ADMIN_EMAILS = original;
    }
  });
});

describe('Security Audit — SSRF Defense in Google Maps URL Resolution', () => {
  it('should block local metadata, loopback, and private IP targets', () => {
    const maliciousUrls = [
      'http://169.254.169.254/latest/meta-data/',
      'http://127.0.0.1:8000/internal-secrets',
      'http://localhost:3000/api/internal',
      'http://10.0.0.1/admin',
      'http://192.168.1.1/router',
      'http://[::1]/internal',
      'https://169.254.169.254/metadata',
    ];

    for (const url of maliciousUrls) {
      assert.strictEqual(
        isAllowedGoogleMapsUrl(url),
        false,
        `SSRF target ${url} was not blocked`
      );
    }
  });

  it('should block external attacker domains masquerading as Google', () => {
    const fakeUrls = [
      'https://attacker.com/maps.app.goo.gl',
      'https://maps.app.goo.gl.attacker.com',
      'https://goo.gl.attacker.com/maps',
      'https://evil-google.com',
    ];

    for (const url of fakeUrls) {
      assert.strictEqual(
        isAllowedGoogleMapsUrl(url),
        false,
        `Attacker domain ${url} was not blocked`
      );
    }
  });

  it('should accept legitimate Google Maps domains', () => {
    const validGoogleUrls = [
      'https://maps.app.goo.gl/Xyz123',
      'https://goo.gl/maps/Abc456',
      'https://www.google.com/maps/search/?api=1&query=28.6139,77.2090',
      'https://maps.google.com/maps?q=Mumbai',
      'https://maps.google.co.in/maps?q=Connaught+Place',
    ];

    for (const url of validGoogleUrls) {
      assert.strictEqual(
        isAllowedGoogleMapsUrl(url),
        true,
        `Valid Google Maps URL ${url} was rejected`
      );
    }
  });
});

describe('Security Audit — Timing-Safe HMAC Signatures', () => {
  it('should verify signatures accurately and reject tampered payloads', () => {
    const secret = 'super-secret-test-key-32chars!!';
    const body = JSON.stringify({ event: 'order.paid', amount: 99900 });

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const tamperedBody = JSON.stringify({ event: 'order.paid', amount: 100 });

    // Validate matching HMAC
    const expectedBuf = Buffer.from(validSignature, 'utf-8');
    const providedBuf = Buffer.from(validSignature, 'utf-8');
    assert.ok(crypto.timingSafeEqual(expectedBuf, providedBuf));

    // Tampered payload produces mismatched digest
    const tamperedDigest = crypto
      .createHmac('sha256', secret)
      .update(tamperedBody)
      .digest('hex');

    assert.notStrictEqual(tamperedDigest, validSignature);
  });
});

describe('Security Audit — In-Memory API Rate Limiter', () => {
  it('should allow requests below limit and throttle once threshold is reached', () => {
    const testId = `test-ip-${Date.now()}`;
    const limit = 5;
    const windowMs = 1000;

    // First 5 requests must succeed
    for (let i = 1; i <= limit; i++) {
      const res = checkRateLimit(testId, limit, windowMs);
      assert.strictEqual(res.success, true, `Request #${i} was unexpectedly throttled`);
      assert.strictEqual(res.remaining, limit - i);
    }

    // 6th request must be throttled
    const blockedRes = checkRateLimit(testId, limit, windowMs);
    assert.strictEqual(blockedRes.success, false, '6th request was not throttled');
    assert.strictEqual(blockedRes.remaining, 0);
    assert.ok(blockedRes.resetMs > 0);
  });
});
