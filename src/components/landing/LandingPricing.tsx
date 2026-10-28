'use client';

// src/components/landing/LandingPricing.tsx
// Dynamic pricing section with auto-detected currency for Domestic (India / UPI) and International (USD / Crypto)
// Fully theme-adaptive (Dark Obsidian & Warm Ivory Light)

import React from 'react';
import Link from 'next/link';
import { useGeoCurrency } from '@/lib/hooks/use-geo-currency';

export function LandingPricing() {
  const { isInternational, plans } = useGeoCurrency();

  return (
    <section id="pricing" style={{
      padding: 'clamp(4rem, 8vw, 6.5rem) clamp(1rem, 5vw, 3rem)',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.28rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(232, 75, 44, 0.12)',
          border: '1px solid rgba(232, 75, 44, 0.25)',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-amber)',
          marginBottom: '1rem',
          fontFamily: 'var(--font-mono)',
        }}>
          Pricing &amp; Plans
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
          fontWeight: 500,
          marginBottom: '0.85rem',
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.025em',
        }}>
          Transparent software subscriptions for modern clinics
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          maxWidth: '640px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Simple monthly and annual software access tiers in Indian Rupees (INR). All plans include clinic WhatsApp integration, 2-way Google Calendar synchronization, and human staff takeover.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: '1.75rem',
        alignItems: 'stretch',
      }}>
        {plans.map(plan => {
          const isHighlighted = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              style={{
                padding: 'clamp(2rem, 4vw, 2.75rem) clamp(1.5rem, 3vw, 2.25rem)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '18px',
                background: isHighlighted
                  ? 'linear-gradient(180deg, var(--color-surface-secondary) 0%, var(--color-surface-elevated) 100%)'
                  : 'var(--color-surface-elevated)',
                border: isHighlighted ? '1.5px solid var(--color-border-active)' : '1px solid var(--color-border-standard)',
                boxShadow: isHighlighted ? 'var(--shadow-hero)' : 'var(--shadow-card)',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
              }}
            >
              {isHighlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    background: 'linear-gradient(135deg, #E84B2C, #C86938)',
                    color: '#FFFFFF',
                    padding: '0.35rem 1.15rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 14px rgba(232, 75, 44, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
                  {plan.name}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.825rem', marginBottom: '1.5rem', lineHeight: 1.55 }}>
                  {plan.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '2.75rem',
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      fontFamily: 'var(--font-sans)',
                      color: isHighlighted ? 'var(--color-amber)' : 'var(--color-text-primary)',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>/ month</span>
                </div>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-amber)',
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)' }} />
                  {plan.chatsDisplay}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--color-border-subtle)' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {plan.features.map(f => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{
                      color: 'var(--color-success)',
                      flexShrink: 0,
                      marginTop: '0.15rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/register?plan=${plan.id}`}
                className={isHighlighted ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  justifyContent: 'center',
                }}
              >
                {plan.id === 'pro' ? 'Get Started →' : plan.id === 'growth' ? 'Choose Growth' : 'Choose Starter'}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Mandatory Statutory Statement Box */}
      <div
        style={{
          marginTop: '2.5rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-standard)',
          textAlign: 'center',
          maxWidth: '920px',
          margin: '2.5rem auto 0 auto',
        }}
      >
        <p
          style={{
            fontSize: '0.825rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 0.85rem 0',
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)' }}>Subscription Terms:</strong> Your subscription provides access to Arenova&apos;s clinic communication software and AI receptionist services. It does not include medical consultations, medical treatment, or payments to healthcare providers.
        </p>
        <Link
          href="/pricing"
          style={{
            fontSize: '0.825rem',
            color: 'var(--color-amber)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>View Full Pricing Details, Feature Breakdown &amp; Annual Billing Terms</span>
          <span>→</span>
        </Link>
      </div>
    </section>
  );
}
