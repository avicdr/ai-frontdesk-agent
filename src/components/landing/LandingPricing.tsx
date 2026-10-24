'use client';

// src/components/landing/LandingPricing.tsx
// Dynamic pricing section with auto-detected currency for Domestic (India / UPI) and International (USD / Crypto)

import React from 'react';
import Link from 'next/link';
import { useGeoCurrency } from '@/lib/hooks/use-geo-currency';

export function LandingPricing() {
  const { isInternational, plans } = useGeoCurrency();

  return (
    <section id="pricing" style={{
      padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 5vw, 3rem)',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#C4512A',
          marginBottom: '0.75rem',
        }}>
          Pricing
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
          fontWeight: 400,
          marginBottom: '0.75rem',
          color: '#201A17',
        }}>
          Simple, transparent pricing
        </h2>
        <p style={{
          color: '#756A62',
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          maxWidth: '520px',
          margin: '0 auto',
        }}>
          {isInternational
            ? 'Monthly subscriptions via Crypto (USDT, USDC, BTC, ETH). No hidden fees. Cancel anytime.'
            : 'Monthly subscriptions via Instant UPI. Cancel anytime.'}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '1.5rem',
        alignItems: 'stretch',
      }}>
        {plans.map(plan => {
          const isHighlighted = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              style={{
                padding: 'clamp(1.75rem, 4vw, 2.5rem) clamp(1.5rem, 3vw, 2rem)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px',
                background: isHighlighted ? '#FFFFFF' : '#FFFFFF',
                border: isHighlighted ? '1.5px solid #C4512A' : '1px solid #E9DED3',
                boxShadow: isHighlighted
                  ? '0 0 0 1px rgba(196, 81, 42, 0.08), 0 20px 40px -8px rgba(196, 81, 42, 0.12)'
                  : '0 1px 3px rgba(32, 26, 23, 0.04)',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              }}
            >
              {isHighlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    background: 'linear-gradient(135deg, #C4512A, #9E3D23)',
                    color: '#FFFFFF',
                    padding: '0.3rem 1rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    letterSpacing: '0.03em',
                    boxShadow: '0 4px 12px rgba(196, 81, 42, 0.3)',
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35rem', color: '#201A17' }}>{plan.name}</h3>
                <p style={{ color: '#756A62', fontSize: '0.8rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {plan.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      fontFamily: 'var(--font-sans)',
                      color: isHighlighted ? '#C4512A' : '#201A17',
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ color: '#756A62', fontSize: '0.85rem' }}>/ month</span>
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#C4512A',
                  marginTop: '0.35rem',
                }}>
                  {plan.chatsDisplay}
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', flex: 1 }}>
                {plan.features.map(f => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      marginBottom: '0.6rem',
                      fontSize: '0.85rem',
                      color: '#756A62',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{
                      color: '#16A34A',
                      flexShrink: 0,
                      marginTop: '0.15rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>✓</span>
                    {f}
                  </li>
                ))}
                {isInternational && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem', fontSize: '0.85rem', color: '#C4512A' }}>
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
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {plan.id === 'pro' ? 'Start Free Trial' : plan.id === 'growth' ? 'Get Started' : 'Choose Starter'}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
