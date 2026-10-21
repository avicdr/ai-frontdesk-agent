'use client';

// src/components/landing/LandingPricing.tsx
// Dynamic pricing section with auto-detected currency for Domestic (India / UPI) and International (USD / Crypto)

import React from 'react';
import Link from 'next/link';
import { useGeoCurrency } from '@/lib/hooks/use-geo-currency';

export function LandingPricing() {
  const { isInternational, setIsInternational, plans } = useGeoCurrency();

  return (
    <section id="pricing" style={{ padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', marginBottom: '0.75rem' }}>
          Simple, Transparent Pricing
        </h2>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', marginBottom: '1.25rem' }}>
          {isInternational
            ? 'Monthly subscriptions via Crypto (USDT, USDC, BTC, ETH). No hidden fees. Cancel anytime.'
            : 'Monthly subscriptions via Instant UPI. Cancel anytime.'}
        </p>

        {/* Currency & Region Selector Switcher */}
        <div style={{
          display: 'inline-flex',
          background: 'hsl(var(--color-surface-2))',
          padding: '0.25rem',
          borderRadius: '9999px',
          border: '1px solid hsl(var(--color-border))',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <button
            type="button"
            onClick={() => setIsInternational(false)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: !isInternational ? 700 : 500,
              background: !isInternational ? 'hsla(221, 83%, 58%, 0.2)' : 'transparent',
              color: !isInternational ? '#93c5fd' : 'hsl(var(--color-text-muted))',
              border: !isInternational ? '1px solid hsla(221, 83%, 58%, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🇮🇳 India (INR • UPI)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsInternational(true)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: isInternational ? 700 : 500,
              background: isInternational ? 'linear-gradient(135deg, hsla(263, 70%, 50%, 0.25), hsla(221, 83%, 58%, 0.25))' : 'transparent',
              color: isInternational ? '#c084fc' : 'hsl(var(--color-text-muted))',
              border: isInternational ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🌐 International (USD • Crypto)</span>
            <span style={{
              background: '#10b981',
              color: 'white',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '4px',
            }}>
              Web3
            </span>
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '1.25rem',
        alignItems: 'stretch',
      }}>
        {plans.map(plan => {
          const isHighlighted = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              className={isHighlighted ? 'card glow-border' : 'card'}
              style={{
                padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1.25rem, 3vw, 2rem) 1.75rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                marginTop: '0.75rem',
                borderColor: isHighlighted && isInternational ? 'rgba(192, 132, 252, 0.5)' : undefined,
              }}
            >
              {isHighlighted && (
                <div
                  className="badge badge-info"
                  style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: isInternational ? '0 4px 14px rgba(168, 85, 247, 0.4)' : '0 4px 14px rgba(59, 130, 246, 0.4)',
                    background: isInternational ? 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(221 83% 58%) 100%)' : undefined,
                    padding: '0.3rem 0.9rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{plan.name}</h3>
                <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {plan.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      color: isHighlighted ? '#c084fc' : undefined,
                    }}
                    className={isHighlighted && !isInternational ? 'text-gradient' : ''}
                  >
                    {plan.price}
                  </span>
                  <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(221 83% 70%)', marginTop: '0.25rem' }}>
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
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      fontSize: '0.85rem',
                      color: 'hsl(var(--color-text-secondary))',
                    }}
                  >
                    <span style={{ color: 'hsl(142, 71%, 55%)', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                    {f}
                  </li>
                ))}
                {isInternational && (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#c084fc' }}>
                    <span style={{ color: '#c084fc', flexShrink: 0, marginTop: '0.1rem' }}>🪙</span>
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
                  background: isHighlighted && isInternational
                    ? 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(221 83% 58%) 100%)'
                    : undefined,
                  boxShadow: isHighlighted && isInternational
                    ? '0 4px 16px hsla(263, 70%, 50%, 0.35)'
                    : undefined,
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
