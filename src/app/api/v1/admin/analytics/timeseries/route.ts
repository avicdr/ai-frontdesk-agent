// src/app/api/v1/admin/analytics/timeseries/route.ts
// Platform Super-Admin: Interactive Time Series data with zero-fill

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { verifySuperAdminApi } from '@/lib/security/admin-auth';
import { getTimeSeries } from '@/lib/analytics/service';
import { DateRangeKey } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifySuperAdminApi();
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as DateRangeKey) || 'last7d';
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const points = await getTimeSeries(range, from, to);
    return successResponse({ points });
  } catch (err: any) {
    console.error('Error fetching analytics timeseries:', err);
    return Errors.internalError(err.message || 'Failed to fetch timeseries');
  }
}

