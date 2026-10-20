'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

const navLinks: NavLinkItem[] = [
  { label: 'Features', href: '/#features', icon: '💬' },
  { label: 'How It Works', href: '/#how-it-works', icon: '⚡' },
  { label: 'Live Demo', href: '/#demo', icon: '🤖' },
  { label: 'Pricing', href: '/#pricing', icon: '💳' },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Fixed Navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '0.75rem clamp(1rem, 4vw, 2rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          background: 'rgba(8, 12, 24, 0.88)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={handleLinkClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.05rem',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
            }}
          >
            🤖
          </div>
          <span
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
              letterSpacing: '-0.02em',
              color: 'hsl(var(--color-text-primary))',
            }}
          >
            AI Front Desk
          </span>
        </Link>

        {/* Desktop Center Navigation Links */}
        <div
          className="hide-on-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color: 'hsl(var(--color-text-secondary))',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--color-text-primary))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--color-text-secondary))';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right CTA Actions & Hamburger Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Desktop Auth CTAs */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <Link
              href="/login"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.95rem' }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* Quick CTA on Mobile */}
          <Link
            href="/register"
            className="show-on-mobile btn btn-primary btn-sm"
            style={{
              padding: '0.35rem 0.7rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginRight: '0.25rem',
            }}
          >
            Free Trial
          </Link>

          {/* Hamburger Menu Button (Mobile & Tablet) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="show-on-mobile"
            style={{
              background: mobileMenuOpen ? 'hsl(var(--color-surface-3))' : 'hsl(var(--color-surface-2))',
              border: '1px solid hsl(var(--color-border))',
              borderRadius: '8px',
              color: 'hsl(var(--color-text-primary))',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
          >
            {mobileMenuOpen ? (
              // X icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              // Hamburger 3-line icon
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`landing-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <aside
        className={`landing-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-label="Mobile navigation menu"
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid hsl(var(--color-border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              🤖
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  letterSpacing: '-0.02em',
                }}
              >
                AI Front Desk
              </div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(142, 71%, 55%)' }}>
                ● 24/7 AI Reception
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            style={{
              background: 'hsl(var(--color-surface-2))',
              border: '1px solid hsl(var(--color-border))',
              borderRadius: '6px',
              color: 'hsl(var(--color-text-muted))',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div style={{ padding: '1rem 0.875rem', flex: 1 }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'hsl(var(--color-text-muted))',
              padding: '0 0.5rem 0.5rem',
            }}
          >
            Navigation
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 0.875rem',
                  borderRadius: '10px',
                  color: 'hsl(var(--color-text-primary))',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'background 0.15s ease',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--color-surface-2))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="divider" style={{ margin: '1.25rem 0.5rem' }} />

          {/* Auth Actions in Drawer */}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'hsl(var(--color-text-muted))',
              padding: '0 0.5rem 0.5rem',
            }}
          >
            Get Started
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.25rem' }}>
            <Link
              href="/register"
              onClick={handleLinkClick}
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              🚀 Start Free Trial
            </Link>

            <Link
              href="/login"
              onClick={handleLinkClick}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Sign In to Clinic
            </Link>
          </div>
        </div>

        {/* Drawer Footer Status */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid hsl(var(--color-border))',
            background: 'hsl(var(--color-surface-2))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'hsl(var(--color-text-secondary))',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>💬</span>
            <span>WhatsApp & Google Calendar AI</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
            No credit card required &bull; 3-day free trial
          </div>
        </div>
      </aside>
    </>
  );
}
