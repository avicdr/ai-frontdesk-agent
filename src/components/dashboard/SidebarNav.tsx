'use client';

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
    <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
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
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      {isSuperAdmin && (
        <>
          <div className="divider" style={{ margin: '0.75rem 0.5rem' }} />
          <Link
            href="/admin"
            onClick={onNavigate}
            className="sidebar-nav-item"
            style={{
              color: 'hsl(265, 83%, 70%)',
              background: pathname?.startsWith('/admin') ? 'hsla(265, 83%, 65%, 0.15)' : undefined,
              borderColor: pathname?.startsWith('/admin') ? 'hsla(265, 83%, 65%, 0.3)' : undefined,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>👑</span>
            <span>Admin Dashboard</span>
          </Link>
        </>
      )}
    </nav>
  );
}
