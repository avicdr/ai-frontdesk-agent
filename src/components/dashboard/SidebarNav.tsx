'use client';

// src/components/dashboard/SidebarNav.tsx
// Minimal editorial sidebar navigation with burnt orange active states

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
              transition: 'background 0.15s ease, color 0.15s ease',
              color: isActive ? '#C4512A' : '#756A62',
              background: isActive ? 'rgba(196, 81, 42, 0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(196, 81, 42, 0.18)' : '1px solid transparent',
              fontWeight: isActive ? 600 : 500,
            }}
          >
            <span style={{ fontSize: '1rem', opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      {isSuperAdmin && (
        <>
          <div className="divider" style={{ margin: '0.75rem 0.5rem', background: '#E9DED3' }} />
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
              color: pathname?.startsWith('/admin') ? '#C4512A' : '#756A62',
              background: pathname?.startsWith('/admin') ? 'rgba(196, 81, 42, 0.08)' : 'transparent',
              border: pathname?.startsWith('/admin') ? '1px solid rgba(196, 81, 42, 0.18)' : '1px solid transparent',
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
