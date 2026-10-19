// src/lib/security/tenant.ts
// Tenant resolution and authorization helpers
// NEVER trust tenant IDs from client requests — always resolve from session

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import type { Organization, OrganizationMembership, OrgRole } from '@/lib/types/database';

export interface TenantContext {
  organization: Organization;
  membership: OrganizationMembership;
  role: OrgRole;
  isSuperAdmin: boolean;
}

/**
 * Resolves the current user's tenant context for a given organization.
 * Verifies the user is actually a member of the org.
 * Throws descriptive errors — callers must handle them.
 */
import { isSuperAdminEmail } from '@/lib/security/admin';

export async function resolveTenantContext(organizationId: string): Promise<TenantContext> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('UNAUTHENTICATED');
  }

  // Check super-admin status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin = (profile?.is_super_admin ?? false) || isSuperAdminEmail(user.email);

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('ORG_NOT_FOUND');
  }

  // Super admins can access any org but still need a virtual context
  if (isSuperAdmin) {
    return {
      organization: org,
      membership: {
        id: 'super-admin',
        organization_id: organizationId,
        user_id: user.id,
        role: 'owner',
        invited_by: null,
        accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      role: 'owner',
      isSuperAdmin: true,
    };
  }

  // Regular user: verify membership
  const { data: membership, error: memberError } = await supabase
    .from('organization_memberships')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    throw new Error('FORBIDDEN');
  }

  return {
    organization: org,
    membership,
    role: membership.role as OrgRole,
    isSuperAdmin: false,
  };
}

/**
 * Resolves the organization from a WhatsApp phone_number_id.
 * Used in webhook processing — phone_number_id comes from Meta, not from client.
 */
export async function resolveOrgFromWhatsAppNumber(
  phoneNumberId: string
): Promise<{ organizationId: string } | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('whatsapp_integrations')
    .select('organization_id')
    .eq('phone_number_id', phoneNumberId)
    .eq('status', 'connected')
    .single();

  if (!data) return null;
  return { organizationId: data.organization_id };
}

/**
 * Checks whether a role has minimum required permissions.
 */
export function requireRole(
  userRole: OrgRole,
  minimumRole: OrgRole,
  isSuperAdmin = false
): boolean {
  if (isSuperAdmin) return true;
  const hierarchy: OrgRole[] = ['viewer', 'staff', 'admin', 'owner'];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(minimumRole);
}

/**
 * Verifies the user is the authenticated owner of a given resource.
 * Throws FORBIDDEN if not.
 */
export function assertRole(
  userRole: OrgRole,
  minimumRole: OrgRole,
  isSuperAdmin = false
): void {
  if (!requireRole(userRole, minimumRole, isSuperAdmin)) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Loads full clinic context (profile, agentConfig, services, workingHours, bookingPolicy, knowledge, plan)
 * Used by WhatsApp webhook and Agent Test Playground.
 */
export async function loadClinicContext(organizationId: string) {
  const admin = createSupabaseAdminClient();

  const [profileRes, agentRes, servicesRes, hoursRes, policyRes, subRes, knowledgeRes] =
    await Promise.all([
      admin.from('clinic_profiles').select('*').eq('organization_id', organizationId).single(),
      admin
        .from('agent_configurations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('version', { ascending: false })
        .limit(1)
        .single(),
      admin.from('services').select('*').eq('organization_id', organizationId).eq('is_active', true),
      admin.from('working_hours').select('*').eq('organization_id', organizationId),
      admin.from('booking_policies').select('*').eq('organization_id', organizationId).maybeSingle(),
      admin
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('organization_id', organizationId)
        .maybeSingle(),
      admin
        .from('knowledge_documents')
        .select('title, content')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(10),
    ]);

  if (!profileRes.data) return null;

  const knowledge = (knowledgeRes.data ?? [])
    .map((d: { title: string; content: string }) => `## ${d.title}\n${d.content}`)
    .join('\n\n');

  return {
    clinicProfile: profileRes.data,
    agentConfig: agentRes.data ?? {
      assistant_name: 'Aria',
      tone: 'friendly',
      greeting_message: 'Hello! How can I assist you today?',
    },
    services: servicesRes.data ?? [],
    workingHours: hoursRes.data ?? [],
    bookingPolicy: policyRes.data ?? null,
    knowledge,
    plan: (subRes.data?.subscription_plans as Record<string, number>) ?? null,
    timezone: profileRes.data.timezone ?? 'Asia/Kolkata',
  };
}
