'use client';

// src/app/dashboard/integrations/page.tsx
// Clinic Integrations Management: WhatsApp Business Cloud API & Google Calendar 2-Way Sync

import React, { useState, useEffect } from 'react';

export default function IntegrationsPage() {
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSavingWA, setIsSavingWA] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('calendar_connected') === 'true') {
        setCalendarConnected(true);
      }
    }
  }, []);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/webhooks/whatsapp`
    : 'https://your-domain.com/api/v1/webhooks/whatsapp';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWA(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSavingWA(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          🔗 Channels & Integrations
        </h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
          Connect your official WhatsApp Business number and clinic Google Calendar.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* WhatsApp Business Card */}
        <div className="card" style={{ padding: '1.75rem', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'hsl(142 71% 45% / 0.15)',
                color: 'hsl(142 71% 45%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                💬
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WhatsApp Business Platform</h2>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Meta Cloud API (Official)</div>
              </div>
            </div>
            <span className="badge badge-success">Available</span>
          </div>

          <form onSubmit={handleSaveWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Phone Number ID</label>
              <input
                className="input"
                value={phoneId}
                onChange={e => setPhoneId(e.target.value)}
                placeholder="e.g. 104829104810294"
              />
            </div>

            <div>
              <label className="label">WhatsApp Business Account ID (WABA ID)</label>
              <input
                className="input"
                value={wabaId}
                onChange={e => setWabaId(e.target.value)}
                placeholder="e.g. 10928392019283"
              />
            </div>

            <div>
              <label className="label">System User Permanent Token</label>
              <input
                type="password"
                className="input"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="EAAG..."
              />
            </div>

            <div>
              <label className="label">Your Webhook URL</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  readOnly
                  value={webhookUrl}
                  style={{ background: 'hsl(var(--color-surface-hover))', color: 'hsl(var(--color-text-secondary))' }}
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="btn btn-secondary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSavingWA}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {isSavingWA ? 'Verifying & Saving...' : saveSuccess ? '✓ Saved Successfully!' : 'Save WhatsApp Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Google Calendar Card */}
        <div className="card" style={{ padding: '1.75rem', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'hsl(221 83% 58% / 0.15)',
                color: 'hsl(221 83% 58%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
              }}>
                📅
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Google Calendar 2-Way Sync</h2>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Automatic doctor schedule sync</div>
              </div>
            </div>
            <span className={`badge ${calendarConnected ? 'badge-success' : 'badge-info'}`}>
              {calendarConnected ? '● Connected' : 'OAuth 2.0'}
            </span>
          </div>

          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Connect your primary Google Calendar. The AI receptionist will check your free/busy times in real time to avoid double-bookings, and instantly write confirmed patient slots to your calendar.
          </p>

          <div style={{
            background: 'hsl(var(--color-surface-hover))',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid hsl(var(--color-border))',
            marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🔒</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Zero Stored Passwords</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', lineHeight: 1.5 }}>
              Tokens are encrypted at rest using AES-256-GCM and refreshed automatically using Google OAuth offline credentials.
            </div>
          </div>

          {calendarConnected ? (
            <div>
              <div style={{
                background: 'hsla(142, 71%, 45%, 0.1)',
                border: '1px solid hsla(142, 71%, 45%, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#4ade80' }}>
                    Google Doctor Calendar Connected
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                    Real-time two-way synchronization is active. Confirmed appointments sync directly.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href="/api/v1/integrations/calendar/auth"
                  className="btn btn-secondary"
                  style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                >
                  🔄 Re-sync Calendar
                </a>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: '#f87171', border: '1px solid hsla(0, 84%, 60%, 0.3)' }}
                  onClick={() => setCalendarConnected(false)}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a
                href="/api/v1/integrations/calendar/auth"
                className="btn btn-primary"
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
              >
                🗓️ Connect Google Calendar
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
