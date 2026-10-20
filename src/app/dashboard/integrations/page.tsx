'use client';

// src/app/dashboard/integrations/page.tsx
// Clinic Integrations Management: Baileys WhatsApp Multi-Device (QR & Pairing Code) & Google Calendar

import React, { useState, useEffect, useRef } from 'react';

export default function IntegrationsPage() {
  // WhatsApp Baileys State
  const [waMode, setWaMode] = useState<'qr' | 'pairing_code'>('qr');
  const [waStatus, setWaStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [isLoadingWA, setIsLoadingWA] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  // Google Calendar State
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarName, setCalendarName] = useState<string | null>(null);
  const [isLiveGoogleConfigured, setIsLiveGoogleConfigured] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [apiDisabled, setApiDisabled] = useState(false);
  const [enableApiUrl, setEnableApiUrl] = useState<string | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCalendarStatus = async () => {
    try {
      const res = await fetch('/api/v1/integrations/calendar');
      const json = await res.json();
      if (json.success && json.data) {
        setCalendarConnected(json.data.status === 'connected');
        setCalendarEmail(json.data.email);
        setCalendarName(json.data.calendarName);
        setIsLiveGoogleConfigured(json.data.isLiveConfigured);
        setCalendarError(json.data.lastError);
        setApiDisabled(Boolean(json.data.apiDisabled));
        setEnableApiUrl(json.data.enableApiUrl);
        setUnsyncedCount(json.data.unsyncedCount || 0);
      }
    } catch {}
  };

  const handleSyncCalendarAppointments = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/v1/integrations/calendar', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSyncMessage(json.data?.message || 'Sync complete!');
        await fetchCalendarStatus();
      } else {
        setSyncMessage(json.error?.message || 'Sync failed.');
      }
    } catch (err: any) {
      setSyncMessage(err?.message || 'Sync request failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      await fetch('/api/v1/integrations/calendar', { method: 'DELETE' });
    } catch {}
    setCalendarConnected(false);
    setCalendarEmail(null);
    setCalendarName(null);
    setCalendarError(null);
    setApiDisabled(false);
  };

  // Initial load: Fetch current session status
  useEffect(() => {
    fetchSessionStatus();
    fetchCalendarStatus();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('calendar_connected') === 'true') {
        setCalendarConnected(true);
      }
    }

    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/integrations/whatsapp/session');
        const json = await res.json();
        if (json.success && json.data) {
          const { status, qrCode: qr, pairingCode: pc, phoneNumber: pn, error } = json.data;
          setWaStatus(status);
          if (status === 'connected') {
            setConnectedNumber(pn ? `+${pn}` : null);
            setQrCode(null);
            setPairingCode(null);
            stopPolling();
          } else if (status === 'connecting') {
            if (qr) setQrCode(qr);
            if (pc) setPairingCode(pc);
          } else if (status === 'disconnected') {
            setQrCode(null);
            setPairingCode(null);
            if (error) setWaError(error);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);
  };

  const fetchSessionStatus = async () => {
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session');
      const json = await res.json();
      if (json.success && json.data) {
        const { status, qrCode: qr, pairingCode: pc, phoneNumber: pn } = json.data;
        setWaStatus(status);
        if (status === 'connected') {
          setConnectedNumber(pn ? `+${pn}` : null);
        } else if (status === 'connecting') {
          if (qr) setQrCode(qr);
          if (pc) setPairingCode(pc);
          startPolling();
        }
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    }
  };

  const handleStartQR = async () => {
    setIsLoadingWA(true);
    setWaError(null);
    setQrCode(null);
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'qr' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setWaStatus(json.data.status);
        if (json.data.qrCode) setQrCode(json.data.qrCode);
        startPolling();
      } else {
        setWaError(json.error?.message || 'Could not initiate QR code.');
      }
    } catch {
      setWaError('Network error starting WhatsApp session.');
    } finally {
      setIsLoadingWA(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setWaError('Please enter a valid phone number with country code.');
      return;
    }
    setIsLoadingWA(true);
    setWaError(null);
    setPairingCode(null);
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pairing_code', phoneNumber }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setWaStatus(json.data.status);
        if (json.data.pairingCode) {
          setPairingCode(json.data.pairingCode);
        }
        startPolling();
      } else {
        setWaError(json.error?.message || 'Could not generate pairing code.');
      }
    } catch {
      setWaError('Network error requesting pairing code.');
    } finally {
      setIsLoadingWA(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to unlink WhatsApp? The AI Receptionist will stop answering patient chats until reconnected.')) {
      return;
    }
    stopPolling();
    setIsLoadingWA(true);
    try {
      await fetch('/api/v1/integrations/whatsapp/session', { method: 'DELETE' });
      setWaStatus('disconnected');
      setConnectedNumber(null);
      setQrCode(null);
      setPairingCode(null);
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsLoadingWA(false);
    }
  };

  const handleResetPairing = async () => {
    stopPolling();
    setIsLoadingWA(true);
    try {
      await fetch('/api/v1/integrations/whatsapp/session', { method: 'DELETE' });
    } catch {}
    setQrCode(null);
    setPairingCode(null);
    setWaStatus('disconnected');
    setWaError(null);
    setIsLoadingWA(false);
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace('-', ''));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          🔗 Channels & Integrations
        </h1>
        <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
          Connect your clinic WhatsApp number (via Linked Devices) and Google Calendar.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem', alignItems: 'start' }}>
        {/* WhatsApp Card */}
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.75rem)', overflow: 'visible' }}>
          {/* Card Header */}
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
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WhatsApp Web & Multi-Device</h2>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                  No Meta Developer Account required
                </div>
              </div>
            </div>
            <span className={`badge ${waStatus === 'connected' ? 'badge-success' : waStatus === 'connecting' ? 'badge-info' : 'badge-warning'}`}>
              {waStatus === 'connected' ? '● Connected' : waStatus === 'connecting' ? '⌛ Connecting...' : 'Disconnected'}
            </span>
          </div>

          {/* Connected State */}
          {waStatus === 'connected' ? (
            <div>
              <div style={{
                background: 'hsla(142, 71%, 45%, 0.1)',
                border: '1px solid hsla(142, 71%, 45%, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <div style={{ fontSize: '2rem' }}>📱</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#4ade80' }}>
                    Connected as {connectedNumber || 'Clinic Device'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-secondary))', marginTop: '0.2rem' }}>
                    Your 24/7 AI Receptionist is active. Messages sent to this number are handled automatically.
                  </div>
                </div>
              </div>

              <div style={{
                background: 'hsl(var(--color-surface-hover))',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                border: '1px solid hsl(var(--color-border))',
                marginBottom: '1.25rem',
                fontSize: '0.75rem',
                color: 'hsl(var(--color-text-muted))',
                lineHeight: 1.5,
              }}>
                💡 <strong>Persistent Multi-Device Session:</strong> Your session credentials are encrypted and stored in your database. You will remain connected across reboots as long as your phone connects to the internet once every 14 days.
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isLoadingWA}
                className="btn"
                style={{
                  width: '100%',
                  background: 'hsla(0, 84%, 60%, 0.1)',
                  color: '#f87171',
                  border: '1px solid hsla(0, 84%, 60%, 0.3)',
                  fontWeight: 600,
                }}
              >
                {isLoadingWA ? 'Unlinking...' : 'Disconnect WhatsApp Number'}
              </button>
            </div>
          ) : (
            /* Disconnected / Connecting Setup */
            <div>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Link your phone directly just like WhatsApp Web. Choose to scan a QR code or enter an 8-character connection code on your mobile app.
              </p>

              {/* Mode Toggle Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                background: 'hsl(var(--color-surface-hover))',
                padding: '0.25rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
              }}>
                <button
                  type="button"
                  onClick={() => { setWaMode('qr'); setWaError(null); }}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    background: waMode === 'qr' ? 'hsl(var(--color-surface))' : 'transparent',
                    color: waMode === 'qr' ? 'hsl(var(--color-text-primary))' : 'hsl(var(--color-text-muted))',
                    boxShadow: waMode === 'qr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  📷 Scan QR Code
                </button>
                <button
                  type="button"
                  onClick={() => { setWaMode('pairing_code'); setWaError(null); }}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    background: waMode === 'pairing_code' ? 'hsl(var(--color-surface))' : 'transparent',
                    color: waMode === 'pairing_code' ? 'hsl(var(--color-text-primary))' : 'hsl(var(--color-text-muted))',
                    boxShadow: waMode === 'pairing_code' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  🔢 Link with Phone Code
                </button>
              </div>

              {waError && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'hsla(0, 84%, 60%, 0.1)',
                  color: '#f87171',
                  border: '1px solid hsla(0, 84%, 60%, 0.3)',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                }}>
                  ⚠️ {waError}
                </div>
              )}

              {/* Tab 1: QR Code */}
              {waMode === 'qr' && (
                <div style={{ textAlign: 'center' }}>
                  {qrCode ? (
                    <div>
                      <div style={{
                        display: 'inline-block',
                        padding: '12px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        marginBottom: '1rem',
                      }}>
                        <img
                          src={qrCode}
                          alt="WhatsApp QR Code"
                          style={{ width: 220, height: 220, display: 'block', borderRadius: '8px' }}
                        />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.5rem' }}>
                        Waiting for you to scan... (Auto-refreshing)
                      </div>
                      <button
                        type="button"
                        onClick={handleResetPairing}
                        disabled={isLoadingWA}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', color: 'hsl(var(--color-text-muted))' }}
                      >
                        Cancel / Reset QR
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem 1rem',
                      border: '2px dashed hsl(var(--color-border))',
                      borderRadius: '12px',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        Generate Linked Device QR Code
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '1rem' }}>
                        Click below to generate a real-time QR code.
                      </div>
                      <button
                        type="button"
                        onClick={handleStartQR}
                        disabled={isLoadingWA}
                        className="btn btn-primary"
                        style={{ padding: '0.6rem 1.5rem' }}
                      >
                        {isLoadingWA ? 'Connecting to WhatsApp...' : 'Generate QR Code'}
                      </button>
                    </div>
                  )}

                  {/* Instructions */}
                  <div style={{
                    textAlign: 'left',
                    background: 'hsl(var(--color-surface-hover))',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: 'hsl(var(--color-text-secondary))',
                    lineHeight: 1.6,
                  }}>
                    <strong style={{ color: 'hsl(var(--color-text-primary))' }}>How to scan:</strong>
                    <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', marginBlockEnd: 0 }}>
                      <li>Open WhatsApp on the clinic phone</li>
                      <li>Go to <strong>Settings</strong> (or tap ⋮ on Android) → <strong>Linked Devices</strong></li>
                      <li>Tap <strong>Link a Device</strong> and point your camera at this QR code</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 2: Pairing Code */}
              {waMode === 'pairing_code' && (
                <div>
                  <form onSubmit={handleRequestPairingCode} style={{ marginBottom: '1rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label className="label">Clinic WhatsApp Phone Number</label>
                      <input
                        className="input"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +91 98765 43210 or 919876543210"
                        style={{ fontFamily: 'monospace' }}
                      />
                      <div style={{ fontSize: '0.725rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                        Include country code (e.g. 91 for India, 1 for US). No spaces required.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingWA || Boolean(pairingCode)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      {isLoadingWA ? 'Requesting Code...' : pairingCode ? 'Code Active (See Below)' : 'Generate 8-Digit Pairing Code'}
                    </button>
                  </form>

                  {pairingCode && (
                    <div style={{
                      background: 'hsla(142, 71%, 45%, 0.1)',
                      border: '1px solid hsla(142, 71%, 45%, 0.3)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      textAlign: 'center',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Your Pairing Code
                      </div>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        fontFamily: 'monospace',
                        color: '#4ade80',
                        letterSpacing: '0.15em',
                        margin: '0.5rem 0',
                      }}>
                        {pairingCode}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                        >
                          {codeCopied ? '✓ Copied' : 'Copy Code'}
                        </button>
                        <button
                          type="button"
                          onClick={handleResetPairing}
                          disabled={isLoadingWA}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', color: 'hsl(var(--color-text-muted))' }}
                        >
                          Change Number / Reset
                        </button>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'hsl(var(--color-text-muted))',
                        background: 'hsl(var(--color-surface))',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
                        Enter code on your phone now. WhatsApp takes 5–10s to link.
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div style={{
                    background: 'hsl(var(--color-surface-hover))',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: 'hsl(var(--color-text-secondary))',
                    lineHeight: 1.6,
                  }}>
                    <strong style={{ color: 'hsl(var(--color-text-primary))' }}>How to enter code:</strong>
                    <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', marginBlockEnd: 0 }}>
                      <li>Open WhatsApp on the clinic phone</li>
                      <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong></li>
                      <li>At the bottom of the camera screen, tap <strong>"Link with phone number instead"</strong></li>
                      <li>Enter the 8-digit code shown above</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
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

          {/* OAuth status badge */}
          <div style={{ marginBottom: '1rem' }}>
            {isLiveGoogleConfigured ? (
              <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'hsla(142, 71%, 45%, 0.12)', border: '1px solid hsla(142, 71%, 45%, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}>
                🟢 Live Google Account OAuth Active
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'hsla(38, 92%, 50%, 0.12)', border: '1px solid hsla(38, 92%, 50%, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }} title="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env for production Google OAuth">
                ⚡ Sandbox Simulation Mode (Set GOOGLE_CLIENT_ID & SECRET in .env for Live Account)
              </span>
            )}
          </div>

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
              {/* Connected Banner */}
              <div style={{
                background: apiDisabled ? 'hsla(38, 92%, 50%, 0.1)' : 'hsla(142, 71%, 45%, 0.1)',
                border: apiDisabled ? '1px solid hsla(38, 92%, 50%, 0.35)' : '1px solid hsla(142, 71%, 45%, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{apiDisabled ? '⚠️' : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: apiDisabled ? '#fbbf24' : '#4ade80' }}>
                    {apiDisabled ? 'Google Calendar Connected (API Action Required)' : 'Google Doctor Calendar Connected'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                    {calendarEmail ? `Account: ${calendarEmail}` : 'OAuth credentials active.'}
                    {calendarName ? ` • Calendar: ${calendarName}` : ''}
                  </div>
                </div>
              </div>

              {/* API Disabled Notice */}
              {apiDisabled && (
                <div style={{
                  background: 'hsla(38, 92%, 50%, 0.1)',
                  border: '1px solid hsla(38, 92%, 50%, 0.3)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fbbf24', marginBottom: '0.35rem' }}>
                    Google Calendar API is Disabled in Google Cloud
                  </div>
                  <p style={{ fontSize: '0.785rem', color: 'hsl(var(--color-text-secondary))', lineHeight: 1.5, margin: 0, marginBottom: '0.75rem' }}>
                    Google returned error 403: Google Calendar API has not been enabled in your Google Cloud Project. Please click the button below to turn it on, then click &quot;Sync Appointments&quot;.
                  </p>
                  {enableApiUrl && (
                    <a
                      href={enableApiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                    >
                      🚀 Enable Google Calendar API in Google Cloud
                    </a>
                  )}
                </div>
              )}

              {/* Unsynced Appointments Notice */}
              {unsyncedCount > 0 && (
                <div style={{
                  background: 'hsla(217, 91%, 60%, 0.1)',
                  border: '1px solid hsla(217, 91%, 60%, 0.3)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
                    📅 <strong>{unsyncedCount} confirmed appointment{unsyncedCount > 1 ? 's' : ''}</strong> pending Google Calendar sync (including &quot;Om&quot;).
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncCalendarAppointments}
                    disabled={isSyncing}
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                  >
                    {isSyncing ? '⏳ Syncing...' : '⚡ Push to Calendar'}
                  </button>
                </div>
              )}

              {/* Feedback Message */}
              {syncMessage && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  background: syncMessage.includes('Successfully') ? 'hsla(142, 71%, 45%, 0.1)' : 'hsla(0, 84%, 60%, 0.1)',
                  color: syncMessage.includes('Successfully') ? '#4ade80' : '#f87171',
                  border: `1px solid ${syncMessage.includes('Successfully') ? 'hsla(142, 71%, 45%, 0.3)' : 'hsla(0, 84%, 60%, 0.3)'}`,
                }}>
                  {syncMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleSyncCalendarAppointments}
                  disabled={isSyncing}
                  className="btn btn-secondary"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {isSyncing ? '⏳ Syncing Appointments...' : '🔄 Sync Appointments'}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'hsla(0, 84%, 60%, 0.1)', color: '#f87171', border: '1px solid hsla(0, 84%, 60%, 0.3)' }}
                  onClick={handleDisconnectCalendar}
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
