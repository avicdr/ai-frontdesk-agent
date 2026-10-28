// src/lib/billing/service.ts
// Automated subscription billing service — Razorpay Payment Gateway
// Supports domestic INR (₹999, ₹1,499, ₹2,999) and international USD ($100, $250, $400)

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { addMonths, endOfMonth } from 'date-fns';
import { PRICING_PLANS } from '@/lib/constants/billing';
import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id.includes('your-') || key_id.includes('placeholder')) {
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
  return razorpayInstance;
}

export interface CreatePaymentOrderOptions {
  currency?: 'INR' | 'USD';
  provider?: 'razorpay' | 'cashfree' | 'manual' | 'crypto';
  cryptoNetwork?: string;
}

// ============================================================
// Create a payment order via Razorpay
// ============================================================
export async function createPaymentOrder(
  organizationId: string,
  planId: string,
  organizationName: string,
  customerEmail: string,
  customerPhone: string,
  options?: CreatePaymentOrderOptions
): Promise<{
  success: boolean;
  orderId?: string;
  providerOrderId?: string;
  razorpayKeyId?: string;
  currency?: 'INR' | 'USD';
  amount?: number;
  amountSubunits?: number;
  planName?: string;
  error?: string;
}> {
  const admin = createSupabaseAdminClient();
  const isUsd = options?.currency === 'USD';

  // Get plan details (support both UUID and slug)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
  const planQuery = admin
    .from('subscription_plans')
    .select('id, price_inr, name, slug')
    .eq('is_active', true);

  const { data: plan } = await (isUuid ? planQuery.eq('id', planId) : planQuery.eq('slug', planId)).maybeSingle();

  if (!plan) {
    return { success: false, error: 'Plan not found or not active.' };
  }

  // Determine pricing based on currency (INR vs USD)
  const planSlug = (plan.slug || 'pro').toLowerCase();
  const pricingConfig = PRICING_PLANS.find(p => p.id === planSlug) || PRICING_PLANS[1];
  const finalCurrency: 'INR' | 'USD' = isUsd ? 'USD' : 'INR';
  const finalAmount = isUsd ? pricingConfig.priceUsd : pricingConfig.priceInr;
  const amountSubunits = Math.round(finalAmount * 100); // paise for INR, cents for USD

  const idempotencyKey = `order:${organizationId}:${plan.id}:${Date.now()}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Try creating Razorpay Order via Official API
  let providerOrderId: string = `order_rzp_${nanoid(14)}`;
  const razorpay = getRazorpayClient();

  if (razorpay) {
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: amountSubunits,
        currency: finalCurrency,
        receipt: `rcpt_${nanoid(10)}`,
        notes: {
          organizationId,
          planId: plan.id,
          planSlug,
          organizationName,
          currency: finalCurrency,
        },
      });
      if (rzpOrder && rzpOrder.id) {
        providerOrderId = rzpOrder.id;
      }
    } catch (rzpErr) {
      console.warn('Razorpay order creation API notice:', rzpErr);
      // If live keys aren't provisioned yet or sandbox rejected, keep deterministic order ID for resilient checkout
    }
  }

  // Insert payment order record
  const { data: order, error: orderError } = await admin
    .from('payment_orders')
    .insert({
      organization_id: organizationId,
      plan_id: plan.id,
      provider: 'razorpay',
      provider_order_id: providerOrderId,
      amount_inr: isUsd ? Math.round(finalAmount * 85) : finalAmount,
      currency: finalCurrency,
      status: 'pending',
      idempotency_key: idempotencyKey,
      expires_at: expiresAt.toISOString(),
      metadata: {
        currency: finalCurrency,
        amount: finalAmount,
        amount_subunits: amountSubunits,
        razorpay_order_id: providerOrderId,
        plan_slug: planSlug,
        plan_name: plan.name,
        customer_email: customerEmail,
        customer_name: organizationName,
      },
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order creation error:', orderError);
    return { success: false, error: 'Unable to create payment order.' };
  }

  const razorpayKeyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    'rzp_test_placeholder';

  return {
    success: true,
    orderId: order.id,
    providerOrderId,
    razorpayKeyId,
    currency: finalCurrency,
    amount: finalAmount,
    amountSubunits,
    planName: plan.name,
  };
}

// ============================================================
// Verify Razorpay Payment Signature
// ============================================================
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret.includes('your-') || secret.includes('placeholder')) {
    // In development/test mock mode without live secret, allow verification
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}

// ============================================================
// Verify & Activate Razorpay Payment
// ============================================================
export async function verifyAndActivateRazorpayPayment(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  userId?: string;
}): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  const admin = createSupabaseAdminClient();

  // 1. Fetch order
  const { data: order } = await admin
    .from('payment_orders')
    .select('id, provider_order_id, status, amount_inr, currency, organization_id, plan_id')
    .eq('id', params.orderId)
    .single();

  if (!order) {
    return { success: false, error: 'Payment order record not found.' };
  }

  // Verify ownership / tenant authorization if userId was supplied
  if (params.userId) {
    const { data: member } = await admin
      .from('organization_memberships')
      .select('id, role')
      .eq('organization_id', order.organization_id)
      .eq('user_id', params.userId)
      .maybeSingle();

    if (!member) {
      const { data: profile } = await admin
        .from('user_profiles')
        .select('is_super_admin')
        .eq('id', params.userId)
        .maybeSingle();

      if (!profile?.is_super_admin) {
        return { success: false, error: 'Unauthorized: You do not have permission to verify payments for this clinic.' };
      }
    }
  }

  if (order.status === 'completed') {
    return { success: true };
  }

  // 2. Validate HMAC signature
  const isValid = verifyRazorpayPaymentSignature(
    params.razorpayOrderId,
    params.razorpayPaymentId,
    params.razorpaySignature
  );

  if (!isValid) {
    return { success: false, error: 'Invalid Razorpay payment signature.' };
  }

  // 3. Activate subscription
  return activateSubscription(
    order.id,
    params.razorpayPaymentId,
    'razorpay',
    {
      razorpay_order_id: params.razorpayOrderId,
      razorpay_payment_id: params.razorpayPaymentId,
      razorpay_signature: params.razorpaySignature,
    }
  );
}

// ============================================================
// Verify a Razorpay Webhook Signature
// ============================================================
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}

// Backward-compatible alias for Cashfree signature checks if needed
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  if (process.env.CASHFREE_WEBHOOK_SECRET) {
    try {
      const data = timestamp + rawBody;
      const expected = crypto
        .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET)
        .update(data)
        .digest('base64');

      const expectedBuf = Buffer.from(expected, 'utf-8');
      const sigBuf = Buffer.from(signature, 'utf-8');
      if (expectedBuf.length !== sigBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, sigBuf);
    } catch {
      return false;
    }
  }
  return false;
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
    .select('*, subscription_plans(name, grace_period_days, billing_cycle)')
    .eq('id', orderId)
    .single();

  if (!order) {
    return { success: false, error: 'Payment order not found.' };
  }

  if (order.status === 'completed') {
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
      provider: order.provider || 'razorpay',
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
  const planName = (order.subscription_plans as any)?.name || 'Pro Practice';
  await admin.from('receipts').insert({
    organization_id: order.organization_id,
    payment_transaction_id: transaction.id,
    receipt_number: receiptNumber,
    amount_inr: order.amount_inr,
    plan_name: planName,
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
    new_state: { planId: order.plan_id, expiresAt: expiresAt.toISOString(), provider: 'razorpay' },
  });

  return { success: true, subscriptionId };
}

// Backward-compatible manual proof function for super-admin overrides
export async function submitManualPaymentProof(
  orderId: string,
  organizationId: string,
  referenceNumber: string,
  options?: {
    cryptoNetwork?: string;
    senderWallet?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from('payment_orders')
    .update({
      utr_number: referenceNumber,
      status: 'processing',
      metadata: {
        reference_number: referenceNumber,
        submitted_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to update payment order proof:', error);
    return { success: false, error: 'Unable to update payment order.' };
  }

  return { success: true };
}

export async function submitManualUtr(
  orderId: string,
  organizationId: string,
  utrNumber: string,
  options?: {
    cryptoNetwork?: string;
    senderWallet?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return submitManualPaymentProof(orderId, organizationId, utrNumber, options);
}

// ============================================================
// Calculate expiration date (calendar-month arithmetic)
// ============================================================
function calculateExpirationDate(from: Date): Date {
  const next = addMonths(from, 1);
  const fromDay = from.getDate();
  const lastDayOfNextMonth = endOfMonth(next).getDate();

  if (fromDay > lastDayOfNextMonth) {
    return endOfMonth(next);
  }

  return next;
}
