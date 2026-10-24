'use client';

// src/components/dashboard/PostOnboardingCryptoPrompt.tsx
// Rich burnt orange banner prompting international clients to pay via Crypto (USDT, USDC, BTC, ETH)

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
  const [isInternational, setIsInternational] = useState<boolean>(() => {
    return isInternationalClient(orgCountry, orgTimezone);
  });

  // Check geo on mount if country is UNKNOWN
  useEffect(() => {
    if (orgCountry && orgCountry !== 'UNKNOWN') {
      setIsInternational(isInternationalClient(orgCountry, orgTimezone));
      return;
    }

    fetch('/api/v1/geo')
      .then(res => res.json())
      .then(json => {
        if (json?.data?.country) {
          setIsInternational(Boolean(json.data.isInternational));
        }
      })
      .catch(() => {});
  }, [orgCountry, orgTimezone]);

  // Handle URL query flags like ?require_crypto=true or ?plan=starter
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && ['starter', 'pro', 'growth'].includes(planParam)) {
      setSelectedPlanId(planParam as any);
    }

    const requireCrypto = searchParams.get('require_crypto') === 'true';
    if (requireCrypto && isInternational) {
      setShowCryptoModal(true);
    }
  }, [searchParams, orgCountry, orgTimezone, isInternational]);

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
        background: '#EDF7F1',
        border: '1px solid #CEE8D8',
        borderRadius: '16px',
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
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#235A34' }}>
              Crypto Payment Verification In Progress
            </div>
            <div style={{ fontSize: '0.825rem', color: '#487B57' }}>
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
        background: '#FFFFFF',
        border: '1px solid rgba(196, 81, 42, 0.3)',
        borderRadius: '16px',
        marginBottom: '1.75rem',
        boxShadow: '0 4px 20px rgba(196, 81, 42, 0.08)',
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
              background: 'linear-gradient(135deg, #C4512A, #9E3D23)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(196, 81, 42, 0.25)',
            }}>
              🪙
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#201A17', margin: 0 }}>
                  Activate Your Subscription via Crypto
                </h3>
                <span style={{
                  background: 'rgba(196, 81, 42, 0.08)',
                  color: '#C4512A',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(196, 81, 42, 0.2)',
                }}>
                  International Practice
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#756A62', marginTop: '0.2rem', margin: 0 }}>
                Onboarding complete! To activate your AI receptionist 24/7 on WhatsApp, select a plan and pay securely via Crypto (USDT, USDC, BTC, ETH).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '0.55rem 1.25rem',
              }}
              onClick={() => setShowCryptoModal(true)}
            >
              Pay via Crypto (${planDetails.priceUsd})
            </button>
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: '#756A62', fontSize: '1.1rem', cursor: 'pointer', padding: '0.4rem' }}
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
                  background: isSelected ? 'rgba(196, 81, 42, 0.06)' : '#FAF5EE',
                  border: `1.5px solid ${isSelected ? '#C4512A' : '#E9DED3'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? '#C4512A' : '#201A17' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#756A62' }}>
                    {p.chatsDisplay}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#201A17' }}>
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
