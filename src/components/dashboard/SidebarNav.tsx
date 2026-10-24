'use client';

// src/components/dashboard/SidebarNav.tsx
// Cinematic Obsidian × Phoenix Ember sidebar navigation: Dual-themed & Zero-Overflow

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface SidebarNavProps {
  navItems?: NavItem[];
  items?: NavItem[];
  isSuperAdmin?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ navItems, items, isSuperAdmin, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const list = items || navItems || [];

  return (
    <nav style={{ flex: 1, padding: '0.85rem 0.65rem', overflowY: 'auto', overflowX: 'hidden' }}>
      {list.map(item => {
        const isActive = item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '9px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              color: isActive ? '#E87A38' : 'var(--color-text-muted)',
              background: isActive ? 'rgba(232, 75, 44, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(232, 75, 44, 0.28)' : '1px solid transparent',
              fontWeight: isActive ? 600 : 500,
              boxShadow: isActive ? '0 0 16px rgba(232, 75, 44, 0.1)' : 'none',
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.8, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </Link>
        );
      })}

      {isSuperAdmin && (
        <>
          <div className="divider" style={{ margin: '0.75rem 0.5rem', background: 'var(--color-border-subtle)' }} />
          <Link
            href="/admin"
            onClick={onNavigate}
            className={`sidebar-nav-item ${pathname?.startsWith('/admin') ? 'active' : ''}`}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '9px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              color: pathname?.startsWith('/admin') ? '#E87A38' : 'var(--color-text-muted)',
              background: pathname?.startsWith('/admin') ? 'rgba(232, 75, 44, 0.12)' : 'transparent',
              border: pathname?.startsWith('/admin') ? '1px solid rgba(232, 75, 44, 0.28)' : '1px solid transparent',
              fontWeight: pathname?.startsWith('/admin') ? 600 : 500,
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>👑</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin Console</span>
          </Link>
        </>
      )}
    </nav>
  );
}
