'use client';

// src/components/analytics/AnalyticsTracker.tsx
// Automatic SPA route listener, scroll depth milestones, engagement timer, and interaction listener

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, trackEvent, shouldExcludeTracking } from '@/lib/analytics/tracker';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTimeRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number>(Date.now());
  const isTabVisibleRef = useRef<boolean>(true);
  const scrollMilestonesRef = useRef<Set<number>>(new Set());

  // 1. SPA Route Change Listener
  useEffect(() => {
    if (!pathname) return;
    if (shouldExcludeTracking(pathname)) return;

    // Reset scroll milestones and timer for the new route
    scrollMilestonesRef.current.clear();
    activeTimeRef.current = 0;
    lastActiveTimestampRef.current = Date.now();

    // Trigger page view
    trackPageView(pathname, typeof document !== 'undefined' ? document.title : undefined);
  }, [pathname, searchParams]);

  // 2. Active Engagement & Visibility Tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateActiveTime = () => {
      if (isTabVisibleRef.current) {
        const now = Date.now();
        const diffSecs = Math.round((now - lastActiveTimestampRef.current) / 1000);
        if (diffSecs > 0 && diffSecs < 120) {
          activeTimeRef.current += diffSecs;
        }
        lastActiveTimestampRef.current = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateActiveTime();
        isTabVisibleRef.current = false;

        // Send engagement heartbeat on tab hide
        if (activeTimeRef.current >= 5) {
          trackEvent('engagement_heartbeat', {
            active_seconds: activeTimeRef.current,
            path: window.location.pathname,
          });
        }
      } else {
        isTabVisibleRef.current = true;
        lastActiveTimestampRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      updateActiveTime();
      if (activeTimeRef.current >= 3) {
        trackEvent('page_leave', {
          active_seconds: activeTimeRef.current,
          path: window.location.pathname,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // 3. Scroll Depth Milestones Listener (25%, 50%, 75%, 90%, 100%)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;
    const milestones = [25, 50, 75, 90, 100];

    const checkScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollPercent = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));

      for (const m of milestones) {
        if (scrollPercent >= m && !scrollMilestonesRef.current.has(m)) {
          scrollMilestonesRef.current.add(m);
          trackEvent('scroll_depth', {
            depth: m,
            path: window.location.pathname,
          });
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(checkScrollDepth);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // 4. Click & Form Interaction Interceptor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check outbound links
      const link = target.closest('a') as HTMLAnchorElement | null;
      if (link && link.href) {
        try {
          const url = new URL(link.href);
          if (url.origin !== window.location.origin && url.protocol.startsWith('http')) {
            trackEvent('outbound_click', {
              destination: url.href,
              host: url.hostname,
              text: (link.textContent || '').trim().substring(0, 80),
            });
            return;
          }
        } catch {}

        // Check if link looks like CTA (pricing, register, contact)
        if (
          link.href.includes('/pricing') ||
          link.href.includes('/register') ||
          link.href.includes('/contact') ||
          link.classList.contains('btn-primary') ||
          link.getAttribute('data-cta')
        ) {
          trackEvent('cta_click', {
            cta_text: (link.textContent || '').trim().substring(0, 80),
            href: link.getAttribute('href') || link.href,
          });
          return;
        }
      }

      // Check CTA buttons
      const button = target.closest('button') as HTMLButtonElement | null;
      if (button) {
        const text = (button.textContent || '').trim().substring(0, 80);
        const isPrimary =
          button.classList.contains('btn-primary') ||
          button.getAttribute('data-cta') ||
          button.type === 'submit';

        if (isPrimary && text) {
          trackEvent('cta_click', {
            cta_text: text,
            button_id: button.id || undefined,
          });
        }
      }
    };

    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;

      // Track submission without capturing form input contents (privacy preservation)
      trackEvent('form_submit', {
        form_id: form.id || undefined,
        form_action: form.action ? new URL(form.action, window.location.origin).pathname : undefined,
      });
    };

    document.addEventListener('click', handleClick, { capture: true, passive: true });
    document.addEventListener('submit', handleSubmit, { capture: true, passive: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('submit', handleSubmit, { capture: true });
    };
  }, []);

  return null;
}

