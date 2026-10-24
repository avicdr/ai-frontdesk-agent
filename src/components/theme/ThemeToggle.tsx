'use client';

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

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-9 h-9 text-base',
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200 border border-[var(--color-border-standard)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-amber)] hover:border-[var(--color-border-amber)] hover:bg-[var(--color-surface-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--color-flame)]/40 ${showLabel ? 'px-3 py-1.5' : sizeClasses} ${className}`}
    >
      <span className="transition-transform duration-300 transform active:scale-90 inline-flex items-center justify-center">
        {isDark ? (
          // Sun Icon for switching to light
          <svg
            className="w-4 h-4 text-[#E87A38]"
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
          // Moon Icon for switching to dark
          <svg
            className="w-4 h-4 text-[#C86938]"
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
        <span className="text-xs font-medium font-sans">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
