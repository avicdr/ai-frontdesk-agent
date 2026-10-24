'use client';

// src/components/admin/AdminShell.tsx
// Cinematic Obsidian × Phoenix Ember Super Admin Shell

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', backgroundColor: '#111110', color: '#F3F0E8' }}>
      {/* Mobile Topbar */}
      <header
        className="mobile-topbar"
        style={{
          background: '#0D0D0C',
          borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin navigation menu"
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
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '7px',
            background: 'linear-gradient(135deg, #E84B2C, #C86938)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(232, 75, 44, 0.35)',
          }}>
            👑
          </div>
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
              Admin Console
            </div>
            <div style={{ fontSize: '0.65rem', color: '#9E9B93', fontWeight: 500 }}>
              Platform Super Admin
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle size="sm" />
          <Link
            href="/dashboard"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            Clinic →
          </Link>
        </div>
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
          background: '#0D0D0C',
          borderRight: '1px solid rgba(243, 240, 232, 0.08)',
        }}
      >
        <div style={{
          padding: '1.25rem 1.15rem 1rem 1.15rem',
          borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.625rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #E84B2C, #C86938)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              flexShrink: 0,
              boxShadow: '0 0 14px rgba(232, 75, 44, 0.35)',
            }}>👑</div>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.9rem', color: '#F3F0E8' }}>
                Admin Console
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#9E9B93' }}>Platform Management</div>
            </div>
          </div>

          {/* Close button visible on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
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

        <nav style={{ flex: 1, padding: '0.85rem 0.65rem', overflowY: 'auto' }}>
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
                  padding: '0.55rem 0.8rem',
                  borderRadius: '9px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  background: isActive ? 'rgba(232, 75, 44, 0.12)' : 'transparent',
                  color: isActive ? '#E87A38' : '#9E9B93',
                  border: isActive ? '1px solid rgba(232, 75, 44, 0.28)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? '0 0 16px rgba(232, 75, 44, 0.1)' : 'none',
                }}
              >
                <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="divider" style={{ margin: '0.75rem 0.5rem', background: 'rgba(243, 240, 232, 0.08)' }} />
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="sidebar-nav-item"
            style={{
              padding: '0.55rem 0.8rem',
              borderRadius: '9px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              color: '#E87A38',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🏠</span>
            <span>Clinic Dashboard</span>
          </Link>
        </nav>

        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(243, 240, 232, 0.08)',
          background: '#080505',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              fontSize: '0.8rem',
              fontWeight: 600,
              flexShrink: 0,
            }}>
              👑
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#F3F0E8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#63C7A2',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginTop: '0.1rem',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#63C7A2', boxShadow: '0 0 8px rgba(99, 199, 162, 0.6)' }} />
                Super Admin
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(243, 240, 232, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#9E9B93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Theme</span>
            <ThemeToggle size="sm" showLabel />
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
