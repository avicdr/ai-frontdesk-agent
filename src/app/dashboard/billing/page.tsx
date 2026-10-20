'use client';

// src/app/dashboard/billing/page.tsx
// Clinic Billing & Usage Dashboard — Real plan details, quota meters, UPI renewal, UTR submission, payment history

import React, { useState, useEffect } from 'react';

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
  created_at: string;
  subscription_plans: {
    name: string;
    slug: string;
  } | null;
}

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'growth'>('pro');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [orders, setOrders] = useState<PaymentOrderData[]>([]);
  const [orgName, setOrgName] = useState<string>('');

  const upiVpa = process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || process.env.NEXT_PUBLIC_UPI_VPA || 'aviwasasleep@ptaxis';

  const plans = [
    { id: 'starter', name: 'Starter Practice', price: '₹999', chatsQuota: 500, priceVal: 999 },
    { id: 'pro', name: 'Pro Clinic (Recommended)', price: '₹1,599', chatsQuota: 2000, priceVal: 1599, popular: true },
    { id: 'growth', name: 'Growth & Multi-Doctor', price: '₹2,999', chatsQuota: 5000, priceVal: 2999 },
  ];

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

      setUtrSuccess(true);
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
        return <span className="badge badge-success">Active Plan</span>;
      case 'trial':
        return <span className="badge badge-info" style={{ background: 'hsl(199 89% 48% / 0.15)', color: 'hsl(199 89% 65%)', border: '1px solid hsl(199 89% 48% / 0.3)' }}>Free Trial</span>;
      case 'grace_period':
        return <span className="badge badge-warning">Grace Period</span>;
      case 'expired':
        return <span className="badge badge-danger">Plan Expired</span>;
      default:
        return <span className="badge badge-warning">No Active Plan</span>;
    }
  };

  const quotaLimit = subscription?.subscription_plans?.included_ai_requests || subscription?.subscription_plans?.included_inbound_messages || 500;
  const quotaUsed = Math.max(subscription?.ai_requests_used || 0, subscription?.messages_used_inbound || 0);
  const quotaPercent = quotaLimit > 0 ? Math.min(100, Math.round((quotaUsed / quotaLimit) * 100)) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            💳 Subscription, Usage & Billing
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
            {orgName ? `${orgName} • ` : ''}Monitor real-time AI usage quotas, renew monthly via UPI, or upgrade your plan.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowUpiModal(true)}
        >
          ⚡ Renew / Upgrade Subscription (UPI)
        </button>
      </div>

      {utrSuccess && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          background: 'hsl(142 71% 45% / 0.15)',
          border: '1px solid hsl(142 71% 45% / 0.3)',
          borderRadius: '8px',
          color: 'hsl(142 71% 65%)',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span>✅</span>
          <span>Payment reference (UTR) submitted successfully! Pending admin verification and activation.</span>
        </div>
      )}

      {/* Subscription Status Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                {getStatusBadge(subscription?.status)}
              </div>
              <h2 style={{ fontSize: 'clamp(1.15rem, 3vw, 1.4rem)', fontWeight: 800 }}>
                {subscription?.subscription_plans?.name || (subscription?.status === 'trial' ? 'Pro Trial Plan' : 'No Active Plan')}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                {subscription ? (
                  subscription.status === 'trial' ? (
                    `3-Day Free Trial • ${subscription.daysRemaining != null ? `${subscription.daysRemaining} days left` : 'Active'}`
                  ) : (
                    `₹${(subscription.subscription_plans?.price_inr || 0).toLocaleString('en-IN')} / month • ${subscription.expires_at ? `Renews on ${new Date(subscription.expires_at).toLocaleDateString('en-IN')}` : 'Monthly'}`
                  )
                ) : (
                  'Choose a plan below to activate your AI front desk'
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Days Remaining</div>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                color: (subscription?.daysRemaining ?? 0) > 3 ? 'hsl(142 71% 45%)' : 'hsl(var(--color-warning))',
              }}>
                {subscription?.daysRemaining ?? 0}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              <span>Monthly AI Chat Quota</span>
              <span style={{ fontWeight: 700 }}>
                {subscription ? `${quotaUsed.toLocaleString()} / ${quotaLimit.toLocaleString()} Chats (${quotaPercent}%)` : '0 / 0 Chats'}
              </span>
            </div>
            <div style={{ height: 8, background: 'hsl(var(--color-surface-hover))', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${quotaPercent}%`, height: '100%', background: 'var(--gradient-brand)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* AI Cost Efficiency Telemetry */}
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            🤖 AI Engine Efficiency
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Primary Model</span>
              <span style={{ fontWeight: 600 }}>Gemini 1.5 Flash</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Fallback Model</span>
              <span style={{ fontWeight: 600 }}>OpenAI GPT-4o-mini</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>AI Requests Processed</span>
              <span style={{ fontWeight: 600 }}>
                {subscription?.ai_requests_used ?? 0} / {subscription?.subscription_plans?.included_ai_requests ?? 500}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Estimated AI Cost this Month</span>
              <span style={{ fontWeight: 700, color: 'hsl(142 71% 45%)' }}>
                ₹{Number(subscription?.ai_cost_used_inr ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Upgrade Your Front Desk</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {plans.map(p => {
          const isCurrentPlan = subscription?.subscription_plans?.slug === p.id;
          return (
            <div
              key={p.id}
              className="card"
              style={{
                padding: '1.75rem 1.5rem 1.5rem',
                border: isCurrentPlan
                  ? '2px solid hsl(var(--color-primary))'
                  : (p.popular ? '1px solid hsl(var(--color-primary) / 0.5)' : '1px solid hsl(var(--color-border))'),
                position: 'relative',
                overflow: 'visible',
                marginTop: '0.75rem',
              }}
            >
              {isCurrentPlan && (
                <span style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  background: 'var(--gradient-brand)',
                  color: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                  letterSpacing: '0.02em',
                }}>
                  Current Plan
                </span>
              )}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{p.name}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {p.price}<span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>/month</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-primary))', fontWeight: 600, marginBottom: '1rem' }}>
                {p.chatsQuota.toLocaleString()} AI Patient Conversations
              </div>
              <button
                type="button"
                className={`btn ${isCurrentPlan ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%' }}
                onClick={() => {
                  setSelectedPlan(p.id as any);
                  setShowUpiModal(true);
                }}
              >
                {isCurrentPlan ? `Renew ${p.name}` : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Payment Transactions</h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'hsl(var(--color-text-muted))' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🧾</div>
                  <div style={{ fontWeight: 600 }}>No payment transactions yet</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    When you renew or subscribe via UPI/Cashfree, your payments and receipts will be logged here.
                  </div>
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>
                    {order.subscription_plans?.name || 'Clinic Subscription'}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    ₹{Number(order.amount_inr).toLocaleString('en-IN')}
                  </td>
                  <td>
                    {order.provider === 'manual'
                      ? (order.utr_number ? `UPI (UTR: ${order.utr_number})` : 'UPI Manual')
                      : 'Cashfree / Online'}
                  </td>
                  <td>
                    <span className={`badge ${
                      order.status === 'completed'
                        ? 'badge-success'
                        : order.status === 'pending' || order.status === 'processing'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.status === 'completed' ? (
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', cursor: 'pointer' }}
                        onClick={() => alert(`Receipt #${order.id.slice(0, 8)}: Verified and active.`)}
                      >
                        View Receipt
                      </button>
                    ) : (
                      <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* UPI QR & Manual UTR Modal */}
      {showUpiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>⚡ UPI Subscription Payment</h2>
              <button
                type="button"
                onClick={() => setShowUpiModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 160,
                height: 160,
                margin: '0 auto 1rem auto',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'black',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}>
                UPI QR CODE
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                {plans.find(p => p.id === selectedPlan)?.price || '₹1,599'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--color-primary))', marginTop: '0.25rem' }}>
                {plans.find(p => p.id === selectedPlan)?.name || 'Pro Clinic'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                VPA: <span style={{ color: 'hsl(var(--color-primary))', fontWeight: 700 }}>{upiVpa}</span>
              </div>
            </div>

            {submitError && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'hsl(0 84% 60% / 0.15)',
                border: '1px solid hsl(0 84% 60% / 0.3)',
                borderRadius: '6px',
                color: 'hsl(0 84% 75%)',
                fontSize: '0.8rem',
              }}>
                ⚠️ {submitError}
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
