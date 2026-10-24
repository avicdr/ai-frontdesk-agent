'use client';

// src/components/landing/LandingPricing.tsx
// Dynamic pricing section with auto-detected currency for Domestic (India / UPI) and International (USD / Crypto)
// Redesigned with Cinematic Obsidian × Phoenix Ember visual language

import React from 'react';
import Link from 'next/link';
import { useGeoCurrency } from '@/lib/hooks/use-geo-currency';

export function LandingPricing() {
  const { isInternational, plans } = useGeoCurrency();

  return (
    <section id="pricing" style={{
      padding: 'clamp(4.5rem, 10vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
      maxWidth: '1160px',
      margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.28rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(232, 75, 44, 0.1)',
          border: '1px solid rgba(232, 75, 44, 0.25)',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#E87A38',
          marginBottom: '1rem',
        }}>
          Pricing & Plans
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
          fontWeight: 500,
          marginBottom: '0.85rem',
          color: '#F3F0E8',
          letterSpacing: '-0.025em',
        }}>
          Simple, transparent pricing
        </h2>
        <p style={{
          color: '#9E9B93',
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          maxWidth: '560px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          {isInternational
            ? 'Monthly subscriptions via Crypto (USDT, USDC, BTC, ETH). No hidden fees. Cancel anytime.'
            : 'Monthly subscriptions via Instant UPI. No lock-in. Cancel anytime.'}
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
                background: isHighlighted ? 'linear-gradient(180deg, #1C1916 0%, #171614 100%)' : '#171614',
                border: isHighlighted ? '1.5px solid rgba(232, 75, 44, 0.4)' : '1px solid rgba(243, 240, 232, 0.08)',
                boxShadow: isHighlighted
                  ? '0 0 35px rgba(232, 75, 44, 0.16), 0 20px 48px -10px rgba(0, 0, 0, 0.7)'
                  : '0 4px 20px rgba(0, 0, 0, 0.4)',
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
                    color: '#F3F0E8',
                    padding: '0.35rem 1.15rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                    boxShadow: '0 4px 14px rgba(232, 75, 44, 0.45)',
                    border: '1px solid rgba(243, 240, 232, 0.2)',
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.35rem', color: '#F3F0E8' }}>{plan.name}</h3>
                <p style={{ color: '#9E9B93', fontSize: '0.825rem', marginBottom: '1.5rem', lineHeight: 1.55 }}>
                  {plan.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '2.75rem',
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      fontFamily: 'var(--font-sans)',
                      color: isHighlighted ? '#E87A38' : '#F3F0E8',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ color: '#9E9B93', fontSize: '0.875rem' }}>/ month</span>
                </div>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#C86938',
                  marginTop: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E87A38' }} />
                  {plan.chatsDisplay}
                </div>
              </div>

              <div className="divider" style={{ marginBottom: '1.5rem', background: 'rgba(243, 240, 232, 0.08)' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {plan.features.map(f => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      fontSize: '0.875rem',
                      color: '#D0CBC1',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{
                      color: '#63C7A2',
                      flexShrink: 0,
                      marginTop: '0.15rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}>✓</span>
                    {f}
                  </li>
                ))}
                {isInternational && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.875rem', color: '#E87A38' }}>
                    <span style={{ flexShrink: 0, marginTop: '0.1rem' }}>🪙</span>
                    Pay via USDT (TRC-20/ERC-20), USDC, or BTC
                  </li>
                )}
              </ul>

              <Link
                href={`/onboarding?plan=${plan.id}`}
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
                {plan.id === 'pro' ? 'Start Free Trial →' : plan.id === 'growth' ? 'Get Started' : 'Choose Starter'}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
