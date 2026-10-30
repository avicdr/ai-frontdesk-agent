// src/app/api/v1/admin/analytics/pages/route.ts
// Platform Super-Admin: Top pages breakdown

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { verifySuperAdminApi } from '@/lib/security/admin-auth';
import { getTopPages } from '@/lib/analytics/service';
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
    const sort = (searchParams.get('sort') as 'views' | 'visitors') || 'views';

    const pages = await getTopPages(range, from, to, sort);
    return successResponse({ pages });
  } catch (err: any) {
    console.error('Error fetching top pages:', err);
    return Errors.internalError(err.message || 'Failed to fetch top pages');
  }
}

