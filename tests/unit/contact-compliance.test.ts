import test from 'node:test';
import assert from 'node:assert';
import { PRICING_PLANS } from '../../src/lib/constants/billing';

test('Razorpay Compliance & Subscription Pricing Verification', async (t) => {
  await t.test('Pricing plans should include Starter (₹999), Pro (₹1,499), Growth (₹2,999)', () => {
    const starter = PRICING_PLANS.find(p => p.id === 'starter');
    const pro = PRICING_PLANS.find(p => p.id === 'pro');
    const growth = PRICING_PLANS.find(p => p.id === 'growth');

    assert.ok(starter, 'Starter plan must exist');
    assert.ok(pro, 'Pro plan must exist');
    assert.ok(growth, 'Growth plan must exist');

    assert.strictEqual(starter.priceInr, 999);
    assert.strictEqual(starter.priceInrDisplay, '₹999');

    assert.strictEqual(pro.priceInr, 1499);
    assert.strictEqual(pro.priceInrDisplay, '₹1,499');

    assert.strictEqual(growth.priceInr, 2999);
    assert.strictEqual(growth.priceInrDisplay, '₹2,999');
  });

  await t.test('All plans must have clear SaaS quota and features', () => {
    for (const plan of PRICING_PLANS) {
      assert.ok(plan.chatsQuota > 0, `${plan.name} must have a positive chatsQuota`);
      assert.ok(plan.features.length >= 5, `${plan.name} must have detailed feature descriptions`);
      assert.ok(plan.description.toLowerCase().includes('clinic') || plan.description.toLowerCase().includes('practice'));
    }
  });
});
