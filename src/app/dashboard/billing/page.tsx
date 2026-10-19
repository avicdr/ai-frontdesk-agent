'use client';

// src/app/dashboard/billing/page.tsx
// Clinic Billing & Usage Dashboard — Plan details, quota meters, UPI renewal, UTR submission, payment history

import React, { useState } from 'react';

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'growth'>('pro');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const upiVpa = process.env.NEXT_PUBLIC_PLATFORM_UPI_ID || process.env.NEXT_PUBLIC_UPI_VPA || 'aviwasasleep@ptaxis';

  const plans = [
    { id: 'starter', name: 'Starter Practice', price: '₹999', chatsQuota: 500, priceVal: 999 },
    { id: 'pro', name: 'Pro Clinic (Recommended)', price: '₹1,599', chatsQuota: 2000, priceVal: 1599, popular: true },
    { id: 'growth', name: 'Growth & Multi-Doctor', price: '₹2,999', chatsQuota: 5000, priceVal: 2999 },
  ];

  const [submitError, setSubmitError] = useState<string | null>(null);

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
    } catch (e: any) {
      console.error(e);
      setSubmitError(e?.message || 'Failed to submit payment. Please verify UTR and try again.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            💳 Subscription, Usage & Billing
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
            Monitor real-time AI usage quotas, renew monthly via UPI, or upgrade your plan.
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                Active Plan
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Pro Clinic Plan</h2>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                ₹1,599 / month • Renews on 19th of every month
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Days Remaining</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'hsl(142 71% 45%)' }}>24</div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              <span>Monthly AI Chat Quota</span>
              <span style={{ fontWeight: 700 }}>342 / 2,000 Chats (17%)</span>
            </div>
            <div style={{ height: 8, background: 'hsl(var(--color-surface-hover))', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '17%', height: '100%', background: 'var(--gradient-brand)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* AI Cost Efficiency Telemetry */}
        <div className="card" style={{ padding: '1.75rem' }}>
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
              <span style={{ color: 'hsl(var(--color-text-muted))' }}>Estimated AI Cost this Month</span>
              <span style={{ fontWeight: 700, color: 'hsl(142 71% 45%)' }}>₹142.30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Upgrade Your Front Desk</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {plans.map(p => (
          <div
            key={p.id}
            className="card"
            style={{
              padding: '1.75rem 1.5rem 1.5rem',
              border: p.popular ? '2px solid hsl(var(--color-primary))' : '1px solid hsl(var(--color-border))',
              position: 'relative',
              overflow: 'visible',
              marginTop: '0.75rem',
            }}
          >
            {p.popular && (
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
              className={`btn ${p.id === 'pro' ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
              onClick={() => {
                setSelectedPlan(p.id as any);
                setShowUpiModal(true);
              }}
            >
              {p.id === 'pro' ? 'Renew Pro Plan' : `Switch to ${p.name}`}
            </button>
          </div>
        ))}
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
            <tr>
              <td>{new Date().toLocaleDateString('en-IN')}</td>
              <td style={{ fontWeight: 600 }}>Pro Clinic Subscription (Monthly)</td>
              <td style={{ fontWeight: 700 }}>₹4,999</td>
              <td>UPI / Cashfree</td>
              <td><span className="badge badge-success">Success</span></td>
              <td>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--color-primary))', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Download PDF
                </button>
              </td>
            </tr>
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
