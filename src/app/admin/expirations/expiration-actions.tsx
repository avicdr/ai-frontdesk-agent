'use client';

// src/app/admin/expirations/expiration-actions.tsx
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

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
    <div className="flex gap-1.5 items-center">
      <button
        type="button"
        disabled={loading}
        onClick={() => handleExtend(7)}
        className="px-2 py-1 rounded text-[11px] font-mono border border-[#E84B2C]/40 text-[#E87A38] hover:bg-[#E84B2C]/10 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : '+7d'}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => handleExtend(30)}
        className="px-2 py-1 rounded text-[11px] font-mono border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50"
      >
        {loading ? '...' : '+30d'}
      </button>
      {msg && (
        <span className={`text-[10px] font-mono ${msg.startsWith('+') ? 'text-[#63C7A2]' : 'text-[#E84B2C]'}`}>
          {msg}
        </span>
      )}
    </div>
  );
}
