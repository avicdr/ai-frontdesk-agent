'use client';

// src/components/dashboard/DashboardShell.tsx
// Cinematic Obsidian × Phoenix Ember dashboard shell

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { SidebarNav, NavItem } from '@/components/dashboard/SidebarNav';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface DashboardShellProps {
  org: { name?: string; slug?: string } | null;
  isExpired: boolean;
  user: { email?: string; [key: string]: any };
  profile: { full_name?: string; is_super_admin?: boolean } | null;
  isSuperAdmin: boolean;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardShell({
  org,
  isExpired,
  user,
  profile,
  isSuperAdmin,
  navItems,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', backgroundColor: '#111110', color: '#F3F0E8' }}>
      {/* Mobile Topbar */}
      <header className="mobile-topbar" style={{ background: '#0D0D0C', borderBottom: '1px solid rgba(243, 240, 232, 0.08)' }}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          style={{
            background: '#171614',
            border: '1px solid rgba(243, 240, 232, 0.12)',
            borderRadius: '8px',
            color: '#F3F0E8',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1, margin: '0 0.75rem' }}>
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
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#F3F0E8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {org?.name ?? 'AI Front Desk'}
            </div>
            <div style={{ fontSize: '0.65rem', color: isExpired ? '#E84B2C' : '#63C7A2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isExpired ? '#E84B2C' : '#63C7A2', display: 'inline-block' }} />
              {isExpired ? '⚠️ Expired' : 'Live Receptionist'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle size="sm" />
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#1C1916',
            border: '1px solid rgba(243, 240, 232, 0.12)',
            color: '#F3F0E8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </header>

      {/* Backdrop scrim */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ background: '#0D0D0C', borderRight: '1px solid rgba(243, 240, 232, 0.08)' }}>
        {/* Logo & Clinic Info */}
        <div style={{
          padding: '1.25rem 1.15rem 1rem 1.15rem',
          borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.625rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div style={{
              position: 'relative',
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.2), rgba(200, 105, 56, 0.08))',
              border: '1px solid rgba(232, 75, 44, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
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
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#F3F0E8',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{org?.name ?? 'AI Front Desk'}</div>
              <div style={{ fontSize: '0.6875rem', color: isExpired ? '#E84B2C' : '#63C7A2', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500, marginTop: '0.1rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isExpired ? '#E84B2C' : '#63C7A2', display: 'inline-block', boxShadow: isExpired ? 'none' : '0 0 8px rgba(99, 199, 162, 0.6)' }} />
                {isExpired ? 'Subscription expired' : 'Active Reception'}
              </div>
            </div>
          </div>

          {/* Close button visible on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="show-on-mobile"
            style={{
              background: '#171614',
              border: '1px solid rgba(243, 240, 232, 0.1)',
              borderRadius: '6px',
              color: '#9E9B93',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <SidebarNav
          navItems={navItems}
          isSuperAdmin={isSuperAdmin}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* User info / Sign out */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(243, 240, 232, 0.08)',
          background: '#080505',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.35rem 0.4rem',
            marginBottom: '0.65rem',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1C1916',
              border: '1px solid rgba(243, 240, 232, 0.12)',
              color: '#F3F0E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F3F0E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? 'User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#9E9B93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', padding: '0 0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#9E9B93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Theme</span>
            <ThemeToggle size="sm" showLabel />
          </div>
          <form action="/api/v1/auth/signout" method="POST">
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              style={{
                width: '100%',
                fontSize: '0.75rem',
                padding: '0.45rem',
                justifyContent: 'center',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
