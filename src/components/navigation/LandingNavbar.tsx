'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { usePathname } from 'next/navigation';

interface NavLinkItem {
  label: string;
  href: string;
}

const navLinks: NavLinkItem[] = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

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
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border-subtle)' : '1px solid transparent',
          background: scrolled ? 'var(--glass-bg)' : 'transparent',
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
            gap: '0.65rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Image
            src="/arenova.png"
            alt="Arenova"
            width={38}
            height={38}
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
            priority
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
              }}
            >
              Arenova
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-amber)',
                letterSpacing: '0.04em',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              Clinic AI Receptionist
            </span>
          </div>
        </Link>

        {/* Desktop Center Navigation Links */}
        <div
          className="hide-on-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.25rem',
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right CTA Actions & Hamburger Toggle */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          {/* Theme Toggle Button */}
          <ThemeToggle size="sm" />

          {/* Desktop Auth CTAs */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <Link
              href="/login"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.95rem', color: 'var(--color-text-secondary)' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.85rem', padding: '0.48rem 1.15rem' }}
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
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border-standard)',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
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
        style={{
          background: 'var(--color-surface-elevated)',
          borderLeft: '1px solid var(--color-border-standard)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={32}
              height={32}
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '1.15rem',
                  color: 'var(--color-text-primary)',
                }}
              >
                Arenova
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-amber)',
                  textTransform: 'uppercase',
                }}
              >
                Clinic AI Receptionist
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-standard)',
              borderRadius: '6px',
              color: 'var(--color-text-secondary)',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Menu
          </div>
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleLinkClick}
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}

          <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>
            Policies &amp; Legal
          </div>
          <Link
            href="/terms-of-service"
            onClick={handleLinkClick}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy-policy"
            onClick={handleLinkClick}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/refund-policy"
            onClick={handleLinkClick}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            Refund Policy
          </Link>

          <div className="divider" style={{ margin: '0.85rem 0' }} />

          <Link
            href="/login"
            onClick={handleLinkClick}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            onClick={handleLinkClick}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Get Started →
          </Link>
        </div>

        {/* Drawer Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Interface Theme</span>
          <ThemeToggle showLabel size="sm" />
        </div>
      </aside>
    </>
  );
}
