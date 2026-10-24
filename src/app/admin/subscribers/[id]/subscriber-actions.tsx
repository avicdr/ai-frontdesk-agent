'use client';

// src/app/admin/subscribers/[id]/subscriber-actions.tsx
// Clinic super-admin action controls (suspend/activate, extend duration, assign plans)
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

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
    <div className="flex flex-col gap-3 items-start sm:items-end">
      {/* Primary Action Buttons */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          type="button"
          onClick={() => handleAction(isSuspended ? 'activate_clinic' : 'suspend_clinic')}
          disabled={loadingAction !== null}
          className={`btn text-xs font-semibold px-3 py-1.5 ${
            isSuspended ? 'btn-primary' : 'btn-danger'
          }`}
        >
          {loadingAction === (isSuspended ? 'activate_clinic' : 'suspend_clinic')
            ? 'Processing...'
            : isSuspended
            ? '✓ Activate Clinic'
            : '⛔ Suspend Clinic'}
        </button>

        {hasSubscription && (
          <>
            <button
              type="button"
              onClick={() => handleAction('extend_subscription', { extensionDays: 7 })}
              disabled={loadingAction !== null}
              className="btn btn-secondary text-xs px-3 py-1.5 font-mono"
            >
              {loadingAction === 'extend_subscription' ? 'Extending...' : '+7 Days'}
            </button>

            <button
              type="button"
              onClick={() => handleAction('extend_subscription', { extensionDays: 30 })}
              disabled={loadingAction !== null}
              className="btn btn-secondary text-xs px-3 py-1.5 font-mono"
            >
              +30 Days
            </button>
          </>
        )}
      </div>

      {/* Plan Assignment Bar */}
      {plans.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap p-2 rounded-xl bg-[#111110] border border-[#F3F0E8]/08 text-xs">
          <span className="font-mono text-[#9E9B93] text-[11px] uppercase tracking-wider pl-1">
            Assign:
          </span>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            disabled={loadingAction !== null}
            className="input text-xs py-1 px-2.5 h-8 bg-[#171614]"
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
            className="input text-xs py-1 px-2.5 h-8 bg-[#171614] font-mono"
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
            className="btn btn-primary text-xs py-1 px-3 h-8 font-semibold"
          >
            {loadingAction === 'assign_plan' ? 'Applying...' : '⚡ Apply Tier'}
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {successMsg && (
        <div className="text-xs font-mono text-[#63C7A2] bg-[#63C7A2]/10 px-2.5 py-1 rounded-lg border border-[#63C7A2]/20">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-xs font-mono text-[#E84B2C] bg-[#E84B2C]/10 px-2.5 py-1 rounded-lg border border-[#E84B2C]/20">
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
