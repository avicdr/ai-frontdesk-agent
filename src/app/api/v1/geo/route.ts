// src/app/api/v1/geo/route.ts
// Detect client geolocation & country to serve correct domestic (INR) or international (USD/Crypto) plans

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Check common serverless / edge headers for country code
  const countryHeader =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    request.headers.get('cloudfront-viewer-country') ||
    request.headers.get('x-client-geo-country');

  const country = countryHeader ? countryHeader.trim().toUpperCase() : null;

  // In local development or when header is missing:
  // If no header, we can default based on query param or return null so client timezone detection can take effect
  const isInternational = country ? country !== 'IN' : false;

  return NextResponse.json({
    success: true,
    data: {
      country: country || 'UNKNOWN',
      isInternational,
      currency: isInternational ? 'USD' : 'INR',
    },
  });
}
