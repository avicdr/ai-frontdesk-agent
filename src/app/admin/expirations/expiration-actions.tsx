'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpirationRowActions({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleExtend = async (days: number) => {
    setLoading(true);
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
      setMsg(`+${days}d`);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setMsg('Err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
      <button
        type="button"
        disabled={loading}
        onClick={() => handleExtend(7)}
        style={{
          background: 'none',
          border: '1px solid hsl(var(--color-primary))',
          color: 'hsl(var(--color-primary))',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '...' : '+7 Days'}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => handleExtend(30)}
        style={{
          background: 'none',
          border: '1px solid hsl(265 83% 65%)',
          color: 'hsl(265 83% 70%)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '...' : '+30 Days'}
      </button>
      {msg && (
        <span style={{ fontSize: '0.7rem', color: msg.startsWith('+') ? 'hsl(142 71% 55%)' : 'hsl(0 84% 60%)' }}>
          {msg}
        </span>
      )}
    </div>
  );
}
