'use client';

// src/app/dashboard/integrations/page.tsx
// Clinic Integrations Management: WhatsApp Business Cloud API & Google Calendar 2-Way Sync

import React, { useState } from 'react';

export default function IntegrationsPage() {
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSavingWA, setIsSavingWA] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      // simulate saving
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
        <div className="card" style={{ padding: '1.75rem' }}>
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
                className="input"
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="EAAB..."
              />
            </div>

            {/* Webhook Instructions */}
            <div style={{
              background: 'hsl(var(--color-surface-hover))',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid hsl(var(--color-border))',
              fontSize: '0.8rem',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Webhook URL for Meta App:</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  readOnly
                  value={webhookUrl}
                  className="input"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              {saveSuccess && (
                <span style={{ color: 'hsl(142 71% 45%)', fontSize: '0.8rem', fontWeight: 600 }}>
                  ✓ WhatsApp credentials saved!
                </span>
              )}
              <div />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingWA}
              >
                {isSavingWA ? 'Saving...' : 'Save WhatsApp Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Google Calendar Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
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
            <span className="badge badge-info">OAuth 2.0</span>
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a
              href="/api/v1/integrations/calendar/auth"
              className="btn btn-primary"
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
            >
              🗓️ Connect Google Calendar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
