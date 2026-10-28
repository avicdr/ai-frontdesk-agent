// src/app/api/v1/webhooks/payments/route.ts
// Payment webhook handler for Razorpay (with legacy Cashfree fallback)
// Verifies HMAC signature and activates subscriptions idempotently

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyRazorpayWebhookSignature,
  verifyCashfreeWebhookSignature,
  activateSubscription,
} from '@/lib/billing/service';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const rzpSignature = request.headers.get('x-razorpay-signature');
  const cfTimestamp = request.headers.get('x-webhook-timestamp');
  const cfSignature = request.headers.get('x-webhook-signature');

  const admin = createSupabaseAdminClient();

  // 1. Check if this is a Razorpay webhook
  if (rzpSignature) {
    if (!verifyRazorpayWebhookSignature(rawBody, rzpSignature)) {
      console.warn('Invalid Razorpay webhook signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const eventId = paymentEntity?.id || `rzp:${Date.now()}`;

    // Deduplicate event
    const { data: existing } = await admin
      .from('webhook_events')
      .select('id')
      .eq('provider', 'razorpay')
      .eq('external_event_id', eventId)
      .maybeSingle();

    if (existing) {
      return new NextResponse('OK', { status: 200 });
    }

    await admin.from('webhook_events').upsert(
      {
        provider: 'razorpay',
        external_event_id: eventId,
        payload,
      },
      { onConflict: 'provider,external_event_id', ignoreDuplicates: true }
    );

    // Process successful payment
    if (event === 'order.paid' || event === 'payment.captured') {
      const rzpOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const paymentMethod = paymentEntity?.method || 'razorpay';

      if (rzpOrderId && paymentId) {
        // Find order by provider_order_id or id
        const { data: order } = await admin
          .from('payment_orders')
          .select('id, status, amount_inr, currency')
          .eq('provider_order_id', rzpOrderId)
          .maybeSingle();

        if (order && order.status !== 'completed') {
          await activateSubscription(order.id, paymentId, paymentMethod, paymentEntity);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  }

  // 2. Legacy Cashfree fallback
  if (cfSignature && cfTimestamp) {
    if (!verifyCashfreeWebhookSignature(rawBody, cfTimestamp, cfSignature)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const eventType = payload.type as string;
    const paymentData = (payload.data ?? {}) as any;

    if (eventType === 'PAYMENT_SUCCESS') {
      const orderId = paymentData?.order?.order_id as string;
      const cfPaymentId = paymentData?.payment?.cf_payment_id as string;
      const paymentMethod = paymentData?.payment?.payment_method as string;

      if (orderId && cfPaymentId) {
        const { data: order } = await admin
          .from('payment_orders')
          .select('id, amount_inr')
          .eq('id', orderId)
          .single();

        if (order) {
          await activateSubscription(orderId, cfPaymentId, paymentMethod, paymentData);
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  }

  return new NextResponse('Missing signature header', { status: 400 });
}
