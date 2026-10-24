'use client';

// src/components/dashboard/PostOnboardingCryptoPrompt.tsx
// Rich ember banner prompting international clients to pay via Crypto (USDT, USDC, BTC, ETH)
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

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
      <div className="p-5 rounded-2xl bg-[#171614] border border-[#63C7A2]/30 mb-7 flex items-center justify-between flex-wrap gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)] animate-fade-in">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#63C7A2]/10 border border-[#63C7A2]/25 flex items-center justify-center text-lg text-[#63C7A2]">
            ⏳
          </div>
          <div>
            <div className="font-semibold text-sm text-[#F3F0E8] flex items-center gap-2">
              Crypto Payment Verification In Progress
              <span className="text-[10px] font-mono text-[#63C7A2] uppercase tracking-wider bg-[#63C7A2]/10 px-2 py-0.5 rounded-full border border-[#63C7A2]/20">
                PENDING CONFIRMATION
              </span>
            </div>
            <div className="text-xs text-[#9E9B93] mt-0.5">
              Your Web3 transaction hash was submitted and is undergoing network confirmation. Your AI receptionist will activate automatically.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary text-xs"
          onClick={() => setDismissed(true)}
        >
          Dismiss Notice
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
      <div className="p-6 rounded-2xl bg-[#171614] border border-[#E84B2C]/30 mb-7 shadow-[0_8px_32px_rgba(232,75,44,0.12)] relative overflow-hidden group animate-fade-in">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(232,75,44,0.12),transparent_70%)] pointer-events-none" />

        <div className="flex justify-between items-start flex-wrap gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E84B2C] to-[#C86938] flex items-center justify-center text-xl text-[#F3F0E8] shadow-[0_0_16px_rgba(232,75,44,0.4)] shrink-0">
              🪙
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-heading text-lg font-semibold text-[#F3F0E8]">
                  Activate Global Reception via Web3 Settlement
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#E87A38]/15 border border-[#E87A38]/30 text-[#E87A38]">
                  International Practice
                </span>
              </div>
              <p className="text-xs text-[#9E9B93] mt-1 max-w-2xl leading-relaxed">
                Clinic configuration verified. To maintain uninterrupted 24/7 AI receptionist availability on WhatsApp, select your monthly tier and settle securely via Web3 (USDT, USDC, BTC, or ETH).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary text-xs font-semibold px-4 py-2"
              onClick={() => setShowCryptoModal(true)}
            >
              Pay via Crypto (${planDetails.priceUsd})
            </button>
            <button
              type="button"
              className="text-[#9E9B93] hover:text-[#F3F0E8] transition-colors text-base p-1"
              onClick={() => setDismissed(true)}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Tier Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#F3F0E8]/08 relative z-10">
          {PRICING_PLANS.map(p => {
            const isSelected = selectedPlanId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setShowCryptoModal(true);
                }}
                className={`p-3.5 rounded-xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#1C1916] border border-[#E84B2C] shadow-[0_0_12px_rgba(232,75,44,0.2)]'
                    : 'bg-[#111110]/70 border border-[#F3F0E8]/08 hover:border-[#F3F0E8]/16 hover:bg-[#1C1916]'
                }`}
              >
                <div>
                  <div className={`text-xs font-semibold ${isSelected ? 'text-[#E87A38]' : 'text-[#F3F0E8]'}`}>
                    {p.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#9E9B93]">
                    {p.chatsDisplay}
                  </div>
                </div>
                <div className="font-heading font-bold text-sm text-[#F3F0E8]">
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
