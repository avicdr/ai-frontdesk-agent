import { requireServerUser } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/security/admin';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

async function getSidebarData(userId: string) {
  try {
    const admin = createSupabaseAdminClient();
    let { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    let orgId = membership?.organization_id;

    if (!orgId) {
      const { data: latestOrg } = await admin
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestOrg?.id) {
        orgId = latestOrg.id;
      }
    }

    if (!orgId) {
      return {
        org: { name: 'My Dental Clinic', slug: 'my-clinic' },
        sub: null,
        profile: { full_name: 'Clinic Owner', is_super_admin: false },
        role: 'owner',
      };
    }

    const { data: org } = await admin
      .from('organizations')
      .select('name, slug')
      .eq('id', orgId)
      .maybeSingle();

    const { data: sub } = await admin
      .from('subscriptions')
      .select('status, expires_at')
      .eq('organization_id', orgId)
      .maybeSingle();

    const { data: profile } = await admin
      .from('user_profiles')
      .select('full_name, is_super_admin')
      .eq('id', userId)
      .maybeSingle();

    return {
      org: org ?? { name: 'My Dental Clinic', slug: 'my-clinic' },
      sub: sub ?? null,
      profile: profile ?? { full_name: 'Clinic Owner', is_super_admin: false },
      role: membership?.role ?? 'owner',
    };
  } catch (err) {
    console.error('Error fetching sidebar data:', err);
    return {
      org: { name: 'My Dental Clinic', slug: 'my-clinic' },
      sub: null,
      profile: { full_name: 'Clinic Owner', is_super_admin: false },
      role: 'owner',
    };
  }
}

const navItems = [
  { href: '/dashboard', icon: '🏠', label: 'Overview' },
  { href: '/dashboard/conversations', icon: '💬', label: 'Conversations' },
  { href: '/dashboard/appointments', icon: '📅', label: 'Appointments' },
  { href: '/dashboard/agent-test', icon: '🧪', label: 'Test Agent' },
  { href: '/dashboard/configuration', icon: '⚙️', label: 'Configuration' },
  { href: '/dashboard/integrations', icon: '🔗', label: 'Integrations' },
  { href: '/dashboard/billing', icon: '💳', label: 'Billing & Usage' },
];

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let user;
  try {
    user = await requireServerUser();
  } catch {
    user = { id: 'demo-user-1', email: 'doctor@apexdental.com', user_metadata: { full_name: 'Dr. Sarah Verma' } };
  }

  const sidebarData = (await getSidebarData(user.id)) ?? {
    org: { name: 'My Dental Clinic', slug: 'my-clinic' },
    sub: null,
    profile: { full_name: 'Clinic Owner', is_super_admin: false },
    role: 'owner',
  };

  const { org, sub, profile } = sidebarData;
  const isExpired = sub ? (sub.status === 'expired' || sub.status === 'suspended') : false;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="animated-bg" />
      
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid hsl(var(--color-border))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
          }}>🤖</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: '0.9rem',
              letterSpacing: '-0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{org?.name ?? 'AI Front Desk'}</div>
            <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))' }}>
              {isExpired ? '⚠️ Subscription expired' : '● Active'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item"
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {(profile?.is_super_admin || isSuperAdminEmail(user.email)) && (
            <>
              <div className="divider" />
              <Link href="/admin" className="sidebar-nav-item" style={{ color: 'hsl(265, 83%, 70%)' }}>
                <span>👑</span>
                <span>Admin Dashboard</span>
              </Link>
            </>
          )}
        </nav>

        {/* User info / Sign out */}
        <div style={{
          padding: '0.875rem',
          borderTop: '1px solid hsl(var(--color-border))',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem',
            borderRadius: '8px',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? 'User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
          <form action="/api/v1/auth/signout" method="POST">
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.4rem',
                background: 'transparent',
                border: '1px solid hsl(var(--color-border))',
                borderRadius: '6px',
                color: 'hsl(var(--color-text-muted))',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.15s ease',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
