// src/app/api/v1/integrations/calendar/callback/route.ts
// Handles Google OAuth callback and stores credentials securely

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeAndSave } from '@/lib/calendar/client';
import { getSafeRedirectUrl } from '@/lib/url';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const rawState = searchParams.get('state') || '';
  let organizationId = rawState;
  let returnTo = '/dashboard/integrations';

  try {
    const decoded = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
    if (decoded?.orgId) {
      organizationId = decoded.orgId;
      returnTo = decoded.returnTo || returnTo;
    }
  } catch {
    // rawState was a plain organization ID
  }

  if (error || !code || !organizationId) {
    console.error('Calendar OAuth Callback error:', error);
    const redirectUrl = getSafeRedirectUrl(returnTo, request);
    redirectUrl.searchParams.delete('calendar_connected');
    redirectUrl.searchParams.set('error', 'calendar_auth_denied');
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    await exchangeCodeAndSave(code, organizationId);
    const redirectUrl = getSafeRedirectUrl(returnTo, request);
    redirectUrl.searchParams.delete('error');
    redirectUrl.searchParams.set('calendar_connected', 'true');
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Calendar Token Exchange Error:', err);
    const redirectUrl = getSafeRedirectUrl(returnTo, request);
    redirectUrl.searchParams.delete('calendar_connected');
    redirectUrl.searchParams.set('error', 'token_exchange_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
