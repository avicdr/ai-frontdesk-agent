'use client';

// src/app/admin/payments/page.tsx
// Platform Admin Payments Console — UPI transaction monitoring and manual UTR approval queue

import React, { useState, useEffect } from 'react';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      // In production load from payment_orders/payment_transactions
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

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      await fetch('/api/v1/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_payment',
          orderId,
        }),
      });
      fetchPayments();
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💳 UPI Payments & Manual Approvals</h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          Verify and approve manual UPI UTR numbers submitted by clinics to activate subscriptions.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Clinic</th>
              <th>Amount</th>
              <th>Provider / Mode</th>
              <th>UTR Number</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  Loading payment transactions...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  No pending transactions found.
                </td>
              </tr>
            ) : (
              payments.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.id.slice(0, 8)}...</td>
                  <td style={{ fontWeight: 600 }}>{p.organizations?.name ?? 'Clinic'}</td>
                  <td style={{ fontWeight: 700, color: 'white' }}>₹{Number(p.amount_inr).toLocaleString('en-IN')}</td>
                  <td>{p.provider}</td>
                  <td style={{ fontFamily: 'monospace', color: 'hsl(var(--color-primary))', fontWeight: 600 }}>
                    {p.utr_number || '—'}
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
                        {approvingId === p.id ? 'Approving...' : '✓ Approve & Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Verified</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
