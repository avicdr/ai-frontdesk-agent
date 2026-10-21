'use client';

// src/app/admin/payments/page.tsx
// Platform Admin Payments Console — UPI transaction monitoring and manual UTR approval queue

import React, { useState, useEffect } from 'react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Manual approval form state
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customUtr, setCustomUtr] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [submittingManual, setSubmittingManual] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/v1/billing/orders');
      const json = await res.json();
      if (json.data?.orders) {
        setPayments(json.data.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/v1/admin/data');
      const json = await res.json();
      if (json.data) {
        setOrganizations(json.data.organizations || []);
        setPlans(json.data.plans || []);
        if (json.data.organizations?.length > 0) {
          setSelectedOrgId(json.data.organizations[0].id);
        }
        if (json.data.plans?.length > 0) {
          // Default to Pro or first plan
          const pro = json.data.plans.find((p: any) => p.slug === 'pro') || json.data.plans[0];
          setSelectedPlanId(pro.id);
        }
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchAdminData();
  }, []);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/v1/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_payment',
          orderId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to approve payment');
      }
      setStatusMessage({ type: 'success', text: json.data?.message || 'Payment approved successfully!' });
      fetchPayments();
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Error approving payment' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleManualPaymentApproval = async (action: 'create_and_approve_payment' | 'assign_plan') => {
    if (!selectedOrgId || !selectedPlanId) {
      setStatusMessage({ type: 'error', text: 'Please select both a clinic and a plan.' });
      return;
    }

    setSubmittingManual(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/v1/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          organizationId: selectedOrgId,
          planId: selectedPlanId,
          utrNumber: customUtr.trim() || undefined,
          durationDays,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to process admin action');
      }

      setStatusMessage({ type: 'success', text: json.data?.message || 'Action executed successfully!' });
      setCustomUtr('');
      fetchPayments();
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ type: 'error', text: e.message || 'Failed to execute action' });
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💳 UPI Payments & Manual Approvals</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          Verify and approve manual UPI payments, or directly assign and activate plans for any clinic.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: statusMessage.type === 'success' ? 'hsl(142 71% 45% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
            color: statusMessage.type === 'success' ? 'hsl(142 71% 65%)' : 'hsl(0 84% 75%)',
            border: `1px solid ${statusMessage.type === 'success' ? 'hsl(142 71% 45% / 0.3)' : 'hsl(0 84% 60% / 0.3)'}`,
          }}
        >
          <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Direct Approval & Assignment Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Direct Plan & Payment Approval</h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '1.25rem' }}>
          Manually activate a plan or record an offline UPI payment for any clinic without waiting for a customer checkout order.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: 'hsl(var(--color-text-secondary))' }}>
              Select Clinic
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '6px' }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: 'hsl(var(--color-text-secondary))' }}>
              Select Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '6px' }}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price_inr.toLocaleString('en-IN')}/mo ({p.included_ai_requests} AI req)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: 'hsl(var(--color-text-secondary))' }}>
              Duration
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="input"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '6px' }}
            >
              <option value={30}>30 Days (1 Month)</option>
              <option value={90}>90 Days (Quarterly)</option>
              <option value={180}>180 Days (Half Year)</option>
              <option value={365}>365 Days (1 Year)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem', color: 'hsl(var(--color-text-secondary))' }}>
              UPI UTR / Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 439201948192"
              value={customUtr}
              onChange={(e) => setCustomUtr(e.target.value)}
              className="input"
              style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem', fontWeight: 600 }}
            disabled={submittingManual || !selectedOrgId || !selectedPlanId}
            onClick={() => handleManualPaymentApproval('create_and_approve_payment')}
          >
            {submittingManual ? 'Processing...' : '💳 Approve UPI Payment & Activate'}
          </button>

          <button
            type="button"
            className="btn"
            style={{
              fontSize: '0.85rem',
              padding: '0.5rem 1.25rem',
              fontWeight: 600,
              backgroundColor: 'hsl(265 83% 65%)',
              color: '#fff',
            }}
            disabled={submittingManual || !selectedOrgId || !selectedPlanId}
            onClick={() => handleManualPaymentApproval('assign_plan')}
          >
            {submittingManual ? 'Processing...' : '⚡ Assign Plan Directly (Admin Override)'}
          </button>
        </div>
      </div>

      {/* Orders Approval Queue */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pending & Recent Orders Queue</h2>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Clinic</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Reference / TxID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  Loading payment transactions...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  No pending checkout orders. Use the form above to directly activate a clinic plan.
                </td>
              </tr>
            ) : (
              payments.map((p: any) => {
                const isCrypto = p.currency === 'USD' || p.provider === 'crypto';
                const explorerUrl = isCrypto && p.utr_number
                  ? (p.utr_number.startsWith('0x')
                      ? `https://etherscan.io/tx/${p.utr_number}`
                      : `https://tronscan.org/#/transaction/${p.utr_number}`)
                  : null;

                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.id.slice(0, 8)}...</td>
                    <td style={{ fontWeight: 600 }}>{p.organizations?.name ?? 'Clinic'}</td>
                    <td>{p.subscription_plans?.name ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: isCrypto ? '#4ade80' : 'white' }}>
                      {isCrypto ? `$${p.metadata?.amount_usd || 100} USD` : `₹${Number(p.amount_inr).toLocaleString('en-IN')}`}
                    </td>
                    <td>
                      {isCrypto ? (
                        <span className="badge" style={{ background: 'hsla(263, 70%, 50%, 0.15)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.4)', fontSize: '0.75rem' }}>
                          🪙 Crypto ({p.metadata?.crypto_network ? p.metadata.crypto_network.replace('_', ' ').toUpperCase() : 'USDT'})
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                          🇮🇳 UPI ({p.provider})
                        </span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'hsl(var(--color-primary))', fontWeight: 600, fontSize: '0.75rem' }}>
                      {p.utr_number ? (
                        explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#93c5fd', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="View on Block Explorer"
                          >
                            <span>{p.utr_number.slice(0, 10)}...{p.utr_number.slice(-6)}</span>
                            <span>↗</span>
                          </a>
                        ) : (
                          p.utr_number
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status === 'success' || p.status === 'completed' ? 'success' : p.status === 'processing' ? 'warning' : 'muted'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status === 'processing' || p.status === 'pending' ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          disabled={approvingId === p.id}
                          onClick={() => handleApprove(p.id)}
                        >
                          {approvingId === p.id ? 'Approving...' : isCrypto ? '✓ Verify Crypto & Activate' : '✓ Approve & Activate'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Verified</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
