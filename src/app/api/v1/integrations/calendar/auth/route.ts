// src/app/api/v1/integrations/calendar/auth/route.ts
// Initiates Google OAuth consent flow for clinic owner

import { NextRequest, NextResponse } from 'next/server';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { getCalendarAuthUrl } from '@/lib/calendar/client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // Get user's organization
    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    const authUrl = getCalendarAuthUrl(membership.organization_id);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('Google Calendar Auth Init Error:', err);
    return NextResponse.redirect(new URL('/dashboard/integrations?error=auth_failed', request.url));
  }
}
