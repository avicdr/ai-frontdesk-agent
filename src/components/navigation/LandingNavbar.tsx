'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavLinkItem {
  label: string;
  href: string;
}

const navLinks: NavLinkItem[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          padding: '0 clamp(1rem, 4vw, 3rem)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(233, 222, 211, 0.6)' : '1px solid transparent',
          background: scrolled ? 'rgba(250, 245, 238, 0.85)' : 'transparent',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={handleLinkClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Image
            src="/arenova.png"
            alt="Arenova"
            width={34}
            height={34}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
            priority
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
              color: '#201A17',
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
            gap: '2rem',
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color: '#756A62',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#201A17';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#756A62';
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
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', color: '#756A62' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* Quick CTA on Mobile */}
          <Link
            href="/register"
            className="show-on-mobile btn btn-primary btn-sm"
            style={{
              padding: '0.38rem 0.75rem',
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
              background: mobileMenuOpen ? '#ECE4D8' : '#F5EFE6',
              border: '1px solid #E9DED3',
              borderRadius: '8px',
              color: '#201A17',
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
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
            borderBottom: '1px solid #E9DED3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={30}
              height={30}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 400,
                  fontSize: '1.05rem',
                  letterSpacing: '-0.02em',
                  color: '#201A17',
                }}
              >
                AI Front Desk
              </div>
              <div style={{ fontSize: '0.65rem', color: '#16A34A', fontWeight: 500 }}>
                ● 24/7 AI Reception
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            style={{
              background: '#F5EFE6',
              border: '1px solid #E9DED3',
              borderRadius: '6px',
              color: '#756A62',
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
        <div style={{ padding: '1.25rem 1rem', flex: 1 }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#756A62',
              padding: '0 0.5rem 0.75rem',
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
                  color: '#201A17',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  transition: 'background 0.15s ease',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F5EFE6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="divider" style={{ margin: '1.5rem 0.5rem' }} />

          {/* Auth Actions in Drawer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
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
                fontWeight: 600,
              }}
            >
              Start Free Trial
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
                fontWeight: 500,
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Drawer Footer Status */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #E9DED3',
            background: '#F5EFE6',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#756A62',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>💬</span>
            <span>WhatsApp & Google Calendar AI</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#A39B92', marginTop: '0.25rem' }}>
            No credit card required &bull; 3-day free trial
          </div>
        </div>
      </aside>
    </>
  );
}
