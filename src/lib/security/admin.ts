// src/lib/security/admin.ts
// Platform Super-Admin helper utilities

/**
 * Checks whether an email address is listed in the authorized super-admin configuration.
 * Strictly reads from environment variables (SUPER_ADMIN_EMAILS and ADMIN_EMAIL).
 * NEVER hardcodes credentials or backdoor emails in source code.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  if (!normalized) return false;

  const envEmails = [
    process.env.SUPER_ADMIN_EMAILS || '',
    process.env.ADMIN_EMAIL || '',
  ].join(',');

  const allowed = envEmails
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return allowed.includes(normalized);
}

/**
 * Verifies whether a user is a legitimate platform super-admin.
 * 1. Checks if profile.is_super_admin === true in the database.
 * 2. If relying on email match, requires that the user's email has been explicitly confirmed
 *    to prevent unverified public signups from claiming admin privileges.
 */
export function isSuperAdminUser(
  user?: { id?: string; email?: string | null; email_confirmed_at?: string | null; confirmed_at?: string | null } | null,
  profile?: { is_super_admin?: boolean | null } | null
): boolean {
  if (!user) return false;

  // DB-verified super-admin flag
  if (profile?.is_super_admin === true) {
    return true;
  }

  // Email-based check requires explicit email confirmation
  const isConfirmed = Boolean(user.email_confirmed_at || (user as any)?.confirmed_at);
  if (isConfirmed && isSuperAdminEmail(user.email)) {
    return true;
  }

  return false;
}

