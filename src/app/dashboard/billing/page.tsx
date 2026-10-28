'use client';

// src/app/dashboard/billing/page.tsx
// Clinic Billing & Usage Dashboard — Razorpay Payment Gateway Integration
// Supports Domestic INR (₹999, ₹1,499, ₹2,999) & International USD ($100, $250, $400)
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

import React, { useState, useEffect } from 'react';
import { PRICING_PLANS, isInternationalClient } from '@/lib/constants/billing';
import { openRazorpayModal } from '@/lib/billing/razorpay-client';

interface SubscriptionData {
  id: string;
  status: 'trial' | 'active' | 'grace_period' | 'expired' | 'suspended' | 'cancelled';
  started_at: string;
  expires_at: string | null;
  grace_expires_at: string | null;
  ai_requests_used: number;
  ai_cost_used_inr: number;
  messages_used_inbound: number;
  daysRemaining: number | null;
  subscription_plans: {
    id: string;
    name: string;
    slug: string;
    price_inr: number;
    included_ai_requests: number;
    included_inbound_messages: number;
  } | null;
}

interface PaymentOrderData {
  id: string;
  plan_id: string;
  provider: string;
  amount_inr: number;
  currency: string;
  status: string;
  utr_number: string | null;
  metadata?: any;
  created_at: string;
  subscription_plans: {
    name: string;
    slug: string;
  } | null;
}

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'growth'>('pro');
  const [isInternational, setIsInternational] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<PaymentOrderData[]>([]);
  const [orgName, setOrgName] = useState<string>('');

  const currentPlans = PRICING_PLANS.map(p => ({
    id: p.id,
    name: p.name,
    price: isInternational ? p.priceUsdDisplay : p.priceInrDisplay,
    priceVal: isInternational ? p.priceUsd : p.priceInr,
    chatsQuota: p.chatsQuota,
    popular: p.id === 'pro',
    description: p.description,
    features: p.features,
  }));

  const fetchBillingData = async () => {
    try {
      const res = await fetch('/api/v1/billing');
      const json = await res.json();
      if (json.success && json.data) {
        setSubscription(json.data.subscription);
        setOrders(json.data.orders || []);
        if (json.data.organization?.name) {
          setOrgName(json.data.organization.name);
        }

        // Detect if org is international
        const orgCountry = json.data.organization?.country;
        const orgTimezone = json.data.organization?.timezone;
        const isIntl = isInternationalClient(orgCountry, orgTimezone);
        setIsInternational(isIntl);

        if (json.data.subscription?.subscription_plans?.slug) {
          const currentSlug = json.data.subscription.subscription_plans.slug;
          if (['starter', 'pro', 'growth'].includes(currentSlug)) {
            setSelectedPlan(currentSlug as 'starter' | 'pro' | 'growth');
          }
        }
      }
    } catch (e) {
      console.error('Error fetching billing data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();

    // Check geo IP as fallback
    fetch('/api/v1/geo')
      .then(r => r.json())
      .then(geo => {
        if (geo?.data?.isInternational) {
          setIsInternational(true);
        }
      })
      .catch(() => {});
  }, []);

  const handlePayWithRazorpay = async (planIdToPay?: 'starter' | 'pro' | 'growth') => {
    const targetPlan = planIdToPay || selectedPlan;
    setIsProcessingPayment(true);
    setSubmitError(null);

    try {
      const orderRes = await fetch('/api/v1/billing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan,
          currency: isInternational ? 'USD' : 'INR',
          provider: 'razorpay',
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.data?.orderId) {
        throw new Error(orderJson.error?.message || 'Failed to initiate Razorpay payment order.');
      }

      const { orderId, providerOrderId, amountSubunits, currency, planName, razorpayKeyId } = orderJson.data;

      await openRazorpayModal({
        key: razorpayKeyId,
        amount: amountSubunits,
        currency,
        name: 'Arenova AI Front Desk',
        description: `${planName || 'Practice'} Subscription`,
        order_id: providerOrderId,
        prefill: {
          name: orgName,
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/v1/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (verifyJson.success) {
              setPaymentSuccessMessage(`Payment successful! Your ${planName} subscription is now active.`);
              fetchBillingData();
            } else {
              setSubmitError(verifyJson.error?.message || 'Payment verification failed');
            }
          } catch (err: any) {
            setSubmitError(err?.message || 'Failed to verify payment with server.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      });
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || 'Unable to open Razorpay payment gateway.');
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">● Active Subscription</span>;
      case 'trial':
        return <span className="badge badge-warning">● 3-Day Free Trial</span>;
      case 'grace_period':
        return <span className="badge badge-warning">Grace Period</span>;
      case 'expired':
        return <span className="badge badge-danger">Subscription Expired</span>;
      default:
        return <span className="badge badge-neutral">No Active Plan</span>;
    }
  };

  const quotaLimit =
    subscription?.subscription_plans?.included_ai_requests ||
    subscription?.subscription_plans?.included_inbound_messages ||
    500;
  const quotaUsed = Math.max(subscription?.ai_requests_used || 0, subscription?.messages_used_inbound || 0);
  const quotaPercent = quotaLimit > 0 ? Math.min(100, Math.round((quotaUsed / quotaLimit) * 100)) : 0;

  const selectedPlanDetails = currentPlans.find(p => p.id === selectedPlan) || currentPlans[1];
  const selectedPlanConfig = PRICING_PLANS.find(p => p.id === selectedPlan) || PRICING_PLANS[1];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#F3F0E8]/08 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]"></span>
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase">
              Financial &amp; Resource Operations
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[#F3F0E8]">
            Subscription &amp; Usage
          </h1>
          <p className="text-sm text-[#9E9B93] mt-1">
            {orgName ? <span className="text-[#D0CBC1] font-medium">{orgName} • </span> : ''}
            {isInternational
              ? 'International billing powered by Razorpay (USD Cards & Netbanking).'
              : 'Domestic practice billing powered by Razorpay (Instant UPI, Cards & Netbanking).'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Toggle for convenience */}
          <div className="inline-flex items-center bg-[#1C1916] border border-[#F3F0E8]/10 rounded-xl p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setIsInternational(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !isInternational
                  ? 'bg-[#E84B2C] text-[#F3F0E8] font-bold shadow-[0_0_10px_#E84B2C]'
                  : 'text-[#9E9B93] hover:text-[#F3F0E8]'
              }`}
            >
              INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setIsInternational(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isInternational
                  ? 'bg-[#E84B2C] text-[#F3F0E8] font-bold shadow-[0_0_10px_#E84B2C]'
                  : 'text-[#9E9B93] hover:text-[#F3F0E8]'
              }`}
            >
              USD ($)
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handlePayWithRazorpay(selectedPlan)}
            disabled={isProcessingPayment}
          >
            <span className="text-xs">💳</span>
            <span>
              {isProcessingPayment
                ? 'Opening Razorpay...'
                : `Pay ${isInternational ? selectedPlanConfig.priceUsdDisplay : selectedPlanConfig.priceInrDisplay} via Razorpay`}
            </span>
          </button>
        </div>
      </div>

      {paymentSuccessMessage && (
        <div className="p-4 rounded-xl bg-[#63C7A2]/10 border border-[#63C7A2]/25 text-[#63C7A2] text-sm flex items-center gap-3">
          <span className="text-base">✦</span>
          <span>{paymentSuccessMessage}</span>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-xl bg-[#E84B2C]/10 border border-[#E84B2C]/25 text-[#E84B2C] text-sm flex items-center justify-between gap-3">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-xs text-[#E87A38] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Subscription Status & Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <div className="card p-6 lg:col-span-2 relative overflow-hidden bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#E84B2C]/10 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="mb-2.5">
                {getStatusBadge(subscription?.status)}
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {subscription?.subscription_plans?.name || (subscription?.status === 'trial' ? 'Pro Trial Tier' : 'No Active Plan')}
              </h2>
              <div className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-2 flex-wrap">
                {subscription ? (
                  subscription.status === 'trial' ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
                      <span className="text-[#E87A38]">⏱️</span> 3-Day Free Operational Trial • {subscription.daysRemaining != null ? `${subscription.daysRemaining} days remaining` : 'Active'}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-[var(--color-text-secondary)] font-semibold bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)]">
                        {isInternational
                          ? `${selectedPlanConfig.priceUsdDisplay} USD / month`
                          : `₹${(subscription.subscription_plans?.price_inr || selectedPlanConfig.priceInr).toLocaleString('en-IN')} / month`}
                      </span>
                      <span className="text-[var(--color-text-muted)]">•</span>
                      <span className="text-[var(--color-text-secondary)]">
                        {subscription.expires_at ? `Renews on ${new Date(subscription.expires_at).toLocaleDateString('en-IN')}` : 'Monthly recurring billing'}
                      </span>
                    </>
                  )
                ) : (
                  <span>Select an active tier below to establish AI front desk availability</span>
                )}
              </div>
            </div>

            {/* Days Remaining Pill Box */}
            <div
              style={{
                background: 'var(--color-surface-secondary, #1C1916)',
                border: '1px solid var(--color-border-standard)',
                borderRadius: '14px',
                padding: '0.85rem 1.25rem',
                minWidth: '150px',
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#63C7A2] animate-pulse" />
                <span>Days Remaining</span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginTop: '0.25rem',
                  color: (subscription?.daysRemaining ?? 0) > 3 ? '#63C7A2' : '#E84B2C',
                }}
              >
                {subscription?.daysRemaining ?? 0}
              </div>
              <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-1">
                {(subscription?.daysRemaining ?? 0) > 3 ? 'Active Subscription' : 'Renewal required'}
              </div>
            </div>
          </div>

          {/* Quota Progress Meter */}
          <div className="pt-5 border-t border-[var(--color-border-subtle)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs mb-2.5">
              <span className="text-[var(--color-text-muted)] font-medium flex items-center gap-1.5">
                <span className="text-[#E87A38]">💬</span> Monthly AI Conversation Quota
              </span>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[var(--color-surface-secondary)] border border-[var(--color-border-standard)] text-[var(--color-text-primary)]">
                {subscription ? `${quotaUsed.toLocaleString()} / ${quotaLimit.toLocaleString()} chats (${quotaPercent}%)` : '0 / 0 chats'}
              </span>
            </div>
            <div className="h-2.5 w-full bg-[var(--color-surface-raised,#211B17)] rounded-full overflow-hidden p-0.5 border border-[var(--color-border-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#C86938] via-[#E84B2C] to-[#E87A38] shadow-[0_0_12px_rgba(232,75,44,0.4)]"
                style={{ width: `${Math.max(3, quotaPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI Cost Efficiency Telemetry Card */}
        <div className="card p-6 flex flex-col justify-between bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
              <h3 className="font-heading text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <span className="text-[#E87A38]">✦</span> Engine Telemetry
              </h3>
              <span className="text-[10px] font-mono text-[#63C7A2] bg-[#63C7A2]/10 px-2.5 py-0.5 rounded-full border border-[#63C7A2]/25 font-semibold shrink-0">
                ● ACTIVE
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center gap-2 py-1.5 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Primary Model</span>
                <span className="font-mono text-xs text-[#38BDF8] font-semibold bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/20 flex items-center gap-1">
                  <span>✨</span> Gemini 1.5 Flash
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 py-1.5 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Payment Gateway</span>
                <span className="font-mono text-xs text-[#63C7A2] bg-[#63C7A2]/10 px-2 py-0.5 rounded border border-[#63C7A2]/20 font-semibold">
                  Razorpay (Secured)
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 py-1.5 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">AI Requests Used</span>
                <span className="font-mono text-xs text-[var(--color-text-primary)] font-semibold bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded border border-[var(--color-border-standard)]">
                  {subscription?.ai_requests_used ?? 0} / {subscription?.subscription_plans?.included_ai_requests ?? 500}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 py-1.5 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)]">Response Latency</span>
                <span className="font-mono text-xs text-[#63C7A2] font-semibold bg-[#63C7A2]/10 px-2 py-0.5 rounded border border-[#63C7A2]/20">
                  ⚡ ~840ms
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3.5 border-t border-[var(--color-border-subtle)] mt-4 flex justify-between items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Monthly Token Cost</span>
            <span className="font-mono text-sm font-bold text-[#63C7A2] bg-[#63C7A2]/10 px-2.5 py-0.5 rounded border border-[#63C7A2]/20">
              {isInternational ? `$${(Number(subscription?.ai_cost_used_inr ?? 0) / 85).toFixed(2)} USD` : `₹${Number(subscription?.ai_cost_used_inr ?? 0).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Available Plans (Razorpay Integrated) */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E87A38]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#E87A38] font-semibold">
              {isInternational ? 'International Pricing Tiers (USD)' : 'Verified Domestic Tiers (INR)'}
            </span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Subscription Plans &amp; Instant Checkout
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Seamless payments via Razorpay (UPI, Credit/Debit Cards, NetBanking, International Cards). Instant automated provisioning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentPlans.map(p => {
            const isCurrentPlan = subscription?.subscription_plans?.slug === p.id;
            return (
              <div
                key={p.id}
                className={`card p-6 flex flex-col justify-between transition-all duration-300 relative rounded-2xl ${
                  isCurrentPlan
                    ? 'border-[#E84B2C] bg-[var(--color-surface-elevated)] shadow-[0_0_30px_rgba(232,75,44,0.18)] ring-1 ring-[#E84B2C]'
                    : p.popular
                    ? 'border-[#E87A38]/50 bg-[var(--color-surface-elevated)] shadow-[0_0_20px_rgba(232,122,56,0.1)]'
                    : 'border-[var(--color-border-standard)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-border-hover)]'
                }`}
              >
                {/* Top Badge Pills */}
                {isCurrentPlan && (
                  <span className="absolute -top-3 right-6 bg-gradient-to-r from-[#E84B2C] to-[#E87A38] text-[#FFFFFF] text-[10px] font-mono uppercase tracking-wider font-bold px-3 py-0.5 rounded-full shadow-[0_0_12px_#E84B2C]">
                    Current Plan ✓
                  </span>
                )}
                {p.popular && !isCurrentPlan && (
                  <span className="absolute -top-3 right-6 bg-[#E87A38] text-[#080505] text-[10px] font-mono uppercase tracking-wider font-bold px-3 py-0.5 rounded-full shadow-[0_0_12px_rgba(232,122,56,0.4)]">
                    Most Popular ★
                  </span>
                )}

                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#E87A38] mb-1">
                    {p.id === 'starter' ? '🌱 Starter Tier' : p.id === 'pro' ? '⭐ Practice Standard' : '🚀 Multi-Doctor Suite'}
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-heading mb-2">
                    {p.name}
                  </h3>

                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-1.5 my-3 pb-3 border-b border-[var(--color-border-subtle)]">
                    <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                      {p.price}
                    </span>
                    <span className="text-xs font-normal text-[var(--color-text-muted)] font-mono">
                      / month
                    </span>
                  </div>

                  {/* Quota Highlight Box */}
                  <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[#E84B2C]/10 border border-[#E84B2C]/25 text-[#E87A38] text-xs font-mono font-semibold mb-3.5">
                    <span>💬</span>
                    <span>{p.chatsQuota.toLocaleString()} AI Patient Chats Included</span>
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed min-h-[34px]">
                    {p.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-6 pt-3 border-t border-[var(--color-border-subtle)]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">
                      Included Capabilities:
                    </div>
                    {p.features.map((feat, i) => (
                      <div key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2.5">
                        <span className="w-4 h-4 rounded-full bg-[#63C7A2]/15 text-[#63C7A2] border border-[#63C7A2]/30 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Razorpay Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(p.id as any);
                    handlePayWithRazorpay(p.id as any);
                  }}
                  disabled={isProcessingPayment}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: isCurrentPlan
                      ? 'linear-gradient(135deg, rgba(232, 75, 44, 0.2), rgba(200, 105, 56, 0.25))'
                      : 'linear-gradient(135deg, #E84B2C, #C86938)',
                    color: isCurrentPlan ? '#E87A38' : '#FFFFFF',
                    border: isCurrentPlan
                      ? '1px solid rgba(232, 122, 56, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: isCurrentPlan
                      ? '0 0 16px rgba(232, 75, 44, 0.2)'
                      : '0 4px 16px rgba(232, 75, 44, 0.4)',
                  }}
                >
                  <span>💳</span>
                  <span>
                    {isCurrentPlan ? `Renew ${p.name} (${p.price})` : `Upgrade to ${p.name} (${p.price}) →`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History Table */}
      <div>
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-[var(--color-text-primary)]">
            Payment Ledger &amp; Invoices
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Audit-grade history of all automated Razorpay subscription settlements.
          </p>
        </div>

        <div className="card p-0 overflow-hidden bg-[var(--color-surface-elevated)] border-[var(--color-border-standard)]">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead style={{ background: 'var(--color-surface-secondary, #1C1916)' }}>
                <tr>
                  <th style={{ color: 'var(--color-text-primary, #F3F0E8)', fontWeight: 600, padding: '0.85rem 1rem' }}>Timestamp</th>
                  <th style={{ color: 'var(--color-text-primary, #F3F0E8)', fontWeight: 600, padding: '0.85rem 1rem' }}>Plan Tier</th>
                  <th style={{ color: 'var(--color-text-primary, #F3F0E8)', fontWeight: 600, padding: '0.85rem 1rem' }}>Settlement Amount</th>
                  <th style={{ color: 'var(--color-text-primary, #F3F0E8)', fontWeight: 600, padding: '0.85rem 1rem' }}>Payment Gateway</th>
                  <th style={{ color: 'var(--color-text-primary, #F3F0E8)', fontWeight: 600, padding: '0.85rem 1rem' }}>State</th>
                  <th style={{ color: 'var(--color-text-primary, #F3F0E8)', fontWeight: 600, padding: '0.85rem 1rem' }}>Order / Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[var(--color-text-muted)]">
                      <div className="text-sm font-medium text-[var(--color-text-secondary)]">No payments logged yet</div>
                      <div className="text-xs mt-1 text-[var(--color-text-muted)]">
                        When you settle subscription invoices via Razorpay, verified records will display here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const isOrderUsd = order.currency === 'USD';
                    const displayAmt = isOrderUsd
                      ? `$${order.metadata?.amount || (order.amount_inr / 85).toFixed(0)} USD`
                      : `₹${Number(order.amount_inr).toLocaleString('en-IN')}`;

                    const txRef =
                      order.metadata?.razorpay_payment_id ||
                      order.utr_number ||
                      order.metadata?.razorpay_order_id ||
                      order.id.slice(0, 13);

                    return (
                      <tr key={order.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                        <td className="font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="font-medium text-[var(--color-text-primary)] text-xs">
                          {order.subscription_plans?.name || 'Clinic Subscription'}
                        </td>
                        <td className="font-mono font-bold text-[#63C7A2] text-sm">
                          {displayAmt}
                        </td>
                        <td>
                          <span className="badge bg-[#E84B2C]/15 border border-[#E84B2C]/30 text-[#E87A38] text-[11px] font-mono flex items-center gap-1 w-fit">
                            💳 Razorpay
                          </span>
                        </td>
                        <td>
                          <span className={`badge font-mono text-[10px] ${
                            order.status === 'completed' || order.status === 'success'
                              ? 'badge-success'
                              : order.status === 'pending' || order.status === 'processing'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                            {txRef}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
