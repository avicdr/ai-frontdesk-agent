'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface PlanDetails {
  id: 'starter' | 'pro' | 'growth';
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyDisplay: string;
  annualDisplay: string;
  effectiveMonthly: string;
  conversations: string;
  whatsappNumbers: string;
  locations: string;
  setupFee: string;
  description: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

const PLANS: PlanDetails[] = [
  {
    id: 'starter',
    name: 'Starter Practice',
    monthlyPrice: 999,
    annualPrice: 9590,
    monthlyDisplay: '₹999',
    annualDisplay: '₹9,590',
    effectiveMonthly: '₹799',
    conversations: '500 AI patient chats / mo',
    whatsappNumbers: '1 WhatsApp Clinic Number',
    locations: '1 Practice Location',
    setupFee: '₹0 (Free self-onboarding)',
    description: 'Designed for single-doctor clinics and dental practices beginning front-desk automation.',
    features: [
      '500 AI patient conversations per month',
      '1 Clinic WhatsApp number connected',
      'Operating hours & location information logic',
      'Up to 10 clinical services in knowledge catalog',
      'Administrative appointment request logging',
      '1 Doctor Google Calendar 2-way sync',
      'Central web chat inbox for clinic staff',
      'Email support (24–48h response)',
    ],
    ctaText: 'Choose Starter',
  },
  {
    id: 'pro',
    name: 'Pro Clinic',
    popular: true,
    badge: 'Most Popular for Clinics',
    monthlyPrice: 1499,
    annualPrice: 14390,
    monthlyDisplay: '₹1,499',
    annualDisplay: '₹14,390',
    effectiveMonthly: '₹1,199',
    conversations: '2,000 AI patient chats / mo',
    whatsappNumbers: '1 WhatsApp Clinic Number',
    locations: '1 Practice Location',
    setupFee: '₹0 (Free self-onboarding)',
    description: 'Recommended for established practices and polyclinics with regular daily patient inquiries.',
    features: [
      '2,000 AI patient conversations per month',
      '1 Clinic WhatsApp number connected',
      'Unlimited clinical procedures in fee catalog',
      'Multi-slot appointment coordination assistance',
      '1 Doctor Google Calendar 2-way sync',
      'Automated patient appointment reminders',
      'Live human staff takeover inbox',
      'Emergency red-flag symptom detection & referral',
      'Priority WhatsApp & email support',
    ],
    ctaText: 'Get Started with Pro →',
  },
  {
    id: 'growth',
    name: 'Growth & Multi-Doctor',
    badge: 'Multi-Doctor Practices',
    monthlyPrice: 2999,
    annualPrice: 28790,
    monthlyDisplay: '₹2,999',
    annualDisplay: '₹28,790',
    effectiveMonthly: '₹2,399',
    conversations: '5,000 AI patient chats / mo',
    whatsappNumbers: 'Up to 2 Clinic WhatsApp Numbers',
    locations: 'Up to 2 Practice Locations',
    setupFee: '₹0 (Includes onboarding assistance)',
    description: 'For busy clinics, multi-doctor centers, and healthcare groups requiring multi-calendar coordination.',
    features: [
      '5,000 AI patient conversations per month',
      'Up to 2 Clinic WhatsApp numbers connected',
      'Multi-doctor calendar orchestration (up to 5 doctors)',
      'Custom clinic voice & localized dialect adaptation',
      'Multi-user front desk staff accounts',
      'Automated patient review collection flows',
      'Advanced enquiry analytics & report exports',
      'Dedicated onboarding account manager',
    ],
    ctaText: 'Choose Growth',
  },
];

export function PricingTableClient() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div>
      {/* Billing Cycle Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.35rem',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
            borderRadius: '9999px',
            gap: '0.35rem',
          }}
        >
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              background: billingCycle === 'monthly' ? 'var(--color-flame)' : 'transparent',
              color: billingCycle === 'monthly' ? '#FFFFFF' : 'var(--color-text-secondary)',
              boxShadow: billingCycle === 'monthly' ? '0 2px 10px rgba(232, 75, 44, 0.35)' : 'none',
            }}
          >
            Monthly Billing
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: billingCycle === 'annual' ? 'var(--color-flame)' : 'transparent',
              color: billingCycle === 'annual' ? '#FFFFFF' : 'var(--color-text-secondary)',
              boxShadow: billingCycle === 'annual' ? '0 2px 10px rgba(232, 75, 44, 0.35)' : 'none',
            }}
          >
            <span>Annual Billing</span>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: billingCycle === 'annual' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(232, 75, 44, 0.15)',
                color: billingCycle === 'annual' ? '#FFFFFF' : 'var(--color-amber)',
                fontWeight: 700,
              }}
            >
              SAVE 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
          gap: '1.75rem',
          alignItems: 'stretch',
        }}
      >
        {PLANS.map((plan) => {
          const isPro = plan.popular;
          const displayPrice = billingCycle === 'monthly' ? plan.monthlyDisplay : plan.annualDisplay;
          const pricePeriod = billingCycle === 'monthly' ? '/ month' : '/ year';

          return (
            <div
              key={plan.id}
              style={{
                padding: 'clamp(2rem, 3.5vw, 2.5rem) clamp(1.5rem, 3vw, 2rem)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px',
                background: isPro
                  ? 'linear-gradient(180deg, var(--color-surface-secondary) 0%, var(--color-surface-elevated) 100%)'
                  : 'var(--color-surface-elevated)',
                border: isPro ? '1.5px solid var(--color-border-active)' : '1px solid var(--color-border-standard)',
                boxShadow: isPro ? 'var(--shadow-hero)' : 'var(--shadow-card)',
                transition: 'all 0.25s ease',
              }}
            >
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    background: isPro ? 'linear-gradient(135deg, #E84B2C, #C86938)' : 'var(--color-surface-raised)',
                    color: '#FFFFFF',
                    padding: '0.35rem 1.15rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                    boxShadow: isPro ? '0 4px 14px rgba(232, 75, 44, 0.45)' : 'none',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  ⭐ {plan.badge}
                </div>
              )}

              {/* Plan Header */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                  {plan.name}
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', lineHeight: 1.55, margin: '0 0 1.25rem 0' }}>
                  {plan.description}
                </p>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '2.8rem',
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      fontFamily: 'var(--font-sans)',
                      color: isPro ? 'var(--color-amber)' : 'var(--color-text-primary)',
                    }}
                  >
                    {displayPrice}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {pricePeriod} (INR)
                  </span>
                </div>

                {billingCycle === 'annual' && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                    Effective {plan.effectiveMonthly} / month (billed annually)
                  </div>
                )}

                {/* Quota Highlights */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'var(--color-surface-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ color: 'var(--color-amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)' }} />
                    {plan.conversations}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.74rem' }}>
                    • {plan.whatsappNumbers}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                    • Setup: {plan.setupFee}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--color-border-subtle)' }} />

              {/* Feature List */}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem 0',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--color-success)',
                        flexShrink: 0,
                        marginTop: '0.15rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action CTA Button */}
              <Link
                href={`/register?plan=${plan.id}&interval=${billingCycle}`}
                className={isPro ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.85rem',
                  fontSize: '0.925rem',
                  fontWeight: 600,
                  justifyContent: 'center',
                }}
              >
                {plan.ctaText}
              </Link>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '0.65rem',
                  fontSize: '0.72rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                Cancel anytime &bull; No medical consultation fees
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
