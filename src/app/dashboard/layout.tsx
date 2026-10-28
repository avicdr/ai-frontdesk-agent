import { requireServerUser } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/security/admin';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
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
    redirect('/login?returnUrl=/dashboard');
  }

  const admin = createSupabaseAdminClient();

  // 1. Fetch user profile
  const { data: profile } = await admin
    .from('user_profiles')
    .select('full_name, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin = isSuperAdminUser(user, profile);

  // 2. Fetch user's organization membership
  const { data: membership } = await admin
    .from('organization_memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = membership?.organization_id;

  // If regular user has no organization -> redirect to onboarding immediately
  if (!orgId && !isSuperAdmin) {
    redirect('/onboarding');
  }

  // 3. If orgId exists, check clinic profile and onboarding status
  let org: { name?: string; slug?: string } | null = null;
  let sub: { status?: string; expires_at?: string } | null = null;

  if (orgId) {
    const [orgRes, profileRes, subRes] = await Promise.all([
      admin.from('organizations').select('id, name, slug, status').eq('id', orgId).maybeSingle(),
      admin.from('clinic_profiles').select('onboarding_completed_at, onboarding_step').eq('organization_id', orgId).maybeSingle(),
      admin.from('subscriptions').select('status, expires_at').eq('organization_id', orgId).maybeSingle(),
    ]);

    org = orgRes.data;
    const clinicProfile = profileRes.data;
    sub = subRes.data;

    // If regular user hasn't completed onboarding -> redirect to onboarding
    if (!isSuperAdmin && (!clinicProfile?.onboarding_completed_at || orgRes.data?.status === 'onboarding')) {
      redirect('/onboarding');
    }
  } else if (isSuperAdmin) {
    org = { name: 'Platform Admin View', slug: 'admin-view' };
  }

  const isExpired = sub ? (sub.status === 'expired' || sub.status === 'suspended') : false;

  return (
    <DashboardShell
      org={org ?? { name: 'My Dental Clinic', slug: 'my-clinic' }}
      isExpired={isExpired}
      user={user}
      profile={profile ?? { full_name: user.user_metadata?.full_name || 'Clinic Owner', is_super_admin: isSuperAdmin }}
      isSuperAdmin={isSuperAdmin}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}

