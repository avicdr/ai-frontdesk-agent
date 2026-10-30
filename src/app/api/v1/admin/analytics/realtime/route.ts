// src/app/api/v1/admin/analytics/realtime/route.ts
// Platform Super-Admin: Real-time telemetry (active now, active in 5m, top pages, live feed)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { verifySuperAdminApi } from '@/lib/security/admin-auth';
import { getRealtimeStats } from '@/lib/analytics/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminApi();
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const data = await getRealtimeStats();
    return successResponse(data);
  } catch (err: any) {
    console.error('Error fetching realtime stats:', err);
    return Errors.internalError(err.message || 'Failed to fetch realtime stats');
  }
}

