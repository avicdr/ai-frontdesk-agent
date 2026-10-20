'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminNavItem {
  href: string;
  icon: string;
  label: string;
}

interface AdminShellProps {
  displayName: string;
  adminNavItems: AdminNavItem[];
  children: React.ReactNode;
}

export function AdminShell({ displayName, adminNavItems, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
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

  // Prevent background scrolling when drawer is open
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
      <header
        className="mobile-topbar"
        style={{
          background: 'hsl(265 40% 8% / 0.95)',
          borderColor: 'hsl(265 25% 20%)',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin navigation menu"
          style={{
            background: 'hsl(265 35% 14%)',
            border: '1px solid hsl(265 25% 25%)',
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
            background: 'linear-gradient(135deg, hsl(265 83% 65%) 0%, hsl(221 83% 58%) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            flexShrink: 0,
          }}>
            👑
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
              Admin Console
            </div>
            <div style={{ fontSize: '0.625rem', color: 'hsl(265, 83%, 70%)', fontWeight: 600 }}>
              Platform Super Admin
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          style={{
            fontSize: '0.75rem',
            color: 'hsl(265, 83%, 75%)',
            textDecoration: 'none',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            background: 'hsla(265, 83%, 65%, 0.15)',
            border: '1px solid hsla(265, 83%, 65%, 0.3)',
            fontWeight: 600,
          }}
        >
          Clinic →
        </Link>
      </header>

      {/* Backdrop scrim */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Admin Sidebar Drawer */}
      <aside
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
        style={{
          background: 'hsl(265 40% 8%)',
          borderColor: 'hsl(265 25% 20%)',
        }}
      >
        <div style={{
          padding: '1.125rem 1rem',
          borderBottom: '1px solid hsl(265 25% 20%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.625rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, hsl(265 83% 65%) 0%, hsl(221 83% 58%) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              flexShrink: 0,
            }}>👑</div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '0.875rem' }}>
                Admin Console
              </div>
              <div style={{ fontSize: '0.65rem', color: 'hsl(265, 50%, 60%)' }}>Platform Management</div>
            </div>
          </div>

          {/* Close button visible on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
            className="show-on-mobile"
            style={{
              background: 'hsl(265 35% 14%)',
              border: '1px solid hsl(265 25% 25%)',
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

        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
          {adminNavItems.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  background: isActive ? 'hsla(265, 83%, 65%, 0.18)' : undefined,
                  borderColor: isActive ? 'hsla(265, 83%, 65%, 0.4)' : undefined,
                  color: isActive ? 'hsl(265, 83%, 75%)' : undefined,
                }}
              >
                <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="divider" style={{ borderColor: 'hsl(265 25% 20%)' }} />
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="sidebar-nav-item"
            style={{ color: '#93c5fd' }}
          >
            <span>🏠</span>
            <span>Clinic Dashboard</span>
          </Link>
        </nav>

        <div style={{
          padding: '1rem',
          borderTop: '1px solid hsl(265 25% 20%)',
          background: 'hsla(265, 40%, 6%, 0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, hsl(265 83% 65%) 0%, hsl(221 83% 58%) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 2px 8px hsla(265, 83%, 65%, 0.3)',
            }}>
              👑
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'hsl(var(--color-text-primary))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'hsl(265, 83%, 70%)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(142, 71%, 55%)' }} />
                Super Admin
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
