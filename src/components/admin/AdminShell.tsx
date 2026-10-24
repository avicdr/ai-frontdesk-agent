'use client';

// src/components/admin/AdminShell.tsx
// Minimal editorial Admin Shell with warm cream palette, burnt orange accents, and clean typography

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
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', backgroundColor: '#FAF5EE' }}>
      {/* Mobile Topbar */}
      <header
        className="mobile-topbar"
        style={{
          background: '#FAF5EE',
          borderBottom: '1px solid #E9DED3',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin navigation menu"
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
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '7px',
            background: 'linear-gradient(135deg, #C4512A, #9E3D23)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            👑
          </div>
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
              Admin Console
            </div>
            <div style={{ fontSize: '0.65rem', color: '#756A62', fontWeight: 500 }}>
              Platform Super Admin
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
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
          background: '#F6EFE5',
          borderRight: '1px solid #E9DED3',
        }}
      >
        <div style={{
          padding: '1.25rem 1.15rem 1rem 1.15rem',
          borderBottom: '1px solid #E9DED3',
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
              background: 'linear-gradient(135deg, #C4512A, #9E3D23)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              flexShrink: 0,
            }}>👑</div>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.9rem', color: '#201A17' }}>
                Admin Console
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#756A62' }}>Platform Management</div>
            </div>
          </div>

          {/* Close button visible on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin menu"
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
                  transition: 'background 0.15s ease, color 0.15s ease',
                  background: isActive ? 'rgba(196, 81, 42, 0.08)' : 'transparent',
                  color: isActive ? '#C4512A' : '#756A62',
                  border: isActive ? '1px solid rgba(196, 81, 42, 0.18)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="divider" style={{ margin: '0.75rem 0.5rem', background: '#E9DED3' }} />
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
              color: '#C4512A',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🏠</span>
            <span>Clinic Dashboard</span>
          </Link>
        </nav>

        <div style={{
          padding: '1rem',
          borderTop: '1px solid #E9DED3',
          background: '#FAF5EE',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#ECE3D7',
              border: '1px solid #DDD0C2',
              color: '#201A17',
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
                color: '#201A17',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayName}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                color: '#235A34',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#235A34' }} />
                Super Admin
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
