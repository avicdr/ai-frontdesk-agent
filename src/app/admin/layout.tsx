import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const adminNavItems = [
  { href: '/admin', icon: '📊', label: 'Overview' },
  { href: '/admin/subscribers', icon: '🏥', label: 'Subscribers' },
  { href: '/admin/revenue', icon: '💰', label: 'Revenue' },
  { href: '/admin/usage', icon: '🤖', label: 'AI Usage & Costs' },
  { href: '/admin/expirations', icon: '⏰', label: 'Expirations' },
  { href: '/admin/payments', icon: '💳', label: 'Payments' },
  { href: '/admin/integrations', icon: '🔗', label: 'Integration Health' },
  { href: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser();
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect('/dashboard');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="animated-bg" />

      <aside className="sidebar" style={{ background: 'hsl(265 40% 8%)', borderColor: 'hsl(265 25% 20%)' }}>
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid hsl(265 25% 20%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, hsl(265 83% 65%) 0%, hsl(221 83% 58%) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
          }}>👑</div>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '0.875rem' }}>
              Admin Console
            </div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(265, 50%, 60%)' }}>Platform Management</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
          {adminNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item"
              style={{ '--active-bg': 'hsla(265, 83%, 65%, 0.15)' } as React.CSSProperties}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          <div className="divider" />
          <Link href="/dashboard" className="sidebar-nav-item">
            <span>🏠</span>
            <span>Clinic Dashboard</span>
          </Link>
        </nav>

        <div style={{ padding: '0.875rem', borderTop: '1px solid hsl(265 25% 20%)' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(265, 50%, 60%)', textAlign: 'center' }}>
            Signed in as {profile.full_name ?? user.email}
          </div>
        </div>
      </aside>

      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
