// src/lib/url.ts
// Robust utility for resolving the application's public base URL across environments
// (Local development, Render, Vercel, Docker, behind reverse proxies)

import { NextRequest } from 'next/server';

/**
 * Resolves the public base URL of the application.
 *
 * Priority:
 * 1. Inspect incoming request's `x-forwarded-host` and `x-forwarded-proto` headers.
 *    If host is non-localhost or running in development, this is always used.
 * 2. RENDER_EXTERNAL_URL (if provided and not pointing to a blocked onrender.com domain)
 * 3. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL
 * 4. NEXT_PUBLIC_APP_URL (if configured and not pointing to localhost in non-development environments)
 * 5. Production deployment fallback: https://frontdesk.arenova.in
 * 6. Local development fallback: http://localhost:3000
 */
export function getAppBaseUrl(request?: NextRequest | Request | null): string {
  // 1. Try to extract from request headers (highest fidelity to user's browser)
  if (request) {
    try {
      const headers = request.headers;
      const forwardedHost = headers.get('x-forwarded-host');
      const host = forwardedHost || headers.get('host');

      if (host) {
        const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1');
        // If it's a real public host or if we are in local development
        if (!isLocal || process.env.NODE_ENV === 'development') {
          const proto = headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
          return `${proto}://${host}`.replace(/\/$/, '');
        }
      }

      // Next.js NextRequest nextUrl origin
      if ('nextUrl' in request && request.nextUrl?.origin) {
        const origin = request.nextUrl.origin;
        if (!origin.includes('localhost') || process.env.NODE_ENV === 'development') {
          return origin.replace(/\/$/, '');
        }
      }
    } catch {
      // Ignore header parsing errors and proceed to env checks
    }
  }

  // 2. Render automated environment variable (skip if onrender.com subdomain which is blocked by custom domain)
  if (process.env.RENDER_EXTERNAL_URL && !process.env.RENDER_EXTERNAL_URL.includes('onrender.com')) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
  }

  // 3. Vercel automated environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // 4. Configured NEXT_PUBLIC_APP_URL
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl) {
    const isLocalhost = configuredAppUrl.includes('localhost') || configuredAppUrl.includes('127.0.0.1');
    if (!isLocalhost || process.env.NODE_ENV === 'development') {
      return configuredAppUrl.replace(/\/$/, '');
    }
  }

  // 5. Hardcoded production fallback for this deployment
  if (process.env.NODE_ENV === 'production') {
    return 'https://frontdesk.arenova.in';
  }

  return 'http://localhost:3000';
}

/**
 * Ensures that a target redirect path is safely resolved to an absolute URL
 * on the correct application domain, strictly preventing open redirect vulnerabilities,
 * protocol-relative bypasses, or external domain redirects.
 */
export function getSafeRedirectUrl(targetPath: string, request?: NextRequest | Request | null): URL {
  const baseUrl = getAppBaseUrl(request);
  const baseOrigin = new URL(baseUrl).origin;
  const defaultPath = '/dashboard';

  if (!targetPath || typeof targetPath !== 'string') {
    return new URL(defaultPath, baseUrl);
  }

  let raw = targetPath.trim();

  // Decode URI component if encoded to catch %2f%2f tricks
  try {
    if (raw.includes('%')) {
      const decoded = decodeURIComponent(raw);
      if (!/[\x00-\x1F\x7F]/.test(decoded)) {
        raw = decoded;
      }
    }
  } catch {
    return new URL(defaultPath, baseUrl);
  }

  // Reject dangerous schemes or protocol-relative patterns
  // Examples: //attacker.com, /\attacker.com, \\attacker.com, javascript:, data:, vbscript:
  if (
    /^\s*(\/\/|\\\\|\/\\|\\\/)/.test(raw) ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)
  ) {
    try {
      const parsed = new URL(raw, baseUrl);
      if (parsed.origin === baseOrigin) {
        // Safe same-origin URL: extract just pathname, search, and hash
        raw = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } else {
        // Disallowed external domain or dangerous protocol: reset to default
        return new URL(defaultPath, baseUrl);
      }
    } catch {
      return new URL(defaultPath, baseUrl);
    }
  }

  // Ensure it starts with single leading slash and not double slashes or backslashes
  if (!raw.startsWith('/')) {
    raw = `/${raw}`;
  }

  // Clean duplicate leading slashes or leading backslashes (e.g. ///foo -> /foo)
  raw = raw.replace(/^[\/\\]+/, '/');

  // Verify that creating the URL on baseUrl stays on the exact same origin
  try {
    const finalUrl = new URL(raw, baseUrl);
    if (finalUrl.origin !== baseOrigin) {
      return new URL(defaultPath, baseUrl);
    }
    return finalUrl;
  } catch {
    return new URL(defaultPath, baseUrl);
  }
}
