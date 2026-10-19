'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_inr: number;
  included_ai_requests: number;
}

interface SubscriberActionsProps {
  organizationId: string;
  status: string;
  hasSubscription: boolean;
  plans?: Plan[];
  currentPlanId?: string;
}

export default function SubscriberActions({
  organizationId,
  status,
  hasSubscription,
  plans = [],
  currentPlanId,
}: SubscriberActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    currentPlanId || (plans.length > 0 ? (plans.find(p => p.slug === 'pro')?.id || plans[0].id) : '')
  );
  const [durationDays, setDurationDays] = useState<number>(30);

  const handleAction = async (action: string, payload: Record<string, any> = {}) => {
    setLoadingAction(action);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          organizationId,
          ...payload,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to perform admin action');
      }

      setSuccessMsg(json.data?.message || 'Action executed successfully');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoadingAction(null);
    }
  };

  const isSuspended = status === 'suspended';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleAction(isSuspended ? 'activate_clinic' : 'suspend_clinic')}
          disabled={loadingAction !== null}
          className={`btn ${isSuspended ? 'btn-success' : 'btn-danger'}`}
          style={{
            fontSize: '0.85rem',
            padding: '0.5rem 1rem',
            background: isSuspended ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loadingAction ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: loadingAction ? 0.7 : 1,
          }}
        >
          {loadingAction === (isSuspended ? 'activate_clinic' : 'suspend_clinic')
            ? 'Processing...'
            : isSuspended
            ? '✅ Activate Clinic'
            : '⛔ Suspend Clinic'}
        </button>

        {hasSubscription && (
          <>
            <button
              type="button"
              onClick={() => handleAction('extend_subscription', { extensionDays: 7 })}
              disabled={loadingAction !== null}
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                background: 'hsl(221 83% 58%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: loadingAction ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loadingAction ? 0.7 : 1,
              }}
            >
              {loadingAction === 'extend_subscription' ? 'Extending...' : '⏰ +7 Days'}
            </button>

            <button
              type="button"
              onClick={() => handleAction('extend_subscription', { extensionDays: 30 })}
              disabled={loadingAction !== null}
              style={{
                fontSize: '0.85rem',
                padding: '0.5rem 1rem',
                background: 'hsl(265 83% 65%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: loadingAction ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: loadingAction ? 0.7 : 1,
              }}
            >
              ⏰ +30 Days
            </button>
          </>
        )}
      </div>

      {/* Plan Assignment Bar */}
      {plans.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: 'hsl(var(--color-bg-card, 222 47% 11%))',
            border: '1px solid hsl(var(--color-border, 220 13% 20%))',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--color-text-secondary))' }}>
            Assign Plan:
          </span>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            disabled={loadingAction !== null}
            style={{
              padding: '0.35rem 0.6rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              backgroundColor: 'hsl(var(--color-bg-input, 222 47% 14%))',
              color: '#fff',
              border: '1px solid hsl(var(--color-border, 220 13% 25%))',
            }}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.price_inr.toLocaleString('en-IN')}/mo)
              </option>
            ))}
          </select>

          <select
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            disabled={loadingAction !== null}
            style={{
              padding: '0.35rem 0.6rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              backgroundColor: 'hsl(var(--color-bg-input, 222 47% 14%))',
              color: '#fff',
              border: '1px solid hsl(var(--color-border, 220 13% 25%))',
            }}
          >
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>180 Days</option>
            <option value={365}>365 Days</option>
          </select>

          <button
            type="button"
            onClick={() => handleAction('assign_plan', { planId: selectedPlanId, durationDays })}
            disabled={loadingAction !== null || !selectedPlanId}
            style={{
              fontSize: '0.8rem',
              padding: '0.35rem 0.85rem',
              background: 'hsl(142 71% 45%)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loadingAction ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loadingAction === 'assign_plan' ? 'Activating...' : '⚡ Activate Plan'}
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {successMsg && (
        <div style={{ fontSize: '0.8rem', color: 'hsl(142 71% 55%)', fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ fontSize: '0.8rem', color: 'hsl(0 84% 60%)', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
