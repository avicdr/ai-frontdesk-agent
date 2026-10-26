// src/app/api/v1/clinic/location/search/route.ts
// Live location & address autocomplete search for Google Maps picker

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser } from '@/lib/supabase/server';
import { searchPlaces } from '@/lib/location/google-maps';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireServerUser();

    const q = request.nextUrl.searchParams.get('q') || '';
    if (!q || q.trim().length < 2) {
      return successResponse([]);
    }

    const results = await searchPlaces(q.trim());
    return successResponse(results);
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Location search error:', err);
    return Errors.internalError();
  }
}
