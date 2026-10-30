// src/lib/analytics/tracker.ts
// Production-grade first-party client analytics tracker

import { UtmParameters, DeviceType, CollectPayload } from './types';

const VISITOR_COOKIE_NAME = 'arenova_vid';
const SESSION_COOKIE_NAME = 'arenova_sid';
const UTM_STORAGE_KEY = 'arenova_utm';
const OPT_OUT_KEY = 'arenova_disable_analytics';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

function getStorageItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {}
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

export function isAnalyticsOptedOut(): boolean {
  if (typeof window === 'undefined') return true;
  return getStorageItem(localStorage, OPT_OUT_KEY) === 'true';
}

export function setAnalyticsOptOut(optOut: boolean): void {
  if (typeof window === 'undefined') return;
  setStorageItem(localStorage, OPT_OUT_KEY, optOut ? 'true' : 'false');
}

/**
 * Gets or creates persistent anonymous visitor identifier.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let vid = getStorageItem(localStorage, VISITOR_COOKIE_NAME);
  if (!vid) {
    vid = generateId('vid');
    setStorageItem(localStorage, VISITOR_COOKIE_NAME, vid);
  }
  return vid;
}

/**
 * Gets or initializes session with 30-minute idle sliding window expiration.
 */
export function getSessionInfo(): { sessionId: string; isNewSession: boolean } {
  if (typeof window === 'undefined') return { sessionId: '', isNewSession: false };

  const now = Date.now();
  const lastActiveStr = getStorageItem(sessionStorage, 'arenova_sid_activity');
  let sid = getStorageItem(sessionStorage, SESSION_COOKIE_NAME);
  let isNew = false;

  if (sid && lastActiveStr) {
    const lastActive = parseInt(lastActiveStr, 10);
    if (now - lastActive > SESSION_EXPIRY_MS) {
      // Session expired
      sid = null;
    }
  }

  if (!sid) {
    sid = generateId('ses');
    isNew = true;
    setStorageItem(sessionStorage, SESSION_COOKIE_NAME, sid);
  }

  setStorageItem(sessionStorage, 'arenova_sid_activity', now.toString());
  return { sessionId: sid, isNewSession: isNew };
}

/**
 * Captures UTM parameters from query string and persists them for session attribution.
 */
export function captureUtmParameters(): UtmParameters {
  if (typeof window === 'undefined') return {};

  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmTerm = params.get('utm_term');
    const utmContent = params.get('utm_content');

    if (utmSource || utmMedium || utmCampaign) {
      const utmObj: UtmParameters = {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        term: utmTerm,
        content: utmContent,
      };
      setStorageItem(sessionStorage, UTM_STORAGE_KEY, JSON.stringify(utmObj));
      return utmObj;
    }

    const stored = getStorageItem(sessionStorage, UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}

  return {};
}

function getScreenDimensions(): { resolution: string; viewport: string } {
  if (typeof window === 'undefined') return { resolution: '', viewport: '' };
  const res = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const vp = `${window.innerWidth || 0}x${window.innerHeight || 0}`;
  return { resolution: res, viewport: vp };
}

/**
 * Checks whether tracking should be excluded (e.g. Admin routes, localhost unless enabled).
 */
export function shouldExcludeTracking(pathname?: string): boolean {
  if (typeof window === 'undefined') return true;
  if (isAnalyticsOptedOut()) return true;

  const path = pathname || window.location.pathname;

  // Exclude internal admin dashboard routes from inflating public site metrics
  if (path.startsWith('/admin')) {
    return true;
  }

  // Localhost check (allow overriding with NEXT_PUBLIC_ENABLE_DEV_ANALYTICS=true or localStorage flag)
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const devAnalyticsAllowed =
    process.env.NEXT_PUBLIC_ENABLE_DEV_ANALYTICS === 'true' ||
    getStorageItem(localStorage, 'arenova_enable_dev_analytics') === 'true';

  if (isLocal && !devAnalyticsAllowed) {
    return true;
  }

  return false;
}

/**
 * Dispatch tracking event to ingestion API.
 */
export function sendTrackingEvent(payload: CollectPayload): void {
  if (typeof window === 'undefined') return;

  const endpoint = '/api/v1/analytics/collect';
  const data = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const success = navigator.sendBeacon(endpoint, data);
    if (success) return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data,
    keepalive: true,
  }).catch(() => {
    // Analytics failure should never impact site UX
  });
}

/**
 * Public function to track custom application events.
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  if (shouldExcludeTracking()) return;

  const vid = getVisitorId();
  const { sessionId, isNewSession } = getSessionInfo();
  const utm = captureUtmParameters();
  const { resolution, viewport } = getScreenDimensions();

  const payload: CollectPayload = {
    visitor_id: vid,
    session_id: sessionId,
    is_new_session: isNewSession,
    event_name: eventName,
    page_path: window.location.pathname,
    page_title: document.title,
    referrer: document.referrer || undefined,
    utm,
    screen_resolution: resolution,
    viewport_dimension: viewport,
    event_properties: properties,
    timestamp: new Date().toISOString(),
  };

  sendTrackingEvent(payload);
}

// Track visited pages in current session to prevent duplicate fires on identical SPA transitions
let lastTrackedPath: string | null = null;
let lastTrackedTime: number = 0;

/**
 * Tracks a page view event.
 */
export function trackPageView(customPath?: string, customTitle?: string): void {
  if (typeof window === 'undefined') return;

  const currentPath = customPath || window.location.pathname;
  const now = Date.now();

  // Deduplicate rapid duplicate events for identical path (within 800ms)
  if (lastTrackedPath === currentPath && now - lastTrackedTime < 800) {
    return;
  }

  if (shouldExcludeTracking(currentPath)) return;

  lastTrackedPath = currentPath;
  lastTrackedTime = now;

  const vid = getVisitorId();
  const { sessionId, isNewSession } = getSessionInfo();
  const utm = captureUtmParameters();
  const { resolution, viewport } = getScreenDimensions();

  const payload: CollectPayload = {
    visitor_id: vid,
    session_id: sessionId,
    is_new_session: isNewSession,
    event_name: 'page_view',
    page_path: currentPath,
    page_title: customTitle || document.title || currentPath,
    referrer: document.referrer || undefined,
    utm,
    screen_resolution: resolution,
    viewport_dimension: viewport,
    event_properties: {
      url: window.location.href,
    },
    timestamp: new Date().toISOString(),
  };

  sendTrackingEvent(payload);
}

