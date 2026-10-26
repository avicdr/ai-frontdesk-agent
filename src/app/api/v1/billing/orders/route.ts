// src/app/api/v1/billing/orders/route.ts
// Create and list payment orders for subscriptions & admin verification (supports UPI and Crypto)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { resolveTenantContext } from '@/lib/security/tenant';
import { createPaymentOrder } from '@/lib/billing/service';
import { z } from 'zod';
import { isSuperAdminEmail } from '@/lib/security/admin';

const CreateOrderSchema = z.object({
  organizationId: z.string().uuid().optional(),
  planId: z.string().min(1),
  currency: z.enum(['INR', 'USD']).optional(),
  provider: z.enum(['cashfree', 'manual', 'crypto']).optional(),
  cryptoNetwork: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // Check if user is super-admin
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.is_super_admin || isSuperAdminEmail(user.email)) {
      // Super admin sees all orders across the platform for approval
      const { data: orders, error } = await admin
        .from('payment_orders')
        .select(`
          id,
          organization_id,
          plan_id,
          provider,
          amount_inr,
          currency,
          status,
          utr_number,
          metadata,
          created_at,
          organizations (name),
          subscription_plans (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching admin orders:', error);
        return Errors.internalError();
      }

      return successResponse({ orders: orders ?? [] });
    }

    // Regular clinic user: return only orders for their organization
    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return successResponse({ orders: [] });
    }

    const { data: orders } = await admin
      .from('payment_orders')
      .select(`
        id,
        organization_id,
        plan_id,
        provider,
        amount_inr,
        currency,
        status,
        utr_number,
        metadata,
        created_at,
        subscription_plans (name)
      `)
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false });

    return successResponse({ orders: orders ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { organizationId, planId, currency, provider, cryptoNetwork } = parsed.data;
    let targetOrgId = organizationId;
    if (!targetOrgId) {
      const { data: membership } = await admin
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership?.organization_id) {
        return Errors.badRequest('Organization not found for current user');
      }
      targetOrgId = membership.organization_id;
    }

    if (!targetOrgId) {
      return Errors.badRequest('Organization not found');
    }

    // Verify user belongs to this org (or is super admin)
    const tenant = await resolveTenantContext(targetOrgId, user);

    const result = await createPaymentOrder(
      targetOrgId,
      planId,
      tenant.organization.name,
      user.email ?? '',
      '',
      {
        currency,
        provider,
        cryptoNetwork,
      }
    );

    if (!result.success) {
      return Errors.badRequest(result.error || 'Failed to create payment order');
    }

    return successResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (message === 'FORBIDDEN') return Errors.forbidden();
    return Errors.internalError();
  }
}
