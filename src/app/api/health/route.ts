// src/app/api/health/route.ts
// Ultra-lightweight health check and keep-alive ping endpoint
// Used by external cron / monitors (UptimeRobot, GitHub Actions) to prevent Render free tier spin-down

import { NextResponse } from 'next/server';
import { autoResumeAllActiveBaileysSessions } from '@/lib/whatsapp/baileys-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptimeSeconds = Math.floor(process.uptime());

  // Proactively ensure WhatsApp background sessions stay active
  try {
    autoResumeAllActiveBaileysSessions().catch(() => {});
  } catch {}

  return NextResponse.json({
    status: 'healthy',
    service: 'ai-front-desk',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function HEAD() {
  // Ultra-fast response with zero body for bandwidth-efficient pingers
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
