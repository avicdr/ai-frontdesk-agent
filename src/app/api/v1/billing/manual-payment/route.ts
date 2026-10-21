// src/app/api/v1/billing/manual-payment/route.ts
// Handles submission of UPI UTR or Crypto Transaction Hash (TxID) for manual/crypto verification

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { submitManualPaymentProof } from '@/lib/billing/service';
import { z } from 'zod';

const ManualPaymentSchema = z.object({
  orderId: z.string().uuid(),
  // Accepts either utrNumber or txHash, length from 6 (short test/hash) to 128 (extended crypto tx hash)
  utrNumber: z.string().min(6).max(128).optional(),
  txHash: z.string().min(6).max(128).optional(),
  cryptoNetwork: z.string().optional(),
  senderWallet: z.string().optional(),
}).refine(data => !!(data.utrNumber || data.txHash), {
  message: 'Either utrNumber or txHash must be provided',
  path: ['utrNumber'],
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

    const { orderId, utrNumber, txHash, cryptoNetwork, senderWallet } = parsed.data;
    const reference = (txHash || utrNumber)!.trim();

    const res = await submitManualPaymentProof(orderId, membership.organization_id, reference, {
      cryptoNetwork,
      senderWallet,
    });

    if (!res.success) {
      return Errors.badRequest(res.error || 'Failed to submit payment verification reference');
    }

    // Create an audit log for admin review
    await admin.from('audit_logs').insert({
      organization_id: membership.organization_id,
      actor_type: 'user',
      actor_id: user.id,
      action: 'payment_proof_submitted',
      entity_type: 'payment_order',
      entity_id: orderId,
      new_state: {
        referenceNumber: reference,
        cryptoNetwork: cryptoNetwork || null,
        senderWallet: senderWallet || null,
      },
    });

    return successResponse({
      message: 'Payment reference submitted successfully. Your subscription will be activated upon verification.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
