'use client';

// src/components/dashboard/PostOnboardingCryptoPrompt.tsx
// Prompts international clients to purchase their subscription and pay via Crypto after onboarding

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRICING_PLANS, isInternationalClient } from '@/lib/constants/billing';
import { CryptoPaymentWidget } from '@/components/billing/CryptoPaymentWidget';

interface PostOnboardingCryptoPromptProps {
  subscriptionStatus?: string | null;
  orgCountry?: string | null;
  orgTimezone?: string | null;
  currentPlanSlug?: string | null;
}

export function PostOnboardingCryptoPrompt({
  subscriptionStatus,
  orgCountry,
  orgTimezone,
  currentPlanSlug,
}: PostOnboardingCryptoPromptProps) {
  const searchParams = useSearchParams();
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<'starter' | 'pro' | 'growth'>(() => {
    if (currentPlanSlug && ['starter', 'pro', 'growth'].includes(currentPlanSlug)) {
      return currentPlanSlug as any;
    }
    return 'pro';
  });
  const [dismissed, setDismissed] = useState(false);
  const [isInternational, setIsInternational] = useState(() =>
    isInternationalClient(orgCountry, orgTimezone)
  );

  useEffect(() => {
    // If not detected via org country/timezone, check client geo endpoint
    fetch('/api/v1/geo')
      .then(res => res.json())
      .then(geo => {
        if (geo?.data?.isInternational) {
          setIsInternational(true);
        }
      })
      .catch(() => {});

    // Auto-open modal if user was redirected from onboarding with require_crypto=true
    if (searchParams.get('require_crypto') === 'true' || searchParams.get('onboarding') === 'complete') {
      const planFromUrl = searchParams.get('plan');
      if (planFromUrl && ['starter', 'pro', 'growth'].includes(planFromUrl)) {
        setSelectedPlanId(planFromUrl as any);
      }
      setShowCryptoModal(true);
    }
  }, [searchParams]);

  // If already active or dismissed or not international, don't show prompt
  if (!isInternational || dismissed) {
    return null;
  }

  const isSubActive = subscriptionStatus === 'active';
  const isPaymentSubmitted = searchParams.get('payment_submitted') === 'true';

  if (isPaymentSubmitted) {
    return (
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, hsla(263, 70%, 50%, 0.15) 0%, hsla(142, 71%, 45%, 0.15) 100%)',
        border: '1px solid hsla(263, 70%, 50%, 0.35)',
        borderRadius: '14px',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>⏳</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
              Crypto Payment Verification In Progress
            </div>
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>
              Your crypto transaction hash was received and is awaiting blockchain/admin confirmation. Your receptionist will activate automatically.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (isSubActive) {
    return null;
  }

  const planDetails = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[1];

  return (
    <>
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, hsla(263, 70%, 50%, 0.18) 0%, hsla(221, 83%, 58%, 0.18) 100%)',
        border: '1.5px solid rgba(192, 132, 252, 0.45)',
        borderRadius: '16px',
        marginBottom: '1.75rem',
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)',
            }}>
              🪙
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Purchase Your Subscription via Crypto
                </h3>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  International Clients
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))', marginTop: '0.2rem' }}>
                Onboarding complete! To activate your AI receptionist 24/7 on WhatsApp, select a plan and pay securely via Crypto (USDT, USDC, BTC, ETH).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(221 83% 58%) 100%)',
                boxShadow: '0 4px 16px hsla(263, 70%, 50%, 0.4)',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.65rem 1.4rem',
              }}
              onClick={() => setShowCryptoModal(true)}
            >
              ⚡ Pay via Crypto (${planDetails.priceUsd})
            </button>
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: 'hsl(var(--color-text-muted))', fontSize: '1.1rem', cursor: 'pointer', padding: '0.4rem' }}
              onClick={() => setDismissed(true)}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Tier Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginTop: '0.25rem',
        }}>
          {PRICING_PLANS.map(p => {
            const isSelected = selectedPlanId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setShowCryptoModal(true);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: isSelected ? 'hsla(263, 70%, 50%, 0.25)' : 'hsl(var(--color-surface))',
                  border: `1.5px solid ${isSelected ? '#c084fc' : 'hsl(var(--color-border))'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#ffffff' : 'hsl(var(--color-text-primary))' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                    {p.chatsDisplay}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#4ade80' }}>
                  {p.priceUsdDisplay}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCryptoModal && (
        <CryptoPaymentWidget
          planId={selectedPlanId}
          planName={planDetails.name}
          amountUsd={planDetails.priceUsd}
          onSuccess={() => {
            setShowCryptoModal(false);
          }}
          onCancel={() => setShowCryptoModal(false)}
        />
      )}
    </>
  );
}
