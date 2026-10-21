'use client';

// src/components/billing/CryptoPaymentWidget.tsx
// Premium, high-conversion crypto payment widget supporting USDT (TRC20, ERC20), USDC (Polygon), BTC, and ETH

import React, { useState } from 'react';
import { CRYPTO_NETWORKS, CryptoNetworkOption } from '@/lib/constants/billing';

interface CryptoPaymentWidgetProps {
  planId: 'starter' | 'pro' | 'growth';
  planName: string;
  amountUsd: number;
  orderId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEmbedded?: boolean; // If true, renders without modal frame
}

export function CryptoPaymentWidget({
  planId,
  planName,
  amountUsd,
  orderId: initialOrderId,
  onSuccess,
  onCancel,
  isEmbedded = false,
}: CryptoPaymentWidgetProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetworkOption>(CRYPTO_NETWORKS[0]);
  const [txHash, setTxHash] = useState('');
  const [senderWallet, setSenderWallet] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(initialOrderId || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCopy = (text: string, type: 'address' | 'amount') => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
    }
  };

  const ensureOrder = async (): Promise<string> => {
    if (orderId) return orderId;

    // Create payment order on the fly
    const res = await fetch('/api/v1/billing/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        currency: 'USD',
        provider: 'crypto',
        cryptoNetwork: selectedNetwork.id,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.data?.orderId) {
      throw new Error(json.error?.message || 'Failed to initialize payment order');
    }

    setOrderId(json.data.orderId);
    return json.data.orderId;
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setErrorMessage('Please enter the Transaction Hash (TxID) from your wallet');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const activeOrderId = await ensureOrder();

      const payRes = await fetch('/api/v1/billing/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrderId,
          txHash: txHash.trim(),
          cryptoNetwork: selectedNetwork.id,
          senderWallet: senderWallet.trim() || undefined,
        }),
      });

      const payJson = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payJson.error?.message || 'Failed to submit payment verification reference.');
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Crypto payment submission error:', err);
      setErrorMessage(err?.message || 'Failed to submit transaction reference. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Plan Pill */}
      <div style={{
        background: 'linear-gradient(135deg, hsla(263, 70%, 50%, 0.15) 0%, hsla(221, 83%, 58%, 0.15) 100%)',
        border: '1px solid hsla(263, 70%, 50%, 0.3)',
        borderRadius: '12px',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            Selected International Plan
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            {planName}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>
            ${amountUsd} <span style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))', fontWeight: 500 }}>USD</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
            Billed monthly • Cancel anytime
          </div>
        </div>
      </div>

      {isSuccess ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          background: 'hsla(142, 71%, 45%, 0.1)',
          border: '1px solid hsla(142, 71%, 45%, 0.3)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80', marginBottom: '0.5rem' }}>
            Transaction Hash Submitted!
          </h3>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 1.5rem' }}>
            Your transaction reference <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>{txHash.slice(0, 10)}...{txHash.slice(-6)}</strong> has been received. Your AI receptionist will be fully activated upon automated/admin network confirmation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {onCancel && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCancel}
              >
                Close & Return
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Network Selection Tabs */}
          <div>
            <label className="label" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>
              Select Payment Cryptocurrency & Network:
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.5rem',
            }}>
              {CRYPTO_NETWORKS.map(net => {
                const isSelected = selectedNetwork.id === net.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setSelectedNetwork(net)}
                    style={{
                      background: isSelected ? 'hsla(263, 70%, 50%, 0.25)' : 'hsl(var(--color-surface-2))',
                      border: `1.5px solid ${isSelected ? '#a855f7' : 'hsl(var(--color-border))'}`,
                      borderRadius: '10px',
                      padding: '0.6rem 0.5rem',
                      color: isSelected ? '#ffffff' : 'hsl(var(--color-text-secondary))',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px hsla(263, 70%, 50%, 0.3)' : 'none',
                    }}
                  >
                    {net.recommended && (
                      <span style={{
                        position: 'absolute',
                        top: -7,
                        right: 6,
                        background: '#10b981',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}>
                        Low Fee
                      </span>
                    )}
                    <div>{net.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.15rem' }}>
                      {net.networkName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deposit Address & QR Section */}
          <div style={{
            background: 'hsl(var(--color-surface-2))',
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: '1.25rem',
            alignItems: 'center',
          }}>
            {/* Visual Crisp QR Code */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              margin: '0 auto',
            }}>
              <div style={{ width: 130, height: 130, background: '#f8fafc', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 100 100" width="118" height="118" fill="#0f172a">
                  <rect x="0" y="0" width="28" height="28" rx="3" fill="#0f172a"/>
                  <rect x="4" y="4" width="20" height="20" rx="2" fill="#ffffff"/>
                  <rect x="8" y="8" width="12" height="12" rx="1" fill="#0f172a"/>
                  <rect x="72" y="0" width="28" height="28" rx="3" fill="#0f172a"/>
                  <rect x="76" y="4" width="20" height="20" rx="2" fill="#ffffff"/>
                  <rect x="80" y="8" width="12" height="12" rx="1" fill="#0f172a"/>
                  <rect x="0" y="72" width="28" height="28" rx="3" fill="#0f172a"/>
                  <rect x="4" y="76" width="20" height="20" rx="2" fill="#ffffff"/>
                  <rect x="8" y="80" width="12" height="12" rx="1" fill="#0f172a"/>
                  <rect x="38" y="8" width="10" height="20" fill="#0f172a"/>
                  <rect x="8" y="38" width="20" height="10" fill="#0f172a"/>
                  <rect x="36" y="36" width="28" height="28" rx="2" fill="#0f172a"/>
                  <rect x="70" y="42" width="22" height="10" fill="#0f172a"/>
                  <rect x="42" y="72" width="12" height="22" fill="#0f172a"/>
                  <rect x="72" y="72" width="22" height="22" rx="2" fill="#0f172a"/>
                </svg>
              </div>
              <div style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.4rem' }}>
                {selectedNetwork.symbol} Deposit
              </div>
              <div style={{ color: '#64748b', fontSize: '0.65rem' }}>
                {selectedNetwork.networkName}
              </div>
            </div>

            {/* Address Details & Copy Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  Exact Amount to Send
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    background: 'hsl(var(--color-surface))',
                    border: '1px solid hsl(var(--color-border))',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#4ade80',
                    fontFamily: 'monospace',
                  }}>
                    {amountUsd} {selectedNetwork.symbol}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${amountUsd}`, 'amount')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                  >
                    {copiedAmount ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  Official {selectedNetwork.name} Deposit Address
                </div>
                <div style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '8px',
                  background: 'hsl(var(--color-surface))',
                  border: '1px solid hsl(var(--color-border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}>
                  <div style={{
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: '#93c5fd',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}>
                    {selectedNetwork.address}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedNetwork.address, 'address')}
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                  >
                    {copiedAddress ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'hsl(38 92% 50%)', background: 'hsla(38, 92%, 50%, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                ⚠️ {selectedNetwork.instructions}
              </div>
            </div>
          </div>

          {/* Form for Submitting TxID */}
          <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-field">
              <label className="label" style={{ fontSize: '0.85rem' }}>
                <span>🧾</span> Transaction Hash (TxID) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                className="input"
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="e.g. 0x8a92f0... or Tron TxID from your exchange / wallet"
                required
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <span className="form-hint" style={{ fontSize: '0.75rem' }}>
                💡 Find this in your Binance, MetaMask, OKX, or TronLink withdrawal receipt.
              </span>
            </div>

            {errorMessage && (
              <div style={{
                padding: '0.65rem 0.85rem',
                background: 'hsla(0, 84%, 60%, 0.12)',
                border: '1px solid hsla(0, 84%, 60%, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.8rem',
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !txHash.trim()}
                style={{
                  background: 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(221 83% 58%) 100%)',
                  fontWeight: 700,
                  boxShadow: '0 4px 16px hsla(263, 70%, 50%, 0.35)',
                  padding: '0.75rem 1.75rem',
                }}
              >
                {isSubmitting ? 'Verifying...' : '⚡ Submit Crypto Payment for Activation'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  // Modal Frame
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: 'hsl(var(--color-surface))',
        border: '1px solid hsl(var(--color-border))',
        borderRadius: '20px',
        maxWidth: 620,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 'clamp(1.25rem, 4vw, 2rem)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🪙</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pay via Crypto</h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'hsl(var(--color-text-muted))',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {content}
      </div>
    </div>
  );
}
