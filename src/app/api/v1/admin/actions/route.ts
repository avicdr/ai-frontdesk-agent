// src/app/api/v1/admin/actions/route.ts
// Platform super-admin action handlers (approve payment, suspend/activate clinic, extend subscription)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { activateSubscription } from '@/lib/billing/service';
import { z } from 'zod';
import { addDays } from 'date-fns';

const AdminActionSchema = z.object({
  action: z.enum(['approve_payment', 'reject_payment', 'suspend_clinic', 'activate_clinic', 'extend_subscription']),
  orderId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  reason: z.string().optional(),
  extensionDays: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // Verify user is super-admin
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return Errors.forbidden('Super-admin privileges required');
    }

    const body = await request.json();
    const parsed = AdminActionSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { action, orderId, organizationId, reason, extensionDays } = parsed.data;

    // 1. Approve manual UPI payment
    if (action === 'approve_payment') {
      if (!orderId) return Errors.badRequest('orderId is required');

      const { data: order } = await admin
        .from('payment_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) return Errors.notFound('Order not found');

      const txnId = `manual-${order.utr_number || Date.now()}`;
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
      await admin.from('subscriptions').update({ status: 'active', updated_at: new Date().toISOString() }).eq('organization_id', organizationId);

      await admin.from('audit_logs').insert({
        organization_id: organizationId,
        actor_type: 'super_admin',
        actor_id: user.id,
        action: 'clinic_activated',
        entity_type: 'organization',
        entity_id: organizationId,
      });

      return successResponse({ message: 'Clinic activated' });
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

    return Errors.badRequest('Invalid action');
  } catch (err) {
    console.error('Admin action error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
