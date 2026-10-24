'use client';

// src/app/dashboard/integrations/page.tsx
// Cinematic Obsidian × Phoenix Ember Clinic Integrations Management: Baileys WhatsApp Multi-Device & Google Calendar

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
    } catch { }
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
    } catch { }
    setCalendarConnected(false);
    setCalendarEmail(null);
    setCalendarName(null);
    setCalendarError(null);
    setApiDisabled(false);
  };

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

  const handleStartQR = async (forceReconnect?: boolean | React.MouseEvent) => {
    const isForce = typeof forceReconnect === 'boolean' ? forceReconnect : false;
    setIsLoadingWA(true);
    setWaError(null);
    setQrCode(null);
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'qr', forceReconnect: isForce }),
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

  const handleRequestPairingCode = async (e?: React.FormEvent, forceReconnect = false) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      setWaError('Please enter a valid phone number with country code.');
      return;
    }
    stopPolling();
    setIsLoadingWA(true);
    setWaError(null);
    if (forceReconnect) {
      setPairingCode(null);
    }
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pairing_code', phoneNumber, forceReconnect }),
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

  const handleRevokePairing = async () => {
    stopPolling();
    setIsLoadingWA(true);
    setWaError(null);
    try {
      await fetch('/api/v1/integrations/whatsapp/session', { method: 'DELETE' });
    } catch { }
    setQrCode(null);
    setPairingCode(null);
    setWaStatus('disconnected');
    setIsLoadingWA(false);
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace('-', ''));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
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

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
          fontWeight: 500,
          letterSpacing: '-0.025em',
          color: '#F3F0E8',
          marginBottom: '0.4rem',
        }}>
          Channels &amp; Integrations
        </h1>
        <p style={{ color: '#9E9B93', fontSize: '0.95rem' }}>
          Connect your clinic WhatsApp channel via Linked Devices and synchronize real-time doctor availability with Google Calendar.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* WhatsApp Card */}
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)', overflow: 'visible' }}>
          {/* Card Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: '#1C1916',
                border: '1px solid rgba(243, 240, 232, 0.08)',
                color: '#E87A38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}>
                💬
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F3F0E8', letterSpacing: '-0.01em' }}>
                  WhatsApp Multi-Device
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#9E9B93' }}>
                  Native phone pairing • Zero Meta developer fees
                </div>
              </div>
            </div>
            <span className={`badge ${waStatus === 'connected' ? 'badge-success' : waStatus === 'connecting' ? 'badge-warning' : 'badge-neutral'}`}>
              {waStatus === 'connected' ? '● Connected' : waStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          {/* Connected State */}
          {waStatus === 'connected' ? (
            <div>
              <div style={{
                background: 'rgba(99, 199, 162, 0.12)',
                border: '1px solid rgba(99, 199, 162, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <div style={{ fontSize: '1.75rem' }}>📱</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#63C7A2' }}>
                    Connected as {connectedNumber || 'Clinic Device'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#D0CBC1', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Your 24/7 AI Receptionist is active. Messages sent to this number are handled automatically.
                  </div>
                </div>
              </div>

              <div style={{
                background: '#1C1916',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                border: '1px solid rgba(243, 240, 232, 0.08)',
                marginBottom: '1.25rem',
                fontSize: '0.75rem',
                color: '#9E9B93',
                lineHeight: 1.5,
              }}>
                ✦ <strong>Persistent Session:</strong> Session credentials are encrypted and stored in your database. You remain connected across reboots as long as your phone connects to the internet once every 14 days.
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isLoadingWA}
                className="btn btn-danger"
                style={{
                  width: '100%',
                  fontWeight: 500,
                  justifyContent: 'center',
                }}
              >
                {isLoadingWA ? 'Unlinking...' : 'Disconnect WhatsApp Line'}
              </button>
            </div>
          ) : (
            /* Disconnected / Connecting Setup */
            <div>
              <p style={{ color: '#9E9B93', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Link your clinic phone directly just like WhatsApp Web. Choose to scan a QR code or enter an 8-character connection code on your mobile app.
              </p>

              {/* Mode Toggle Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem',
                background: '#1C1916',
                padding: '0.25rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                border: '1px solid rgba(243, 240, 232, 0.08)',
              }}>
                <button
                  type="button"
                  onClick={() => { setWaMode('qr'); setWaError(null); }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: waMode === 'qr' ? 600 : 500,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    background: waMode === 'qr' ? '#26201B' : 'transparent',
                    color: waMode === 'qr' ? '#E87A38' : '#9E9B93',
                    boxShadow: waMode === 'qr' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  Scan QR Code
                </button>
                <button
                  type="button"
                  onClick={() => { setWaMode('pairing_code'); setWaError(null); }}
                  style={{
                    padding: '0.55rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: waMode === 'pairing_code' ? 600 : 500,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    background: waMode === 'pairing_code' ? '#26201B' : 'transparent',
                    color: waMode === 'pairing_code' ? '#E87A38' : '#9E9B93',
                    boxShadow: waMode === 'pairing_code' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  Phone Pairing Code
                </button>
              </div>

              {waError && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(232, 75, 44, 0.12)',
                  color: '#E84B2C',
                  border: '1px solid rgba(232, 75, 44, 0.3)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  {waError}
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
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid rgba(243, 240, 232, 0.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        marginBottom: '1rem',
                      }}>
                        <img
                          src={qrCode}
                          alt="WhatsApp QR Code"
                          style={{ width: 220, height: 220, display: 'block', borderRadius: '6px' }}
                        />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9E9B93', marginBottom: '0.75rem' }}>
                        Waiting for you to scan... (Auto-refreshing)
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleStartQR(true)}
                          disabled={isLoadingWA}
                          className="btn btn-secondary btn-sm"
                        >
                          🔄 Regenerate QR
                        </button>
                        <button
                          type="button"
                          onClick={handleRevokePairing}
                          disabled={isLoadingWA}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#E84B2C' }}
                        >
                          ✕ Revoke QR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '2.5rem 1rem',
                      border: '1.5px dashed rgba(243, 240, 232, 0.15)',
                      borderRadius: '12px',
                      marginBottom: '1rem',
                      background: '#1C1916',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F3F0E8', marginBottom: '0.25rem' }}>
                        Generate Linked Device QR Code
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#9E9B93', marginBottom: '1.25rem' }}>
                        Click below to generate a real-time QR code.
                      </div>
                      <button
                        type="button"
                        onClick={handleStartQR}
                        disabled={isLoadingWA}
                        className="btn btn-primary"
                        style={{ padding: '0.65rem 1.6rem' }}
                      >
                        {isLoadingWA ? 'Connecting to WhatsApp...' : 'Generate QR Code'}
                      </button>
                    </div>
                  )}

                  {/* Instructions */}
                  <div style={{
                    textAlign: 'left',
                    background: '#1C1916',
                    borderRadius: '10px',
                    border: '1px solid rgba(243, 240, 232, 0.08)',
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: '#9E9B93',
                    lineHeight: 1.6,
                  }}>
                    <strong style={{ color: '#F3F0E8' }}>How to scan:</strong>
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
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                      <div style={{ fontSize: '0.725rem', color: '#9E9B93', marginTop: '0.25rem' }}>
                        Include country code (e.g. 91 for India, 1 for US). No spaces required.
                      </div>
                    </div>

                    {pairingCode ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleRequestPairingCode(undefined, true)}
                          disabled={isLoadingWA}
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                        >
                          {isLoadingWA ? 'Regenerating...' : '🔄 Regenerate Code'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRevokePairing}
                          disabled={isLoadingWA}
                          className="btn btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#E84B2C' }}
                        >
                          ✕ Revoke Code
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isLoadingWA}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {isLoadingWA ? 'Requesting Code...' : 'Generate 8-Digit Pairing Code'}
                      </button>
                    )}
                  </form>

                  {pairingCode && (
                    <div style={{
                      background: '#1C1916',
                      border: '1px solid rgba(232, 75, 44, 0.28)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      textAlign: 'center',
                      marginBottom: '1rem',
                      boxShadow: '0 0 20px rgba(232, 75, 44, 0.1)',
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9E9B93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Your Pairing Code
                      </div>
                      <div style={{
                        fontSize: '2.1rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: '#E87A38',
                        letterSpacing: '0.15em',
                        margin: '0.5rem 0',
                      }}>
                        {pairingCode}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="btn btn-secondary btn-sm"
                        >
                          {codeCopied ? '✓ Copied' : '📋 Copy Code'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestPairingCode(undefined, true)}
                          disabled={isLoadingWA}
                          className="btn btn-primary btn-sm"
                        >
                          🔄 Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={handleRevokePairing}
                          disabled={isLoadingWA}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#E84B2C' }}
                        >
                          ✕ Revoke
                        </button>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#D0CBC1',
                        background: '#171614',
                        border: '1px solid rgba(243, 240, 232, 0.08)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E87A38', display: 'inline-block' }} />
                        Enter code on your phone now. WhatsApp takes 5–10s to link.
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div style={{
                    background: '#1C1916',
                    borderRadius: '10px',
                    border: '1px solid rgba(243, 240, 232, 0.08)',
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: '#9E9B93',
                    lineHeight: 1.6,
                  }}>
                    <strong style={{ color: '#F3F0E8' }}>How to enter code:</strong>
                    <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', marginBlockEnd: 0 }}>
                      <li>Open WhatsApp on the clinic phone</li>
                      <li>Go to <strong>Settings</strong> → <strong>Linked Devices</strong> → <strong>Link a Device</strong></li>
                      <li>At the bottom of the camera screen, tap <strong>&quot;Link with phone number instead&quot;</strong></li>
                      <li>Enter the 8-digit code shown above</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Google Calendar Card */}
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: '#1C1916',
                border: '1px solid rgba(243, 240, 232, 0.08)',
                color: '#E87A38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}>
                📅
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F3F0E8', letterSpacing: '-0.01em' }}>
                  Google Calendar 2-Way Sync
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#9E9B93' }}>Automatic doctor schedule sync</div>
              </div>
            </div>
            <span className={`badge ${calendarConnected ? 'badge-success' : 'badge-neutral'}`}>
              {calendarConnected ? '● Connected' : 'OAuth 2.0'}
            </span>
          </div>

          <p style={{ color: '#9E9B93', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Connect your primary Google Calendar. The AI receptionist will check your free/busy times in real time to avoid double-bookings, and instantly write confirmed patient slots to your calendar.
          </p>

          {/* OAuth status badge */}
          <div style={{ marginBottom: '1rem' }}>
            {isLiveGoogleConfigured ? (
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                ● Live Google Account OAuth Active
              </span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                Sandbox Simulation Mode (Set GOOGLE_CLIENT_ID &amp; SECRET in .env for Live Account)
              </span>
            )}
          </div>

          <div style={{
            background: '#1C1916',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            border: '1px solid rgba(243, 240, 232, 0.08)',
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1rem' }}>🔒</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F3F0E8' }}>Zero Stored Passwords</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9E9B93', lineHeight: 1.5 }}>
              Tokens are encrypted at rest using AES-256-GCM and refreshed automatically using Google OAuth offline credentials.
            </div>
          </div>

          {calendarConnected ? (
            <div>
              {/* Connected Banner */}
              <div style={{
                background: apiDisabled ? 'rgba(232, 122, 56, 0.12)' : 'rgba(99, 199, 162, 0.12)',
                border: `1px solid ${apiDisabled ? 'rgba(232, 122, 56, 0.3)' : 'rgba(99, 199, 162, 0.3)'}`,
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{apiDisabled ? '⚠️' : '✅'}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: apiDisabled ? '#E87A38' : '#63C7A2' }}>
                    {apiDisabled ? 'Google Calendar Connected (API Action Required)' : 'Google Doctor Calendar Connected'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9E9B93', marginTop: '0.15rem' }}>
                    {calendarEmail ? `Account: ${calendarEmail}` : 'OAuth credentials active.'}
                    {calendarName ? ` • Calendar: ${calendarName}` : ''}
                  </div>
                </div>
              </div>

              {/* API Disabled Notice */}
              {apiDisabled && (
                <div style={{
                  background: 'rgba(232, 122, 56, 0.12)',
                  border: '1px solid rgba(232, 122, 56, 0.3)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#E87A38', marginBottom: '0.35rem' }}>
                    Google Calendar API is Disabled in Google Cloud
                  </div>
                  <p style={{ fontSize: '0.785rem', color: '#D0CBC1', lineHeight: 1.5, margin: 0, marginBottom: '0.75rem' }}>
                    Google returned error 403: Google Calendar API has not been enabled in your Google Cloud Project. Please click the button below to turn it on, then click &quot;Sync Appointments&quot;.
                  </p>
                  {enableApiUrl && (
                    <a
                      href={enableApiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                    >
                      Enable Google Calendar API in Google Cloud
                    </a>
                  )}
                </div>
              )}

              {/* Unsynced Appointments Notice */}
              {unsyncedCount > 0 && (
                <div style={{
                  background: 'rgba(232, 75, 44, 0.12)',
                  border: '1px solid rgba(232, 75, 44, 0.3)',
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#E87A38' }}>
                    📅 <strong>{unsyncedCount} confirmed appointment{unsyncedCount > 1 ? 's' : ''}</strong> pending Google Calendar sync.
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncCalendarAppointments}
                    disabled={isSyncing}
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                  >
                    {isSyncing ? 'Syncing...' : 'Push to Calendar'}
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
                  background: syncMessage.includes('Successfully') ? 'rgba(99, 199, 162, 0.12)' : 'rgba(232, 75, 44, 0.12)',
                  color: syncMessage.includes('Successfully') ? '#63C7A2' : '#E84B2C',
                  border: `1px solid ${syncMessage.includes('Successfully') ? 'rgba(99, 199, 162, 0.3)' : 'rgba(232, 75, 44, 0.3)'}`,
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
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                >
                  {isSyncing ? 'Syncing Appointments...' : '🔄 Sync Appointments'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
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
                style={{ flex: 1, textAlign: 'center', textDecoration: 'none', justifyContent: 'center' }}
              >
                Connect Google Calendar
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
