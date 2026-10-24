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
        background: '#F4F1EB',
        border: '1px solid #E7E2DA',
        borderRadius: '10px',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#706C65', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
            Selected International Plan
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.15rem',
            fontWeight: 500,
            color: '#262522',
          }}>
            {planName}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            fontWeight: 500,
            color: '#262522',
          }}>
            ${amountUsd} <span style={{ fontSize: '0.85rem', color: '#706C65', fontFamily: 'inherit' }}>USD</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#706C65' }}>
            Billed monthly • Cancel anytime
          </div>
        </div>
      </div>

      {isSuccess ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          background: '#EBF3ED',
          border: '1px solid #D5E4D8',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✦</div>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#2A5A36',
            marginBottom: '0.5rem',
          }}>
            Transaction Hash Submitted
          </h3>
          <p style={{ color: '#406B49', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Your transaction reference <strong style={{ color: '#262522', fontFamily: 'monospace' }}>{txHash.slice(0, 10)}...{txHash.slice(-6)}</strong> has been received. Your AI receptionist will be fully activated upon automated/admin network confirmation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {onCancel && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCancel}
              >
                Close &amp; Return
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Network Selection Tabs */}
          <div>
            <label className="label" style={{ marginBottom: '0.5rem', display: 'block', fontSize: '0.85rem' }}>
              Select Payment Cryptocurrency &amp; Network:
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
                      background: isSelected ? '#F8E8DE' : '#FFFFFF',
                      border: `1.5px solid ${isSelected ? '#D97757' : '#E7E2DA'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.5rem',
                      color: isSelected ? '#C86646' : '#262522',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 1px 3px rgba(217,119,87,0.12)' : 'none',
                    }}
                  >
                    {net.recommended && (
                      <span style={{
                        position: 'absolute',
                        top: -7,
                        right: 6,
                        background: '#EBF3ED',
                        color: '#2A5A36',
                        border: '1px solid #D5E4D8',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}>
                        Low Fee
                      </span>
                    )}
                    <div>{net.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#706C65', marginTop: '0.15rem' }}>
                      {net.networkName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deposit Address & QR Section */}
          <div style={{
            background: '#F4F1EB',
            border: '1px solid #E7E2DA',
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: '1.25rem',
            alignItems: 'center',
          }}>
            {/* Visual Crisp QR Code */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E7E2DA',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(38,37,34,0.06)',
              margin: '0 auto',
              maxWidth: 160,
            }}>
              <div style={{ width: 130, height: 130, background: '#FAF9F5', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={selectedNetwork.qrImagePath}
                  alt={`${selectedNetwork.name} Deposit QR`}
                  style={{
                    width: 122,
                    height: 122,
                    objectFit: 'contain',
                    borderRadius: '4px',
                    display: 'block',
                  }}
                />
              </div>
              <div style={{ color: '#262522', fontSize: '0.72rem', fontWeight: 600, marginTop: '0.4rem' }}>
                {selectedNetwork.symbol} Deposit
              </div>
              <div style={{ color: '#706C65', fontSize: '0.65rem' }}>
                {selectedNetwork.networkName}
              </div>
            </div>

            {/* Address Details & Copy Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#706C65', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  Exact Amount to Send
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid #E7E2DA',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: '#262522',
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
                <div style={{ fontSize: '0.7rem', color: '#706C65', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  Official {selectedNetwork.name} Deposit Address
                </div>
                <div style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #E7E2DA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}>
                  <div style={{
                    fontSize: '0.825rem',
                    fontWeight: 500,
                    color: '#262522',
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

              <div style={{ fontSize: '0.72rem', color: '#8A5812', background: '#FAF3E7', border: '1px solid #F0E1C6', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                ✦ {selectedNetwork.instructions}
              </div>
            </div>
          </div>

          {/* Form for Submitting TxID */}
          <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-field">
              <label className="label" style={{ fontSize: '0.85rem' }}>
                Transaction Hash (TxID) <span style={{ color: '#A83830' }}>*</span>
              </label>
              <input
                className="input"
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
                placeholder="e.g. 0x8a92f0... or Tron TxID from your wallet"
                required
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <span className="form-hint" style={{ fontSize: '0.75rem', color: '#706C65' }}>
                Find this in your Binance, MetaMask, OKX, or TronLink withdrawal receipt.
              </span>
            </div>

            {errorMessage && (
              <div style={{
                padding: '0.65rem 0.85rem',
                background: '#FAEBEA',
                border: '1px solid #F3CFCB',
                borderRadius: '6px',
                color: '#A83830',
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
                  padding: '0.65rem 1.5rem',
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Submit Crypto Payment for Activation'}
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
      background: 'rgba(38, 37, 34, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E7E2DA',
        borderRadius: '16px',
        maxWidth: 620,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 'clamp(1.25rem, 4vw, 2rem)',
        boxShadow: '0 12px 36px rgba(38, 37, 34, 0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🪙</span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: '#262522',
            }}>
              Pay via Crypto
            </h2>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#706C65',
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
