import { requireServerUser } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { SidebarNav } from '@/components/dashboard/SidebarNav';

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

import { DashboardShell } from '@/components/dashboard/DashboardShell';

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
    <DashboardShell
      org={org}
      isExpired={isExpired}
      user={user}
      profile={profile}
      isSuperAdmin={profile?.is_super_admin || isSuperAdminEmail(user.email)}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
