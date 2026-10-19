// src/app/api/v1/admin/actions/route.ts
// Platform super-admin action handlers (approve payment, suspend/activate clinic, extend subscription)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { activateSubscription } from '@/lib/billing/service';
import { z } from 'zod';
import { addDays } from 'date-fns';

import { isSuperAdminEmail } from '@/lib/security/admin';

const AdminActionSchema = z.object({
  action: z.enum([
    'approve_payment',
    'reject_payment',
    'suspend_clinic',
    'activate_clinic',
    'extend_subscription',
    'assign_plan',
    'approve_plan',
    'create_and_approve_payment',
  ]),
  orderId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  planId: z.string().optional(),
  reason: z.string().optional(),
  extensionDays: z.number().int().positive().optional(),
  durationDays: z.number().int().positive().optional(),
  amountInr: z.number().positive().optional(),
  utrNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // Verify user is super-admin
    const isSuperAdminByEmail = isSuperAdminEmail(user.email);
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_super_admin && !isSuperAdminByEmail) {
      return Errors.forbidden('Super-admin privileges required');
    }

    const body = await request.json();
    const parsed = AdminActionSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { action, orderId, organizationId, planId, reason, extensionDays, durationDays, amountInr, utrNumber } = parsed.data;

    // 1. Approve manual UPI payment
    if (action === 'approve_payment') {
      if (!orderId) return Errors.badRequest('orderId is required');

      const { data: order } = await admin
        .from('payment_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) return Errors.notFound('Order not found');

      const txnId = `manual-${order.utr_number || Date.now()}-${Date.now().toString(36)}`;
      const activation = await activateSubscription(
        orderId,
        txnId,
        'upi_manual',
        { approvedBy: user.id, approvedAt: new Date().toISOString() }
      );

      if (!activation.success) {
        return Errors.badRequest(activation.error || 'Failed to activate subscription');
      }

      await admin.from('audit_logs').insert({
        organization_id: order.organization_id,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'manual_payment_approved',
        entity_type: 'payment_order',
        entity_id: orderId,
        new_state: { utr: order.utr_number, amount: order.amount_inr },
      });

      return successResponse({ message: 'Payment approved and subscription activated!' });
    }

    // 2. Reject manual payment
    if (action === 'reject_payment') {
      if (!orderId) return Errors.badRequest('orderId is required');
      await admin
        .from('payment_orders')
        .update({ status: 'failed', failure_reason: reason || 'Rejected by administrator' })
        .eq('id', orderId);

      return successResponse({ message: 'Payment marked as rejected' });
    }

    // 3. Suspend Clinic
    if (action === 'suspend_clinic') {
      if (!organizationId) return Errors.badRequest('organizationId is required');
      await admin.from('organizations').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', organizationId);
      await admin.from('subscriptions').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('organization_id', organizationId);

      await admin.from('audit_logs').insert({
        organization_id: organizationId,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'clinic_suspended',
        entity_type: 'organization',
        entity_id: organizationId,
        new_state: { reason },
      });

      return successResponse({ message: 'Clinic suspended' });
    }

    // 4. Activate Clinic
    if (action === 'activate_clinic') {
      if (!organizationId) return Errors.badRequest('organizationId is required');
      await admin.from('organizations').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', organizationId);
      
      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingSub) {
        await admin.from('subscriptions').update({ status: 'active', updated_at: new Date().toISOString() }).eq('organization_id', organizationId);
      } else {
        // Auto-provision standard Pro plan if clinic has no existing subscription
        const { data: proPlan } = await admin
          .from('subscription_plans')
          .select('id')
          .eq('slug', 'pro')
          .maybeSingle();

        if (proPlan) {
          const now = new Date();
          await admin.from('subscriptions').insert({
            organization_id: organizationId,
            plan_id: proPlan.id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: addDays(now, 30).toISOString(),
            ai_requests_used: 0,
            ai_cost_used_inr: 0,
          });
        }
      }

      await admin.from('audit_logs').insert({
        organization_id: organizationId,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'clinic_activated',
        entity_type: 'organization',
        entity_id: organizationId,
      });

      return successResponse({ message: 'Clinic activated successfully' });
    }

    // 5. Extend subscription
    if (action === 'extend_subscription') {
      if (!organizationId || !extensionDays) return Errors.badRequest('organizationId and extensionDays are required');

      const { data: sub } = await admin
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (!sub) return Errors.notFound('Subscription not found');

      const currentExpiry = sub.expires_at ? new Date(sub.expires_at) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = addDays(baseDate, extensionDays);

      await admin
        .from('subscriptions')
        .update({
          status: 'active',
          expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      await admin.from('organizations').update({ status: 'active' }).eq('id', organizationId);

      await admin.from('audit_logs').insert({
        organization_id: organizationId,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'subscription_extended',
        entity_type: 'subscription',
        entity_id: sub.id,
        new_state: { extensionDays, newExpiry: newExpiry.toISOString() },
      });

      return successResponse({ message: `Subscription extended by ${extensionDays} days until ${newExpiry.toLocaleDateString('en-IN')}` });
    }

    // 6. Direct Plan Assignment / Approval by Admin
    if (action === 'assign_plan' || action === 'approve_plan') {
      if (!organizationId || !planId) {
        return Errors.badRequest('organizationId and planId are required');
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
      const planQuery = admin.from('subscription_plans').select('*');
      const { data: plan } = await (isUuid ? planQuery.eq('id', planId) : planQuery.eq('slug', planId)).maybeSingle();

      if (!plan) return Errors.notFound('Subscription plan not found');

      const now = new Date();
      const days = durationDays || 30;
      const expiresAt = addDays(now, days);
      const graceExpiresAt = addDays(expiresAt, plan.grace_period_days ?? 3);

      const { data: existingSub } = await admin
        .from('subscriptions')
        .select('id')
        .eq('organization_id', organizationId)
        .maybeSingle();

      let subId: string;
      if (existingSub) {
        const { data: updatedSub, error: updateError } = await admin
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            grace_expires_at: graceExpiresAt.toISOString(),
            last_renewed_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', existingSub.id)
          .select('id')
          .single();

        if (updateError) return Errors.internalError('Failed to update subscription');
        subId = updatedSub.id;
      } else {
        const { data: newSub, error: insertError } = await admin
          .from('subscriptions')
          .insert({
            organization_id: organizationId,
            plan_id: plan.id,
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            grace_expires_at: graceExpiresAt.toISOString(),
            last_renewed_at: now.toISOString(),
            ai_requests_used: 0,
            ai_cost_used_inr: 0,
            messages_used_inbound: 0,
            messages_used_outbound: 0,
          })
          .select('id')
          .single();

        if (insertError) return Errors.internalError('Failed to create subscription');
        subId = newSub.id;
      }

      // Ensure organization is active
      await admin
        .from('organizations')
        .update({ status: 'active', updated_at: now.toISOString() })
        .eq('id', organizationId);

      // Advance clinic profile onboarding
      await admin
        .from('clinic_profiles')
        .update({ onboarding_step: 8, onboarding_completed_at: now.toISOString(), updated_at: now.toISOString() })
        .eq('organization_id', organizationId);

      // Record transaction
      const txnId = `admin-assign-${Date.now()}`;
      await admin.from('payment_transactions').insert({
        organization_id: organizationId,
        provider: 'manual',
        provider_transaction_id: txnId,
        amount_inr: plan.price_inr,
        status: 'success',
        payment_method: 'admin_assignment',
        subscription_id: subId,
        raw_response: { assignedBy: user.id, planName: plan.name, durationDays: days },
      });

      // Audit log
      await admin.from('audit_logs').insert({
        organization_id: organizationId,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'plan_assigned_by_admin',
        entity_type: 'subscription',
        entity_id: subId,
        new_state: { planName: plan.name, durationDays: days, expiresAt: expiresAt.toISOString() },
      });

      return successResponse({
        message: `Plan "${plan.name}" successfully assigned for ${days} days! Clinic agent is now active.`,
        subscriptionId: subId,
        expiresAt: expiresAt.toISOString(),
      });
    }

    // 7. Create & Immediately Approve Payment
    if (action === 'create_and_approve_payment') {
      if (!organizationId || !planId) {
        return Errors.badRequest('organizationId and planId are required');
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
      const planQuery = admin.from('subscription_plans').select('*');
      const { data: plan } = await (isUuid ? planQuery.eq('id', planId) : planQuery.eq('slug', planId)).maybeSingle();

      if (!plan) return Errors.notFound('Subscription plan not found');

      const utr = utrNumber?.trim() || `MANUAL-${Date.now()}`;
      const amount = amountInr ?? plan.price_inr;

      const { data: order, error: orderErr } = await admin
        .from('payment_orders')
        .insert({
          organization_id: organizationId,
          plan_id: plan.id,
          provider: 'manual',
          amount_inr: amount,
          currency: 'INR',
          status: 'pending',
          utr_number: utr,
          idempotency_key: `manual:${organizationId}:${Date.now()}`,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        })
        .select('*')
        .single();

      if (orderErr || !order) {
        return Errors.internalError('Failed to create payment order');
      }

      const txnId = `manual-${utr}-${Date.now().toString(36)}`;
      const activation = await activateSubscription(
        order.id,
        txnId,
        'upi_manual',
        { approvedBy: user.id, approvedAt: new Date().toISOString() }
      );

      if (!activation.success) {
        return Errors.badRequest(activation.error || 'Failed to activate subscription');
      }

      await admin.from('organizations').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', organizationId);
      await admin.from('clinic_profiles').update({ onboarding_step: 8, onboarding_completed_at: new Date().toISOString() }).eq('organization_id', organizationId);

      await admin.from('audit_logs').insert({
        organization_id: organizationId,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'manual_payment_created_and_approved',
        entity_type: 'payment_order',
        entity_id: order.id,
        new_state: { utr, amount, planName: plan.name },
      });

      return successResponse({
        message: `Payment of ₹${amount} approved with UTR "${utr}". Plan "${plan.name}" is now active!`,
        orderId: order.id,
      });
    }

    return Errors.badRequest('Invalid action');
  } catch (err) {
    console.error('Admin action error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
