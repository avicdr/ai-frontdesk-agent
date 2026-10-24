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
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(1.2)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(243, 240, 232, 0.08)' : '1px solid transparent',
          background: scrolled ? 'rgba(17, 17, 16, 0.88)' : 'transparent',
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
          <div style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: '9px',
            background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.22), rgba(200, 105, 56, 0.08))',
            border: '1px solid rgba(232, 75, 44, 0.32)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(232, 75, 44, 0.2)',
          }}>
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={26}
              height={26}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                objectFit: 'contain',
              }}
              priority
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: '#F3F0E8',
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
            gap: '2.25rem',
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                color: '#9E9B93',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s ease',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F3F0E8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9E9B93';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right CTA Actions & Hamburger Toggle */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          {/* Desktop Auth CTAs */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <Link
              href="/login"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.95rem' }}
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
              background: '#171614',
              border: '1px solid rgba(243, 240, 232, 0.12)',
              borderRadius: '8px',
              color: '#F3F0E8',
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
          background: '#0D0D0C',
          borderLeft: '1px solid rgba(243, 240, 232, 0.08)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={28}
              height={28}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: '1.1rem',
                color: '#F3F0E8',
              }}
            >
              AI Front Desk
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{
              background: '#171614',
              border: '1px solid rgba(243, 240, 232, 0.1)',
              borderRadius: '6px',
              color: '#9E9B93',
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
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={handleLinkClick}
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#F3F0E8',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(243, 240, 232, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}

          <div className="divider" style={{ margin: '1rem 0' }} />

          <Link
            href="/login"
            onClick={handleLinkClick}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '0.5rem' }}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            onClick={handleLinkClick}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Start Free Trial →
          </Link>
        </div>

        {/* Drawer Footer */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(243, 240, 232, 0.08)', fontSize: '0.75rem', color: '#9E9B93', textAlign: 'center' }}>
          Intelligent AI Front Desk Platform
        </div>
      </aside>
    </>
  );
}
