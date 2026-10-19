// src/app/api/v1/webhooks/payments/route.ts
// Payment webhook handler for Cashfree
// Verifies signature, then activates subscriptions

import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhookSignature, activateSubscription } from '@/lib/billing/service';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get('x-webhook-timestamp') ?? '';
  const signature = request.headers.get('x-webhook-signature') ?? '';

  // 1. Verify signature
  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 3. Deduplicate
  const admin = createSupabaseAdminClient();
  const eventId = payload.cf_payment_id as string ?? `cf:${Date.now()}`;

  const { data: existing } = await admin
    .from('webhook_events')
    .select('id')
    .eq('provider', 'cashfree')
    .eq('external_event_id', eventId)
    .maybeSingle();

  if (existing) {
    return new NextResponse('OK', { status: 200 });
  }

  await admin.from('webhook_events').upsert(
    {
      provider: 'cashfree',
      external_event_id: eventId,
      payload,
    },
    { onConflict: 'provider,external_event_id', ignoreDuplicates: true }
  );

  // 4. Handle payment success
  const eventType = payload.type as string;
  const paymentData = (payload.data ?? {}) as any;

  if (eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_USER_DROPPED') {
    if (eventType === 'PAYMENT_SUCCESS') {
      const orderId = paymentData?.order?.order_id as string;
      const cfPaymentId = paymentData?.payment?.cf_payment_id as string;
      const paymentMethod = paymentData?.payment?.payment_method as string;

      if (orderId && cfPaymentId) {
        // Verify amount matches order (never trust webhook amount alone)
        const { data: order } = await admin
          .from('payment_orders')
          .select('amount_inr')
          .eq('id', orderId)
          .single();

        const webhookAmount = paymentData?.payment?.payment_amount as number;
        if (order && webhookAmount && Math.abs(webhookAmount - order.amount_inr) < 0.01) {
          await activateSubscription(orderId, cfPaymentId, paymentMethod, paymentData);
        }
      }
    }
  }

  // Always acknowledge
  return new NextResponse('OK', { status: 200 });
}
