'use client';

// src/app/dashboard/billing/page.tsx
// Clinic Billing & Usage Dashboard — Plan details, quota meters, Crypto / UPI renewal, payment history

import React, { useState, useEffect } from 'react';
import { PRICING_PLANS, PLATFORM_UPI_VPA, isInternationalClient, getCryptoExplorerUrl } from '@/lib/constants/billing';
import { CryptoPaymentWidget } from '@/components/billing/CryptoPaymentWidget';

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
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<PaymentOrderData[]>([]);
  const [orgName, setOrgName] = useState<string>('');

  const upiVpa = PLATFORM_UPI_VPA;

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

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) return;
    setIsSubmittingUtr(true);
    setSubmitError(null);

    try {
      // 1. Create order for the selected plan
      const orderRes = await fetch('/api/v1/billing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          currency: 'INR',
          provider: 'manual',
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.data?.orderId) {
        throw new Error(orderJson.error?.message || 'Failed to initiate payment order.');
      }

      const orderId = orderJson.data.orderId;

      // 2. Submit UTR reference for manual verification
      const payRes = await fetch('/api/v1/billing/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          utrNumber: utrNumber.trim(),
        }),
      });
      const payJson = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payJson.error?.message || 'Failed to submit UTR reference.');
      }

      setPaymentSuccessMessage('UPI payment reference submitted successfully! Pending verification.');
      setShowUpiModal(false);
      setUtrNumber('');
      fetchBillingData();
    } catch (e: any) {
      console.error(e);
      setSubmitError(e?.message || 'Failed to submit payment. Please verify UTR and try again.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">● Active Plan</span>;
      case 'trial':
        return <span className="badge badge-warning">● 3-Day Free Trial</span>;
      case 'grace_period':
        return <span className="badge badge-warning">Grace Period</span>;
      case 'expired':
        return <span className="badge badge-danger">Plan Expired</span>;
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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#262522',
            marginBottom: '0.4rem',
          }}>
            Subscription &amp; Usage
          </h1>
          <p style={{ color: '#706C65', fontSize: '0.95rem' }}>
            {orgName ? `${orgName} • ` : ''}
            {isInternational
              ? 'International client billing via Web3 Crypto (USDT, USDC, BTC, ETH).'
              : 'Domestic client billing via Instant UPI.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isInternational ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCryptoModal(true)}
            >
              Pay &amp; Renew via Crypto
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowUpiModal(true)}
            >
              Renew / Upgrade Subscription (UPI)
            </button>
          )}
        </div>
      </div>

      {paymentSuccessMessage && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.85rem 1.25rem',
          background: '#EBF3ED',
          border: '1px solid #D5E4D8',
          borderRadius: '8px',
          color: '#2A5A36',
          fontSize: '0.875rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>✦</span>
          <span>{paymentSuccessMessage}</span>
        </div>
      )}

      {/* Subscription Status Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ marginBottom: '0.6rem' }}>
                {getStatusBadge(subscription?.status)}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                fontWeight: 500,
                color: '#262522',
                marginBottom: '0.25rem',
              }}>
                {subscription?.subscription_plans?.name || (subscription?.status === 'trial' ? 'Pro Trial Plan' : 'No Active Plan')}
              </h2>
              <div style={{ fontSize: '0.825rem', color: '#706C65' }}>
                {subscription ? (
                  subscription.status === 'trial' ? (
                    `3-Day Free Trial • ${subscription.daysRemaining != null ? `${subscription.daysRemaining} days remaining` : 'Active'}`
                  ) : (
                    isInternational
                      ? `${selectedPlanConfig.priceUsdDisplay} USD / month • ${subscription.expires_at ? `Renews on ${new Date(subscription.expires_at).toLocaleDateString()}` : 'Monthly'}`
                      : `₹${(subscription.subscription_plans?.price_inr || 0).toLocaleString('en-IN')} / month • ${subscription.expires_at ? `Renews on ${new Date(subscription.expires_at).toLocaleDateString('en-IN')}` : 'Monthly'}`
                  )
                ) : (
                  'Choose a plan below to activate your AI front desk'
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#706C65', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Days Remaining</div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 600,
                color: (subscription?.daysRemaining ?? 0) > 3 ? '#2A5A36' : '#C86646',
                lineHeight: 1.2,
                marginTop: '0.2rem',
              }}>
                {subscription?.daysRemaining ?? 0}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E7E2DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#706C65' }}>Monthly AI Chat Quota</span>
              <span style={{ fontWeight: 600, color: '#262522' }}>
                {subscription ? `${quotaUsed.toLocaleString()} / ${quotaLimit.toLocaleString()} Chats (${quotaPercent}%)` : '0 / 0 Chats'}
              </span>
            </div>
            <div style={{ height: 6, background: '#F4F1EB', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${quotaPercent}%`, height: '100%', background: '#D97757', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* AI Cost Efficiency Telemetry */}
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#262522',
            marginBottom: '1rem',
            letterSpacing: '-0.01em',
          }}>
            ✦ AI Engine Telemetry
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F4F1EB', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#706C65' }}>Primary Model</span>
              <span style={{ fontWeight: 500, color: '#262522' }}>Gemini 1.5 Flash</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F4F1EB', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#706C65' }}>Fallback Model</span>
              <span style={{ fontWeight: 500, color: '#262522' }}>OpenAI GPT-4o-mini</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F4F1EB', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#706C65' }}>AI Requests Processed</span>
              <span style={{ fontWeight: 500, color: '#262522' }}>
                {subscription?.ai_requests_used ?? 0} / {subscription?.subscription_plans?.included_ai_requests ?? 500}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
              <span style={{ color: '#706C65' }}>Estimated AI Cost this Month</span>
              <span style={{ fontWeight: 600, color: '#2A5A36' }}>
                {isInternational ? `$${(Number(subscription?.ai_cost_used_inr ?? 0) / 85).toFixed(2)} USD` : `₹${Number(subscription?.ai_cost_used_inr ?? 0).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.35rem',
          fontWeight: 500,
          color: '#262522',
          letterSpacing: '-0.01em',
        }}>
          {isInternational ? 'International Subscription Tiers (Crypto)' : 'Subscription Plans (UPI)'}
        </h2>
        <p style={{ color: '#706C65', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Choose a plan that fits your clinic reception volume.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {currentPlans.map(p => {
          const isCurrentPlan = subscription?.subscription_plans?.slug === p.id;
          return (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '1.75rem 1.5rem',
                border: isCurrentPlan
                  ? '1.5px solid #D97757'
                  : (p.popular ? '1px solid #D97757' : '1px solid #E7E2DA'),
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {isCurrentPlan && (
                <span style={{
                  position: 'absolute',
                  top: -11,
                  right: 18,
                  background: '#F8E8DE',
                  color: '#C86646',
                  border: '1px solid #F0D5C7',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                }}>
                  Current Plan
                </span>
              )}
              {p.popular && !isCurrentPlan && (
                <span style={{
                  position: 'absolute',
                  top: -11,
                  right: 18,
                  background: '#262522',
                  color: '#FAF9F5',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                }}>
                  Recommended
                </span>
              )}
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#262522', marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.85rem',
                  fontWeight: 500,
                  color: '#262522',
                  marginBottom: '0.35rem',
                }}>
                  {p.price}<span style={{ fontSize: '0.75rem', color: '#706C65', fontFamily: 'inherit' }}> / month</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#706C65', marginBottom: '1.5rem' }}>
                  {p.chatsQuota.toLocaleString()} AI Patient Conversations
                </div>
              </div>
              <button
                type="button"
                className={`btn ${isCurrentPlan ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%' }}
                onClick={() => {
                  setSelectedPlan(p.id as any);
                  if (isInternational) {
                    setShowCryptoModal(true);
                  } else {
                    setShowUpiModal(true);
                  }
                }}
              >
                {isInternational
                  ? (isCurrentPlan ? `Renew via Crypto (${p.price})` : `Pay with Crypto (${p.price})`)
                  : (isCurrentPlan ? `Renew ${p.name}` : `Switch to ${p.name}`)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '1.35rem',
        fontWeight: 500,
        color: '#262522',
        marginBottom: '1rem',
      }}>
        Payment Transactions
      </h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Reference / TxID</th>
            </tr>
          </thead>
          <tbody>
            {orders.filter(order => {
              const isOrderCrypto = order.currency === 'USD' || order.provider === 'crypto';
              return isInternational ? isOrderCrypto : !isOrderCrypto;
            }).length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'hsl(var(--color-text-muted))' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🧾</div>
                  <div style={{ fontWeight: 600 }}>No payment transactions yet</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {isInternational
                      ? 'When you renew or subscribe via Crypto, your payments and receipts will be logged here.'
                      : 'When you renew or subscribe via UPI, your payments and receipts will be logged here.'}
                  </div>
                </td>
              </tr>
            ) : (
              orders.filter(order => {
                const isOrderCrypto = order.currency === 'USD' || order.provider === 'crypto';
                return isInternational ? isOrderCrypto : !isOrderCrypto;
              }).map(order => {
                const isOrderCrypto = order.currency === 'USD' || order.provider === 'crypto';
                const explorerUrl = isOrderCrypto && order.utr_number
                  ? getCryptoExplorerUrl(order.metadata?.crypto_network || 'usdt_trc20', order.utr_number)
                  : null;

                return (
                  <tr key={order.id}>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>
                      {order.subscription_plans?.name || 'Clinic Subscription'}
                    </td>
                    <td style={{ fontWeight: 600, color: '#262522' }}>
                      {isOrderCrypto
                        ? `$${order.metadata?.amount_usd || 100} USD`
                        : `₹${Number(order.amount_inr).toLocaleString('en-IN')}`}
                    </td>
                    <td>
                      {isOrderCrypto ? (
                        <span className="badge" style={{ background: '#F8E8DE', color: '#C86646', border: '1px solid #F0D5C7', fontSize: '0.75rem' }}>
                          🪙 Crypto ({order.metadata?.crypto_network?.toUpperCase() || 'USDT'})
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                          UPI
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
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
                      {order.utr_number ? (
                        explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#D97757', textDecoration: 'underline', fontFamily: 'monospace', fontSize: '0.75rem' }}
                            title="Verify on Blockchain Explorer"
                          >
                            {order.utr_number.slice(0, 8)}...{order.utr_number.slice(-6)} ↗
                          </a>
                        ) : (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#262522' }}>{order.utr_number}</span>
                        )
                      ) : (
                        <span style={{ color: '#706C65', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Crypto Payment Modal - Strictly International Only */}
      {isInternational && showCryptoModal && (
        <CryptoPaymentWidget
          planId={selectedPlan}
          planName={selectedPlanDetails.name}
          amountUsd={selectedPlanConfig.priceUsd}
          onSuccess={() => {
            setPaymentSuccessMessage('Crypto transaction hash submitted! Your plan will activate upon network confirmation.');
            setShowCryptoModal(false);
            fetchBillingData();
          }}
          onCancel={() => setShowCryptoModal(false)}
        />
      )}

      {/* UPI QR & Manual UTR Modal - Strictly Domestic India Only */}
      {!isInternational && showUpiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(38, 37, 34, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E7E2DA', boxShadow: '0 8px 30px rgba(38,37,34,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: '#262522',
              }}>
                UPI Subscription Payment
              </h2>
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                style={{ background: 'none', border: 'none', color: '#706C65', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                maxWidth: 200,
                margin: '0 auto 1rem auto',
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '0.65rem',
                border: '1px solid #E7E2DA',
                boxShadow: '0 2px 8px rgba(38,37,34,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <img
                  src="/upi-qr.png"
                  alt="Paytm UPI QR Code for aviwasasleep@ptaxis"
                  style={{
                    width: '100%',
                    maxWidth: 180,
                    height: 'auto',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                />
                <div style={{ color: '#262522', fontSize: '0.72rem', fontWeight: 600, marginTop: '0.4rem' }}>
                  Scan with any UPI App
                </div>
                <div style={{ color: '#706C65', fontSize: '0.65rem' }}>
                  Paytm • GPay • PhonePe • BHIM
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: '#262522',
              }}>
                {PRICING_PLANS.find(p => p.id === selectedPlan)?.priceInrDisplay || '₹1,599'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#D97757', marginTop: '0.15rem' }}>
                {PRICING_PLANS.find(p => p.id === selectedPlan)?.name || 'Pro Clinic'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#706C65', marginTop: '0.25rem' }}>
                VPA: <span style={{ color: '#262522', fontWeight: 600 }}>{upiVpa}</span>
              </div>
            </div>

            {submitError && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#FAEBEA',
                border: '1px solid #F3CFCB',
                borderRadius: '6px',
                color: '#A83830',
                fontSize: '0.8rem',
              }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleUtrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Enter 12-digit UTR from your UPI App</label>
                <input
                  className="input"
                  required
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value)}
                  placeholder="e.g. 429104928104"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmittingUtr || !utrNumber.trim()}
              >
                {isSubmittingUtr ? 'Verifying...' : 'Submit UTR & Activate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
