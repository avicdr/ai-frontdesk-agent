// src/lib/billing/service.ts
// UPI subscription billing service — Cashfree integration + manual UTR fallback
// Razorpay is explicitly excluded per requirements

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { addMonths, endOfMonth, setDate } from 'date-fns';

const CASHFREE_BASE_URL = process.env.PAYMENT_PROVIDER_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

// ============================================================
// Create a payment order
// ============================================================
export async function createPaymentOrder(
  organizationId: string,
  planId: string,
  organizationName: string,
  customerEmail: string,
  customerPhone: string
): Promise<{
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  upiId?: string;
  amount?: number;
  error?: string;
}> {
  const admin = createSupabaseAdminClient();

  // Get plan details
  const { data: plan } = await admin
    .from('subscription_plans')
    .select('price_inr, name')
    .eq('id', planId)
    .eq('is_active', true)
    .single();

  if (!plan) {
    return { success: false, error: 'Plan not found or not active.' };
  }

  const idempotencyKey = `order:${organizationId}:${planId}:${Date.now()}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create payment order record first
  const { data: order, error: orderError } = await admin
    .from('payment_orders')
    .insert({
      organization_id: organizationId,
      plan_id: planId,
      provider: process.env.PAYMENT_PROVIDER ?? 'manual',
      amount_inr: plan.price_inr,
      currency: 'INR',
      status: 'pending',
      idempotency_key: idempotencyKey,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Unable to create payment order.' };
  }

  // Try Cashfree integration if configured
  if (
    process.env.PAYMENT_PROVIDER === 'cashfree' &&
    process.env.CASHFREE_APP_ID &&
    process.env.CASHFREE_SECRET_KEY
  ) {
    try {
      const cfOrder = await createCashfreeOrder({
        orderId: order.id,
        amount: plan.price_inr,
        customerName: organizationName,
        customerEmail,
        customerPhone,
        planName: plan.name,
      });

      // Update order with provider details
      await admin
        .from('payment_orders')
        .update({
          provider_order_id: cfOrder.cf_order_id,
          status: 'processing',
          metadata: { payment_session_id: cfOrder.payment_session_id },
        })
        .eq('id', order.id);

      return {
        success: true,
        orderId: order.id,
        paymentUrl: cfOrder.payment_url,
        amount: plan.price_inr,
      };
    } catch (err) {
      // Fall through to manual UPI
      console.error('Cashfree order creation failed:', err);
    }
  }

  // Manual UPI fallback — always available
  return {
    success: true,
    orderId: order.id,
    upiId: process.env.PLATFORM_UPI_ID,
    amount: plan.price_inr,
  };
}

// ============================================================
// Cashfree API (Sandbox/Production)
// ============================================================
async function createCashfreeOrder(params: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  planName: string;
}): Promise<{ cf_order_id: string; payment_session_id: string; payment_url: string }> {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'x-api-version': '2023-08-01',
      'x-client-id': process.env.CASHFREE_APP_ID!,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: 'INR',
      order_note: `AI Front Desk — ${params.planName} Plan`,
      customer_details: {
        customer_id: params.orderId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json() as { message: string };
    throw new Error(err.message ?? `Cashfree API error: ${response.status}`);
  }

  return response.json() as Promise<{
    cf_order_id: string;
    payment_session_id: string;
    payment_url: string;
  }>;
}

// ============================================================
// Verify a Cashfree webhook
// ============================================================
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const data = timestamp + rawBody;
  const expected = crypto
    .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET!)
    .update(data)
    .digest('base64');
  return expected === signature;
}

// ============================================================
// Activate subscription after verified payment
// ============================================================
export async function activateSubscription(
  orderId: string,
  providerTransactionId: string,
  paymentMethod: string,
  rawResponse: Record<string, unknown>
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  const admin = createSupabaseAdminClient();

  // Get the order
  const { data: order } = await admin
    .from('payment_orders')
    .select('*, subscription_plans(grace_period_days, billing_cycle)')
    .eq('id', orderId)
    .single();

  if (!order) {
    return { success: false, error: 'Payment order not found.' };
  }

  if (order.status === 'completed') {
    // Idempotent — already processed
    return { success: true };
  }

  // Begin transactional activation
  const now = new Date();
  const expiresAt = calculateExpirationDate(now);
  const gracePeriodDays = order.subscription_plans?.grace_period_days ?? 3;
  const graceExpiresAt = new Date(expiresAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

  // 1. Record the transaction
  const { data: transaction, error: txError } = await admin
    .from('payment_transactions')
    .insert({
      payment_order_id: orderId,
      organization_id: order.organization_id,
      provider: order.provider,
      provider_transaction_id: providerTransactionId,
      amount_inr: order.amount_inr,
      status: 'success',
      payment_method: paymentMethod,
      raw_response: rawResponse,
    })
    .select('id')
    .single();

  if (txError || !transaction) {
    return { success: false, error: 'Failed to record payment transaction.' };
  }

  // 2. Create or update subscription (upsert)
  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('organization_id', order.organization_id)
    .maybeSingle();

  let subscriptionId: string;

  if (existing) {
    // Renewal
    const { error: renewError } = await admin
      .from('subscriptions')
      .update({
        plan_id: order.plan_id,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        grace_expires_at: graceExpiresAt.toISOString(),
        last_renewed_at: now.toISOString(),
        messages_used_inbound: 0,
        messages_used_outbound: 0,
        ai_requests_used: 0,
        ai_cost_used_inr: 0,
        updated_at: now.toISOString(),
      })
      .eq('id', existing.id);

    if (renewError) return { success: false, error: 'Failed to renew subscription.' };
    subscriptionId = existing.id;
  } else {
    // New subscription
    const { data: sub, error: subError } = await admin
      .from('subscriptions')
      .insert({
        organization_id: order.organization_id,
        plan_id: order.plan_id,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        grace_expires_at: graceExpiresAt.toISOString(),
        last_renewed_at: now.toISOString(),
      })
      .select('id')
      .single();

    if (subError || !sub) return { success: false, error: 'Failed to create subscription.' };
    subscriptionId = sub.id;
  }

  // 3. Update the payment order to completed
  await admin
    .from('payment_orders')
    .update({ status: 'completed' })
    .eq('id', orderId);

  // 4. Update transaction with subscription
  await admin
    .from('payment_transactions')
    .update({ subscription_id: subscriptionId })
    .eq('id', transaction.id);

  // 5. Generate receipt number
  const receiptNumber = `RCP-${Date.now()}-${nanoid(6).toUpperCase()}`;
  await admin.from('receipts').insert({
    organization_id: order.organization_id,
    payment_transaction_id: transaction.id,
    receipt_number: receiptNumber,
    amount_inr: order.amount_inr,
    plan_name: '', // Will be populated via join
    billing_period_start: now.toISOString().slice(0, 10),
    billing_period_end: expiresAt.toISOString().slice(0, 10),
  });

  // 6. Activate organization
  await admin
    .from('organizations')
    .update({ status: 'active', updated_at: now.toISOString() })
    .eq('id', order.organization_id);

  // 7. Audit log
  await admin.from('audit_logs').insert({
    organization_id: order.organization_id,
    actor_type: 'system',
    action: 'subscription_activated',
    entity_type: 'subscription',
    entity_id: subscriptionId,
    new_state: { planId: order.plan_id, expiresAt: expiresAt.toISOString() },
  });

  return { success: true, subscriptionId };
}

// ============================================================
// Submit manual UTR number (pending admin approval)
// ============================================================
export async function submitManualUtr(
  orderId: string,
  organizationId: string,
  utrNumber: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from('payment_orders')
    .update({
      utr_number: utrNumber,
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  if (error) {
    return { success: false, error: 'Unable to update payment order.' };
  }

  return { success: true };
}

// ============================================================
// Calculate expiration date (calendar-month arithmetic)
// ============================================================
function calculateExpirationDate(from: Date): Date {
  // Add exactly 1 calendar month
  const next = addMonths(from, 1);

  // Handle end-of-month edge cases
  // e.g., Jan 31 → Feb 28/29 (not March 3)
  const fromDay = from.getDate();
  const lastDayOfNextMonth = endOfMonth(next).getDate();

  if (fromDay > lastDayOfNextMonth) {
    return endOfMonth(next);
  }

  return next;
}
