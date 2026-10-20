// src/app/api/v1/integrations/calendar/route.ts
// Calendar integration status and management endpoint

import { NextRequest } from 'next/server';
import { getServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { successResponse, Errors } from '@/lib/api/response';

export async function GET() {
  try {
    const user = await getServerUser();
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

      orgId = existingOrg?.id || '';
    }

    if (!orgId) {
      return successResponse({
        status: 'disconnected',
        isLiveConfigured: false,
        email: null,
        calendarName: null,
      });
    }

    const { data: integration } = await admin
      .from('calendar_integrations')
      .select('status, google_account_email, selected_calendar_name, selected_calendar_id, updated_at')
      .eq('organization_id', orgId)
      .maybeSingle();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const isLiveConfigured = Boolean(clientId && !clientId.includes('your-google-client-id') && clientId.trim() !== '');

    return successResponse({
      status: integration?.status === 'connected' ? 'connected' : 'disconnected',
      isLiveConfigured,
      email: integration?.google_account_email || null,
      calendarName: integration?.selected_calendar_name || null,
      calendarId: integration?.selected_calendar_id || null,
      updatedAt: integration?.updated_at || null,
    });
  } catch (err) {
    console.error('Error fetching calendar status:', err);
    return Errors.internalError('Failed to fetch calendar status');
  }
}

export async function DELETE() {
  try {
    const user = await getServerUser();
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

      orgId = existingOrg?.id || '';
    }

    if (!orgId) {
      return Errors.badRequest('Organization not found');
    }

    await admin
      .from('calendar_integrations')
      .update({
        status: 'disconnected',
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', orgId);

    return successResponse({ message: 'Calendar disconnected successfully' });
  } catch (err) {
    console.error('Error disconnecting calendar:', err);
    return Errors.internalError('Failed to disconnect calendar');
  }
}
