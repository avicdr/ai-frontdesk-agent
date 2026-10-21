// tests/unit/crypto-billing.test.ts
// Unit tests for international crypto billing, pricing tiers, and explorer resolution

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isInternationalClient,
  PRICING_PLANS,
  CRYPTO_NETWORKS,
  getCryptoExplorerUrl,
} from '../../src/lib/constants/billing';

describe('International Crypto Billing & Pricing Tiers', () => {
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

  it('should enforce exact USD pricing: $100 Starter, $250 Second (Pro), $400 Third (Growth)', () => {
    const starter = PRICING_PLANS.find(p => p.id === 'starter');
    const pro = PRICING_PLANS.find(p => p.id === 'pro');
    const growth = PRICING_PLANS.find(p => p.id === 'growth');

    assert.ok(starter);
    assert.ok(pro);
    assert.ok(growth);

    // USD pricing per requirements
    assert.equal(starter.priceUsd, 100);
    assert.equal(starter.priceUsdDisplay, '$100');

    assert.equal(pro.priceUsd, 250);
    assert.equal(pro.priceUsdDisplay, '$250');

    assert.equal(growth.priceUsd, 400);
    assert.equal(growth.priceUsdDisplay, '$400');

    // Domestic INR pricing
    assert.equal(starter.priceInr, 999);
    assert.equal(pro.priceInr, 1599);
    assert.equal(growth.priceInr, 2999);
  });

  it('should provide supported crypto networks with deposit addresses', () => {
    const trc20 = CRYPTO_NETWORKS.find(n => n.id === 'usdt_trc20');
    const erc20 = CRYPTO_NETWORKS.find(n => n.id === 'usdt_erc20');
    const polygon = CRYPTO_NETWORKS.find(n => n.id === 'usdc_polygon');
    const btc = CRYPTO_NETWORKS.find(n => n.id === 'btc');

    assert.ok(trc20);
    assert.ok(erc20);
    assert.ok(polygon);
    assert.ok(btc);

    assert.equal(trc20.symbol, 'USDT');
    assert.ok(trc20.address.length > 10);
    assert.ok(erc20.address.startsWith('0x'));
    assert.ok(polygon.address.startsWith('0x'));
    assert.ok(btc.address.startsWith('bc1'));
  });

  it('should generate valid blockchain explorer links for TxIDs', () => {
    const tronTx = 'f89d31a547285a8647bb837b2d56a73c2a3e87d46538c3e80df046fb59dcfb12';
    const tronUrl = getCryptoExplorerUrl('usdt_trc20', tronTx);
    assert.equal(tronUrl, `https://tronscan.org/#/transaction/${tronTx}`);

    const ethTx = '0x9b32a7620bc2089ef04005ba97669d0c6444bfddfeee3e5d070b42d7675f28ef';
    const ethUrl = getCryptoExplorerUrl('usdt_erc20', ethTx);
    assert.equal(ethUrl, `https://etherscan.io/tx/${ethTx}`);

    const polyUrl = getCryptoExplorerUrl('usdc_polygon', ethTx);
    assert.equal(polyUrl, `https://polygonscan.com/tx/${ethTx}`);
  });
});
