'use client';

// src/app/admin/expirations/expiration-actions.tsx
// Quick subscription extension buttons with immediate feedback

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpirationRowActions({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [loadingDays, setLoadingDays] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleExtend = async (days: number) => {
    setLoadingDays(days);
    setMsg(null);
    try {
      const res = await fetch('/api/v1/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend_subscription',
          organizationId,
          extensionDays: days,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to extend subscription');
      }
      setMsg({ text: `+${days}d added`, success: true });
      router.refresh();
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      console.error(e);
      setMsg({ text: 'Error', success: false });
    } finally {
      setLoadingDays(null);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={loadingDays !== null}
        onClick={() => handleExtend(7)}
        style={{
          padding: '0.25rem 0.55rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          background: 'rgba(232, 122, 56, 0.1)',
          color: '#E87A38',
          border: '1px solid rgba(232, 122, 56, 0.3)',
          cursor: loadingDays !== null ? 'not-allowed' : 'pointer',
          opacity: loadingDays !== null ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
        title="Extend subscription by 7 days"
      >
        {loadingDays === 7 ? '...' : '+7d'}
      </button>

      <button
        type="button"
        disabled={loadingDays !== null}
        onClick={() => handleExtend(14)}
        style={{
          padding: '0.25rem 0.55rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          background: 'rgba(232, 75, 44, 0.1)',
          color: '#E84B2C',
          border: '1px solid rgba(232, 75, 44, 0.3)',
          cursor: loadingDays !== null ? 'not-allowed' : 'pointer',
          opacity: loadingDays !== null ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
        title="Extend subscription by 14 days"
      >
        {loadingDays === 14 ? '...' : '+14d'}
      </button>

      <button
        type="button"
        disabled={loadingDays !== null}
        onClick={() => handleExtend(30)}
        style={{
          padding: '0.25rem 0.55rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          background: 'rgba(212, 175, 55, 0.1)',
          color: '#D4AF37',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          cursor: loadingDays !== null ? 'not-allowed' : 'pointer',
          opacity: loadingDays !== null ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
        title="Extend subscription by 30 days (Full Cycle)"
      >
        {loadingDays === 30 ? '...' : '+30d'}
      </button>

      {msg && (
        <span
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
            background: msg.success ? 'rgba(99, 199, 162, 0.15)' : 'rgba(232, 75, 44, 0.15)',
            color: msg.success ? '#63C7A2' : '#E84B2C',
            border: `1px solid ${msg.success ? 'rgba(99, 199, 162, 0.3)' : 'rgba(232, 75, 44, 0.3)'}`,
          }}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
