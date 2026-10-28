// src/app/api/v1/billing/verify/route.ts
// Verifies Razorpay payment signature and activates subscription

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser } from '@/lib/supabase/server';
import { verifyAndActivateRazorpayPayment } from '@/lib/billing/service';
import { z } from 'zod';

const VerifyPaymentSchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();

    const body = await request.json();
    const parsed = VerifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    const result = await verifyAndActivateRazorpayPayment({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId: user.id,
    });

    if (!result.success) {
      return Errors.badRequest(result.error || 'Failed to verify payment with Razorpay');
    }

    return successResponse({
      message: 'Payment verified successfully. Your subscription is active!',
      subscriptionId: result.subscriptionId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error verifying Razorpay payment:', err);
    return Errors.internalError();
  }
}
