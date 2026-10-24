'use client';

// src/components/dashboard/SidebarNav.tsx
// Cinematic Obsidian × Phoenix Ember sidebar navigation

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface SidebarNavProps {
  navItems: NavItem[];
  isSuperAdmin?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ navItems, isSuperAdmin, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: '0.85rem 0.65rem', overflowY: 'auto' }}>
      {navItems.map(item => {
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
              padding: '0.55rem 0.8rem',
              borderRadius: '9px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              color: isActive ? '#E87A38' : '#9E9B93',
              background: isActive ? 'rgba(232, 75, 44, 0.12)' : 'transparent',
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

      {isSuperAdmin && (
        <>
          <div className="divider" style={{ margin: '0.75rem 0.5rem', background: 'rgba(243, 240, 232, 0.08)' }} />
          <Link
            href="/admin"
            onClick={onNavigate}
            className={`sidebar-nav-item ${pathname?.startsWith('/admin') ? 'active' : ''}`}
            style={{
              padding: '0.55rem 0.8rem',
              borderRadius: '9px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              color: pathname?.startsWith('/admin') ? '#E87A38' : '#9E9B93',
              background: pathname?.startsWith('/admin') ? 'rgba(232, 75, 44, 0.12)' : 'transparent',
              border: pathname?.startsWith('/admin') ? '1px solid rgba(232, 75, 44, 0.28)' : '1px solid transparent',
              fontWeight: pathname?.startsWith('/admin') ? 600 : 500,
            }}
          >
            <span style={{ fontSize: '1rem' }}>👑</span>
            <span>Admin Console</span>
          </Link>
        </>
      )}
    </nav>
  );
}
