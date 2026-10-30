// src/app/api/v1/analytics/collect/route.ts
// Ingestion endpoint for website visitor traffic events

import { NextRequest, NextResponse } from 'next/server';
import { recordAnalyticsEvent } from '@/lib/analytics/service';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { CollectPayload } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check by IP / identifier
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      'anonymous-client';

    const rateResult = checkRateLimit(`analytics:collect:${clientIp}`, 120, 60 * 1000);
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Parse body (supports text/plain beacon or application/json)
    let body: any;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
      }
    }

    // 3. Process events (batch or single)
    const events: CollectPayload[] = Array.isArray(body) ? body : [body];
    if (events.length === 0 || events.length > 25) {
      return NextResponse.json({ success: false, error: 'Invalid batch size' }, { status: 400 });
    }

    for (const evt of events) {
      await recordAnalyticsEvent(evt, request.headers);
    }

    return NextResponse.json(
      { success: true, processed: events.length },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Analytics ingestion error:', err);
    // Never fail catastrophic client side
    return NextResponse.json({ success: true, warning: 'Processed with fallback' }, { status: 200 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

