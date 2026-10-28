// src/lib/security/rate-limit.ts
// Production-grade in-memory sliding window rate limiter
// Protects public and sensitive API endpoints against brute force, scraping, and DoS

import { NextRequest } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStale(now: number, maxWindowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    const valid = record.timestamps.filter((t) => now - t < maxWindowMs);
    if (valid.length === 0) {
      store.delete(key);
    } else {
      store.set(key, { timestamps: valid });
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Checks whether an identifier has exceeded the allowed rate limit within the time window.
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  purgeStale(now, windowMs);

  const key = identifier;
  const existing = store.get(key) || { timestamps: [] };

  // Filter timestamps within the current window
  const windowStart = now - windowMs;
  const recent = existing.timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const oldestInWindow = recent[0];
    const resetMs = Math.max(0, oldestInWindow + windowMs - now);
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  // Record this hit
  recent.push(now);
  store.set(key, { timestamps: recent });

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - recent.length),
    resetMs: windowMs,
  };
}

/**
 * Extracts the client IP from a NextRequest securely.
 */
export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // The first IP in the list is the client IP (subsequent ones are proxies)
    const clientIp = xForwardedFor.split(',')[0].trim();
    if (clientIp) return clientIp;
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Convenience helper to enforce rate limits on incoming API route requests.
 */
export function rateLimitRequest(
  request: NextRequest,
  options?: {
    limit?: number;
    windowMs?: number;
    prefix?: string;
  }
): RateLimitResult {
  const ip = getClientIp(request);
  const prefix = options?.prefix || request.nextUrl.pathname;
  const limit = options?.limit ?? 30;
  const windowMs = options?.windowMs ?? 60 * 1000;

  return checkRateLimit(`${prefix}:${ip}`, limit, windowMs);
}
