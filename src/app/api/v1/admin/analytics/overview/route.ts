// src/app/api/v1/admin/analytics/overview/route.ts
// Platform Super-Admin: Overview KPIs with previous-period comparison

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { verifySuperAdminApi } from '@/lib/security/admin-auth';
import { getOverviewMetrics } from '@/lib/analytics/service';
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

    const data = await getOverviewMetrics(range, from, to);
    return successResponse(data);
  } catch (err: any) {
    console.error('Error fetching analytics overview:', err);
    return Errors.internalError(err.message || 'Failed to fetch overview metrics');
  }
}

