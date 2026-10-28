// src/lib/security/tenant.ts
// Tenant resolution and authorization helpers
// NEVER trust tenant IDs from client requests — always resolve from session

import { createSupabaseServerClient, createSupabaseAdminClient, getServerUser } from '@/lib/supabase/server';
import type { Organization, OrganizationMembership, OrgRole } from '@/lib/types/database';
import type { User } from '@supabase/supabase-js';

export interface TenantContext {
  organization: Organization;
  membership: OrganizationMembership;
  role: OrgRole;
  isSuperAdmin: boolean;
}

/**
 * Resolves the current user's tenant context for a given organization.
 * Verifies the user is actually a member of the org (or platform super-admin).
 * Optimized to reuse verified user and run organization, profile, and membership checks in parallel.
 * Throws descriptive errors — callers must handle them.
 */
import { isSuperAdminEmail, isSuperAdminUser } from '@/lib/security/admin';

export async function resolveTenantContext(
  organizationId: string,
  providedUser?: User | null
): Promise<TenantContext> {
  const user = providedUser || (await getServerUser());

  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }

  const supabase = await createSupabaseServerClient();

  // Run organization, super-admin profile check, and org membership lookup concurrently
  const [orgRes, profileRes, memberRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single(),
    supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('organization_memberships')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  if (orgRes.error || !orgRes.data) {
    throw new Error('ORG_NOT_FOUND');
  }

  const isSuperAdmin = isSuperAdminUser(user, profileRes.data);

  // Super admins can access any org but still need a virtual context
  if (isSuperAdmin) {
    return {
      organization: orgRes.data,
      membership: memberRes.data || {
        id: 'super-admin',
        organization_id: organizationId,
        user_id: user.id,
        role: 'owner',
        invited_by: null,
        accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      role: (memberRes.data?.role as OrgRole) || 'owner',
      isSuperAdmin: true,
    };
  }

  // Regular user: verify membership
  if (!memberRes.data) {
    throw new Error('FORBIDDEN');
  }

  return {
    organization: orgRes.data,
    membership: memberRes.data,
    role: memberRes.data.role as OrgRole,
    isSuperAdmin: false,
  };
}

/**
 * Resolves the primary active tenant context for a user.
 * If preferredOrgId is given, verifies access to that organization.
 * Otherwise, picks the user's active membership (or platform org if super-admin).
 * Safe against multiple organization memberships (does not crash with PGRST116).
 */
export async function resolveUserPrimaryTenant(
  user: User,
  preferredOrgId?: string | null
): Promise<TenantContext> {
  const admin = createSupabaseAdminClient();

  if (preferredOrgId) {
    return resolveTenantContext(preferredOrgId, user);
  }

  // Lookup user's memberships without failing if multiple rows exist
  const { data: memberships } = await admin
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return resolveTenantContext(memberships[0].organization_id, user);
  }

  // If super-admin has no direct membership, find the first available clinic
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (isSuperAdminUser(user, profile)) {
    const { data: firstOrg } = await admin
      .from('organizations')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (firstOrg?.id) {
      return resolveTenantContext(firstOrg.id, user);
    }
  }

  throw new Error('NO_ORGANIZATION');
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
