// src/app/api/v1/integrations/calendar/callback/route.ts
// Handles Google OAuth callback and stores credentials securely

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeAndSave } from '@/lib/calendar/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const organizationId = searchParams.get('state');
  const error = searchParams.get('error');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code || !organizationId) {
    console.error('Calendar OAuth Callback error:', error);
    return NextResponse.redirect(`${appBaseUrl}/dashboard/integrations?error=calendar_auth_denied`);
  }

  try {
    await exchangeCodeAndSave(code, organizationId);
    return NextResponse.redirect(`${appBaseUrl}/dashboard/integrations?calendar=connected`);
  } catch (err) {
    console.error('Calendar Token Exchange Error:', err);
    return NextResponse.redirect(`${appBaseUrl}/dashboard/integrations?error=token_exchange_failed`);
  }
}
