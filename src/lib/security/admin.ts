// src/lib/security/admin.ts
// Platform Super-Admin helper utilities

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // Primary super-admin email
  if (normalized === 'admin@aifrontdesk.com') return true;

  // Environment-configured super-admin emails
  const envEmails = process.env.SUPER_ADMIN_EMAILS || '';
  const allowed = envEmails
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return allowed.includes(normalized);
}
