'use client';

// src/app/admin/payments/page.tsx
// Platform Admin Payments Console — UPI transaction monitoring and manual UTR approval queue
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--color-border-subtle)] pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
          <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
            Settlement Verification Console
          </span>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          UPI &amp; Crypto Settlement Queue
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Verify and approve manual UPI references, or directly assign and activate plans for any practice.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success'
            ? 'bg-[#63C7A2]/10 border-[#63C7A2]/30 text-[#63C7A2]'
            : 'bg-[#E84B2C]/10 border-[#E84B2C]/30 text-[#E84B2C]'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-inherit hover:opacity-75 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* Direct Approval & Assignment Card */}
      <div className="card p-6 bg-[var(--color-surface-elevated)] border border-[var(--color-border-standard)] relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#E87A38]">⚡</span>
          <h2 className="font-heading text-base font-semibold text-[var(--color-text-primary)]">
            Direct Plan Assignment &amp; Offline Payment Override
          </h2>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-5">
          Instantly provision or extend clinic subscriptions without requiring an online checkout flow.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="label text-xs">Target Practice</label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="input text-xs"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Subscription Tier</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="input text-xs"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{p.price_inr.toLocaleString('en-IN')}/mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Validity Period</label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="input text-xs font-mono"
            >
              <option value={30}>30 Days (1 Month)</option>
              <option value={90}>90 Days (Quarterly)</option>
              <option value={180}>180 Days (Half Year)</option>
              <option value={365}>365 Days (1 Year)</option>
            </select>
          </div>

          <div>
            <label className="label text-xs">UPI UTR / Blockchain TxID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 439201948192"
              value={customUtr}
              onChange={(e) => setCustomUtr(e.target.value)}
              className="input text-xs font-mono"
            >
            </input>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            className="btn btn-primary text-xs"
            disabled={submittingManual || !selectedOrgId || !selectedPlanId}
            onClick={() => handleManualPaymentApproval('create_and_approve_payment')}
          >
            {submittingManual ? 'Processing...' : '💳 Approve Payment & Activate Plan'}
          </button>

          <button
            type="button"
            className="btn btn-secondary text-xs"
            disabled={submittingManual || !selectedOrgId || !selectedPlanId}
            onClick={() => handleManualPaymentApproval('assign_plan')}
          >
            {submittingManual ? 'Processing...' : '⚡ Assign Plan Directly (Admin Override)'}
          </button>
        </div>
      </div>

      {/* Orders Approval Queue */}
      <div className="card p-0 overflow-hidden bg-[var(--color-surface-elevated)] border border-[var(--color-border-standard)]">
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="font-heading text-sm font-semibold text-[var(--color-text-primary)]">
            Pending Checkout Orders &amp; Audit Queue
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Clinic</th>
                <th>Plan Tier</th>
                <th>Amount</th>
                <th>Rail</th>
                <th>UTR / Hash</th>
                <th>State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--color-text-muted)]">
                    Loading payment queue...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[var(--color-text-muted)]">
                    No pending checkout orders. All subscriptions reconciled.
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
                    <tr key={p.id} className="hover:bg-[var(--color-surface-secondary)] transition-colors">
                      <td className="font-mono text-xs text-[var(--color-text-muted)]">{p.id.slice(0, 8)}...</td>
                      <td className="font-medium text-xs text-[var(--color-text-primary)]">{p.organizations?.name ?? 'Clinic'}</td>
                      <td className="text-xs text-[var(--color-text-secondary)]">{p.subscription_plans?.name ?? '—'}</td>
                      <td className="font-mono font-bold text-xs text-[var(--color-text-primary)]">
                        {isCrypto ? `$${p.metadata?.amount_usd || 100} USD` : `₹${Number(p.amount_inr).toLocaleString('en-IN')}`}
                      </td>
                      <td>
                        {isCrypto ? (
                          <span className="badge bg-[#C86938]/15 border border-[#C86938]/30 text-[#E87A38] text-[10px] font-mono">
                            🪙 {p.metadata?.crypto_network ? p.metadata.crypto_network.replace('_', ' ').toUpperCase() : 'USDT'}
                          </span>
                        ) : (
                          <span className="badge badge-neutral text-[10px] font-mono">
                            ⚡ UPI
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-xs">
                        {p.utr_number ? (
                          explorerUrl ? (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#E87A38] hover:underline inline-flex items-center gap-1"
                              title="Inspect on Explorer"
                            >
                              <span>{p.utr_number.slice(0, 8)}...{p.utr_number.slice(-4)}</span>
                              <span className="text-[10px]">↗</span>
                            </a>
                          ) : (
                            <span className="text-[var(--color-text-primary)]">{p.utr_number}</span>
                          )
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          p.status === 'success' || p.status === 'completed'
                            ? 'badge-success'
                            : p.status === 'processing'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        {p.status === 'processing' || p.status === 'pending' ? (
                          <button
                            type="button"
                            className="btn btn-primary text-xs px-2.5 py-1 font-semibold"
                            disabled={approvingId === p.id}
                            onClick={() => handleApprove(p.id)}
                          >
                            {approvingId === p.id ? 'Approving...' : isCrypto ? '✓ Verify Crypto' : '✓ Approve UPI'}
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-[#63C7A2]">Verified</span>
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
    </div>
  );
}
