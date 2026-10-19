// src/app/api/v1/integrations/calendar/auth/route.ts
// Initiates Google OAuth consent flow for clinic owner

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getCalendarAuthUrl } from '@/lib/calendar/client';

export async function GET(request: NextRequest) {
  const referer = request.headers.get('referer') || '';
  const returnTo = referer.includes('/onboarding')
    ? '/onboarding?calendar_connected=true'
    : '/dashboard/integrations?calendar_connected=true';

  try {
    let user = await getServerUser();
    const admin = createSupabaseAdminClient();

    let orgId = '';
    if (user) {
      const { data: membership } = await admin
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership?.organization_id) {
        orgId = membership.organization_id;
      }
    }

    if (!orgId) {
      const { data: existingOrg } = await admin
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      orgId = existingOrg?.id || 'demo-org-1';
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const isMockClient = !clientId || clientId.includes('your-google-client-id') || clientId.trim() === '';

    // If Google OAuth credentials are not configured or in sandbox testing, connect in simulation mode
    if (isMockClient) {
      await admin.from('calendar_integrations').upsert({
        organization_id: orgId,
        provider: 'google',
        calendar_id: 'primary',
        status: 'connected',
        token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id' });

      return NextResponse.redirect(new URL(returnTo, request.url));
    }

    const authUrl = getCalendarAuthUrl(orgId);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('Google Calendar Auth Init Error:', err);
    return NextResponse.redirect(new URL(returnTo, request.url));
  }
}
