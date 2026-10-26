// src/app/api/v1/clinic/location/resolve/route.ts
// Resolves Google Maps links, coordinates, or search queries into verified Address and City

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser } from '@/lib/supabase/server';
import { resolveGoogleLocation } from '@/lib/location/google-maps';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireServerUser();

    const body = await request.json().catch(() => ({}));
    const { url, query, latitude, longitude } = body;

    if (!url && !query && (latitude === undefined || longitude === undefined)) {
      return Errors.badRequest('Please provide a Google Maps URL, query, or latitude/longitude coordinates');
    }

    const resolved = await resolveGoogleLocation({
      url: typeof url === 'string' ? url.trim() : undefined,
      query: typeof query === 'string' ? query.trim() : undefined,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    });

    if (!resolved) {
      return Errors.badRequest('Unable to resolve location from the provided Google Maps input. Please try searching or entering coordinates.');
    }

    return successResponse(resolved);
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Location resolution error:', err);
    return Errors.internalError();
  }
}
