// src/app/api/v1/billing/route.ts
// Clinic billing overview: real subscription status, quota usage, and payment transaction history

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // 1. Resolve user organization membership
    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return successResponse({
        subscription: null,
        orders: [],
        organization: null,
      });
    }

    const orgId = membership.organization_id;

    // 2. Fetch subscription, plans, and payment orders in parallel
    const [orgRes, subRes, ordersRes] = await Promise.all([
      admin.from('organizations').select('id, name, slug, status').eq('id', orgId).maybeSingle(),
      admin
        .from('subscriptions')
        .select(`
          id,
          status,
          started_at,
          expires_at,
          grace_expires_at,
          ai_requests_used,
          ai_cost_used_inr,
          messages_used_inbound,
          subscription_plans (
            id,
            name,
            slug,
            price_inr,
            included_ai_requests,
            included_inbound_messages
          )
        `)
        .eq('organization_id', orgId)
        .maybeSingle(),
      admin
        .from('payment_orders')
        .select(`
          id,
          plan_id,
          provider,
          amount_inr,
          currency,
          status,
          utr_number,
          created_at,
          subscription_plans (
            name,
            slug
          )
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const sub = subRes.data;
    let daysRemaining: number | null = null;
    if (sub?.expires_at) {
      daysRemaining = Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    return successResponse({
      organization: orgRes.data,
      subscription: sub ? {
        ...sub,
        daysRemaining,
      } : null,
      orders: ordersRes.data ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error fetching billing data:', err);
    return Errors.internalError();
  }
}
