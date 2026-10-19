// src/app/api/v1/billing/manual-payment/route.ts
// Handles submission of UPI UTR (Unique Transaction Reference) for manual approval

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { submitManualUtr } from '@/lib/billing/service';
import { z } from 'zod';

const ManualPaymentSchema = z.object({
  orderId: z.string().uuid(),
  utrNumber: z.string().min(8).max(30),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const body = await request.json();
    const parsed = ManualPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { orderId, utrNumber } = parsed.data;

    const res = await submitManualUtr(orderId, membership.organization_id, utrNumber);
    if (!res.success) {
      return Errors.badRequest(res.error || 'Failed to submit UTR');
    }

    // Create an audit log and notification for admin review
    await admin.from('audit_logs').insert({
      organization_id: membership.organization_id,
      actor_type: 'user',
      actor_id: user.id,
      action: 'manual_payment_submitted',
      entity_type: 'payment_order',
      entity_id: orderId,
      new_state: { utrNumber },
    });

    return successResponse({
      message: 'UTR submitted successfully. Your subscription will be activated upon admin verification.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
