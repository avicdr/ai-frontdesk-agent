'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarNav, NavItem } from '@/components/dashboard/SidebarNav';

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
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div className="animated-bg" />

      {/* Mobile Topbar */}
      <header className="mobile-topbar">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          style={{
            background: 'hsl(var(--color-surface-2))',
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '8px',
            color: 'hsl(var(--color-text-primary))',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.25rem',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1, margin: '0 0.75rem' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '7px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            flexShrink: 0,
          }}>
            🤖
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {org?.name ?? 'AI Front Desk'}
            </div>
            <div style={{ fontSize: '0.625rem', color: isExpired ? '#f87171' : '#4ade80' }}>
              {isExpired ? '⚠️ Expired' : '● Live Receptionist'}
            </div>
          </div>
        </div>

        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
        </div>
      </header>

      {/* Backdrop scrim */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo & Close Button */}
        <div style={{
          padding: '1.125rem 1rem',
          borderBottom: '1px solid hsl(var(--color-border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.625rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              flexShrink: 0,
            }}>🤖</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: '0.9rem',
                letterSpacing: '-0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{org?.name ?? 'AI Front Desk'}</div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))' }}>
                {isExpired ? '⚠️ Subscription expired' : '● Active Reception'}
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
              background: 'hsl(var(--color-surface-2))',
              border: '1px solid hsl(var(--color-border))',
              borderRadius: '6px',
              color: 'hsl(var(--color-text-muted))',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1rem',
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

        {/* Navigation */}
        <SidebarNav
          navItems={navItems}
          isSuperAdmin={isSuperAdmin}
          onNavigate={() => setMobileOpen(false)}
        />

        {/* User info / Sign out */}
        <div style={{
          padding: '0.875rem',
          borderTop: '1px solid hsl(var(--color-border))',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.5rem',
            borderRadius: '8px',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? 'User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(var(--color-text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
          <form action="/api/v1/auth/signout" method="POST">
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'transparent',
                border: '1px solid hsl(var(--color-border))',
                borderRadius: '6px',
                color: 'hsl(var(--color-text-muted))',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
