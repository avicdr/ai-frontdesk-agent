'use client';

// src/components/dashboard/DashboardShell.tsx
// Premium editorial dashboard shell with warm cream styling, refined navigation, and burnt orange accents

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', backgroundColor: '#FAF5EE' }}>
      {/* Mobile Topbar */}
      <header className="mobile-topbar" style={{ background: '#FAF5EE', borderBottom: '1px solid #E9DED3' }}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          style={{
            background: '#F6EFE5',
            border: '1px solid #E9DED3',
            borderRadius: '8px',
            color: '#201A17',
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
              color: '#201A17',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {org?.name ?? 'AI Front Desk'}
            </div>
            <div style={{ fontSize: '0.65rem', color: isExpired ? '#9E3D23' : '#235A34', fontWeight: 500 }}>
              {isExpired ? '⚠️ Expired' : '● Live Receptionist'}
            </div>
          </div>
        </div>

        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#F6EFE5',
          border: '1px solid #E9DED3',
          color: '#201A17',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
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
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ background: '#F6EFE5', borderRight: '1px solid #E9DED3' }}>
        {/* Logo & Clinic Info */}
        <div style={{
          padding: '1.25rem 1.15rem 1rem 1.15rem',
          borderBottom: '1px solid #E9DED3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.625rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={32}
              height={32}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#201A17',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{org?.name ?? 'AI Front Desk'}</div>
              <div style={{ fontSize: '0.6875rem', color: isExpired ? '#9E3D23' : '#235A34', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isExpired ? '#9E3D23' : '#235A34', display: 'inline-block' }} />
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
              background: '#FFFFFF',
              border: '1px solid #E9DED3',
              borderRadius: '6px',
              color: '#756A62',
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
          borderTop: '1px solid #E9DED3',
          background: '#FAF5EE',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.35rem 0.4rem',
            marginBottom: '0.6rem',
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#ECE3D7',
              border: '1px solid #DDD0C2',
              color: '#201A17',
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
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#201A17', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? 'User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#756A62', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
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
