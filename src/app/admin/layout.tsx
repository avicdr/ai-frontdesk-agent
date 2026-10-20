import { requireSuperAdmin } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const adminNavItems = [
  { href: '/admin', icon: '📊', label: 'Overview' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/subscribers', icon: '🏥', label: 'Subscribers' },
  { href: '/admin/revenue', icon: '💰', label: 'Revenue' },
  { href: '/admin/usage', icon: '🤖', label: 'AI Usage & Costs' },
  { href: '/admin/expirations', icon: '⏰', label: 'Expirations' },
  { href: '/admin/payments', icon: '💳', label: 'Payments' },
  { href: '/admin/integrations', icon: '🔗', label: 'Integration Health' },
  { href: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' },
];

import { AdminShell } from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireSuperAdmin();
  const displayName = profile?.full_name || user.email || 'Platform Super Admin';

  return (
    <AdminShell displayName={displayName} adminNavItems={adminNavItems}>
      {children}
    </AdminShell>
  );
}
