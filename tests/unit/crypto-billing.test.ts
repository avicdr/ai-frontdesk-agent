// tests/unit/crypto-billing.test.ts
// Unit tests for Razorpay payment integration, domestic/international pricing tiers, and HMAC verification

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  isInternationalClient,
  PRICING_PLANS,
} from '../../src/lib/constants/billing';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../../src/lib/billing/service';

describe('Razorpay Billing & Pricing Tiers', () => {
  it('should identify international clients based on country or timezone', () => {
    // Domestic India
    assert.equal(isInternationalClient('IN', 'Asia/Kolkata'), false);
    assert.equal(isInternationalClient('India', 'Asia/Calcutta'), false);
    assert.equal(isInternationalClient(null, 'Asia/Kolkata'), false);

    // International
    assert.equal(isInternationalClient('US', 'America/New_York'), true);
    assert.equal(isInternationalClient('GB', 'Europe/London'), true);
    assert.equal(isInternationalClient('AE', 'Asia/Dubai'), true);
    assert.equal(isInternationalClient(null, 'America/Los_Angeles'), true);
    assert.equal(isInternationalClient('CA', null), true);
  });

  it('should enforce exact USD pricing: $100 Starter, $250 Pro, $400 Growth and INR: ₹999 Starter, ₹1,499 Pro, ₹2,999 Growth', () => {
    const starter = PRICING_PLANS.find(p => p.id === 'starter');
    const pro = PRICING_PLANS.find(p => p.id === 'pro');
    const growth = PRICING_PLANS.find(p => p.id === 'growth');

    assert.ok(starter);
    assert.ok(pro);
    assert.ok(growth);

    // USD pricing
    assert.equal(starter.priceUsd, 100);
    assert.equal(starter.priceUsdDisplay, '$100');

    assert.equal(pro.priceUsd, 250);
    assert.equal(pro.priceUsdDisplay, '$250');

    assert.equal(growth.priceUsd, 400);
    assert.equal(growth.priceUsdDisplay, '$400');

    // Domestic INR pricing
    assert.equal(starter.priceInr, 999);
    assert.equal(starter.priceInrDisplay, '₹999');

    assert.equal(pro.priceInr, 1499);
    assert.equal(pro.priceInrDisplay, '₹1,499');

    assert.equal(growth.priceInr, 2999);
    assert.equal(growth.priceInrDisplay, '₹2,999');
  });

  it('should correctly calculate Razorpay subunit amounts (paise and cents)', () => {
    const starter = PRICING_PLANS.find(p => p.id === 'starter')!;
    const pro = PRICING_PLANS.find(p => p.id === 'pro')!;
    const growth = PRICING_PLANS.find(p => p.id === 'growth')!;

    // INR paise
    assert.equal(starter.priceInr * 100, 99900);
    assert.equal(pro.priceInr * 100, 149900);
    assert.equal(growth.priceInr * 100, 299900);

    // USD cents
    assert.equal(starter.priceUsd * 100, 10000);
    assert.equal(pro.priceUsd * 100, 25000);
    assert.equal(growth.priceUsd * 100, 40000);
  });

  it('should verify Razorpay payment HMAC-SHA256 signatures accurately', () => {
    const secret = 'rzp_test_secret_12345';
    process.env.RAZORPAY_KEY_SECRET = secret;

    const orderId = 'order_DAvDpk96W7DYiK';
    const paymentId = 'pay_29QQoUBi66xm2f';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Valid signature
    assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, expectedSignature), true);

    // Tampered signature or order ID
    assert.equal(verifyRazorpayPaymentSignature('tampered_order', paymentId, expectedSignature), false);
    assert.equal(verifyRazorpayPaymentSignature(orderId, paymentId, 'invalid_sig'), false);
  });

  it('should verify Razorpay webhook signatures accurately', () => {
    const webhookSecret = 'whsec_9876543210';
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

    const rawBody = JSON.stringify({
      entity: 'event',
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: 'pay_ABC123',
            order_id: 'order_XYZ456',
            amount: 149900,
            status: 'captured',
          },
        },
      },
    });

    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    assert.equal(verifyRazorpayWebhookSignature(rawBody, validSignature), true);
    assert.equal(verifyRazorpayWebhookSignature(rawBody, 'tampered_signature'), false);
  });

  it('should enforce strict regional isolation between Indian and International clients', () => {
    // 1. Indian client simulation
    const isIndia = isInternationalClient('IN', 'Asia/Kolkata');
    assert.equal(isIndia, false);
    // Indian plans must only present INR prices
    const indianPlans = PRICING_PLANS.map(p => ({
      name: p.name,
      priceDisplay: !isIndia ? p.priceInrDisplay : p.priceUsdDisplay,
    }));
    assert.equal(indianPlans[0].priceDisplay, '₹999');
    assert.equal(indianPlans[1].priceDisplay, '₹1,499');
    assert.equal(indianPlans[2].priceDisplay, '₹2,999');
    assert.ok(!indianPlans.some(p => p.priceDisplay.includes('$')));

    // 2. International client simulation
    const isIntl = isInternationalClient('US', 'America/New_York');
    assert.equal(isIntl, true);
    // International plans must only present USD prices
    const intlPlans = PRICING_PLANS.map(p => ({
      name: p.name,
      priceDisplay: isIntl ? p.priceUsdDisplay : p.priceInrDisplay,
    }));
    assert.equal(intlPlans[0].priceDisplay, '$100');
    assert.equal(intlPlans[1].priceDisplay, '$250');
    assert.equal(intlPlans[2].priceDisplay, '$400');
    assert.ok(!intlPlans.some(p => p.priceDisplay.includes('₹')));
  });
});
