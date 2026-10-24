'use client';

// src/components/theme/ThemeToggle.tsx
// Cinematic Obsidian × Phoenix Ember Theme Controls: Icon Toggle & Segmented Switch

import React from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ showLabel = false, className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const dims = {
    sm: { size: 32, iconSize: 15, padding: showLabel ? '0.35rem 0.65rem' : '0.35rem' },
    md: { size: 36, iconSize: 18, padding: showLabel ? '0.45rem 0.85rem' : '0.45rem' },
    lg: { size: 42, iconSize: 20, padding: showLabel ? '0.55rem 1rem' : '0.55rem' },
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        borderRadius: '8px',
        padding: dims.padding,
        minWidth: showLabel ? undefined : `${dims.size}px`,
        height: `${dims.size}px`,
        background: 'var(--color-surface-secondary)',
        border: '1px solid var(--color-border-standard)',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {isDark ? (
          <svg
            style={{ width: dims.iconSize, height: dims.iconSize, color: '#E87A38' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            style={{ width: dims.iconSize, height: dims.iconSize, color: '#C86938' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </span>
      {showLabel && (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

/**
 * Segmented Dual-Theme Selector for Sidebars & Footers.
 * Displays 'Dark' and 'Light' modes side-by-side with clear active highlighting.
 */
export function ThemeSegmentedToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px',
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border-standard)',
        borderRadius: '10px',
        boxSizing: 'border-box',
        gap: '3px',
      }}
    >
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.55rem',
          borderRadius: '7px',
          fontSize: '0.72rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          border: isDark ? '1px solid rgba(232, 75, 44, 0.35)' : '1px solid transparent',
          transition: 'all 0.15s ease',
          background: isDark ? 'linear-gradient(135deg, rgba(232, 75, 44, 0.2), rgba(200, 105, 56, 0.12))' : 'transparent',
          color: isDark ? '#E87A38' : 'var(--color-text-muted)',
          boxShadow: isDark ? '0 0 10px rgba(232, 75, 44, 0.15)' : 'none',
        }}
      >
        <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <span>Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.55rem',
          borderRadius: '7px',
          fontSize: '0.72rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          border: !isDark ? '1px solid rgba(232, 75, 44, 0.35)' : '1px solid transparent',
          transition: 'all 0.15s ease',
          background: !isDark ? 'linear-gradient(135deg, rgba(232, 75, 44, 0.2), rgba(200, 105, 56, 0.12))' : 'transparent',
          color: !isDark ? '#E87A38' : 'var(--color-text-muted)',
          boxShadow: !isDark ? '0 0 10px rgba(232, 75, 44, 0.15)' : 'none',
        }}
      >
        <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Light</span>
      </button>
    </div>
  );
}
