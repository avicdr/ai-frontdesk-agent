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
 * 2. RENDER_EXTERNAL_URL (automatically provided by Render, e.g. https://ai-frontdesk-agent.onrender.com)
 * 3. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL
 * 4. NEXT_PUBLIC_APP_URL (if configured and not pointing to localhost in non-development environments)
 * 5. Production deployment fallback: https://ai-frontdesk-agent.onrender.com
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

  // 2. Render automated environment variable
  if (process.env.RENDER_EXTERNAL_URL) {
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
    return 'https://ai-frontdesk-agent.onrender.com';
  }

  return 'http://localhost:3000';
}

/**
 * Ensures that a target redirect path is safely resolved to an absolute URL
 * on the correct application domain, preventing open redirect vulnerabilities
 * or localhost leaks in production.
 */
export function getSafeRedirectUrl(targetPath: string, request?: NextRequest | Request | null): URL {
  const baseUrl = getAppBaseUrl(request);
  let safePath = targetPath || '/dashboard/integrations';

  // If an absolute URL was passed, strip off any mismatched domain / localhost
  if (safePath.startsWith('http://') || safePath.startsWith('https://')) {
    try {
      const parsed = new URL(safePath);
      safePath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      safePath = '/dashboard/integrations';
    }
  }

  if (!safePath.startsWith('/')) {
    safePath = `/${safePath}`;
  }

  return new URL(safePath, baseUrl);
}
