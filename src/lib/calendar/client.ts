// src/lib/calendar/client.ts
// Google Calendar API client for clinic integration, OAuth, and appointment syncing

import { google } from 'googleapis';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import { getAppBaseUrl } from '@/lib/url';

function getDefaultRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/api/v1/integrations/calendar/callback`;
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getDefaultRedirectUri()
);

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Generate Google OAuth Authorization URL for a clinic organization
 */
export function getCalendarAuthUrl(organizationId: string, returnTo?: string): string {
  const statePayload = Buffer.from(JSON.stringify({ orgId: organizationId, returnTo: returnTo || '/dashboard/integrations' })).toString('base64url');
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: CALENDAR_SCOPES,
    state: statePayload,
  });
}

/**
 * Exchange authorization code for tokens and save to database
 */
export async function exchangeCodeAndSave(code: string, organizationId: string) {
  const { tokens } = await oauth2Client.getToken(code);
  const admin = createSupabaseAdminClient();

  if (!tokens.access_token) {
    throw new Error('Failed to retrieve access token from Google');
  }

  // Encrypt tokens before storing
  const encryptedAccessToken = encryptToken(tokens.access_token);
  const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;
  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

  // Get calendar email / primary calendar info
  oauth2Client.setCredentials(tokens);
  const calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });
  const primaryCal = await calendarApi.calendars.get({ calendarId: 'primary' }).catch(() => null);

  const { data, error } = await admin
    .from('calendar_integrations')
    .upsert({
      organization_id: organizationId,
      access_token_encrypted: encryptedAccessToken,
      refresh_token_encrypted: encryptedRefreshToken,
      token_expires_at: expiresAt,
      selected_calendar_id: primaryCal?.data.id || 'primary',
      selected_calendar_name: primaryCal?.data.summary || 'Primary Calendar',
      google_account_email: primaryCal?.data.id?.includes('@') ? primaryCal.data.id : null,
      scopes: CALENDAR_SCOPES,
      status: 'connected',
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save calendar integration: ${error.message}`);
  }

  return data;
}

/**
 * Get an authenticated Google Calendar API instance for an organization
 */
export async function getAuthenticatedCalendar(organizationId: string) {
  const admin = createSupabaseAdminClient();
  const { data: integration, error } = await admin
    .from('calendar_integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'connected')
    .maybeSingle();

  if (error || !integration) {
    return null;
  }

  const accessToken = decryptToken(integration.access_token_encrypted);
  const refreshToken = integration.refresh_token_encrypted 
    ? decryptToken(integration.refresh_token_encrypted) 
    : undefined;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : undefined,
  });

  // Handle token refresh automatically if expired
  auth.on('tokens', async (newTokens) => {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (newTokens.access_token) {
      updates.access_token_encrypted = encryptToken(newTokens.access_token);
    }
    if (newTokens.refresh_token) {
      updates.refresh_token_encrypted = encryptToken(newTokens.refresh_token);
    }
    if (newTokens.expiry_date) {
      updates.token_expires_at = new Date(newTokens.expiry_date).toISOString();
    }
    await admin.from('calendar_integrations').update(updates).eq('id', integration.id);
  });

  return {
    calendar: google.calendar({ version: 'v3', auth }),
    calendarId: integration.selected_calendar_id || 'primary',
    integrationId: integration.id,
  };
}

/**
 * Create a calendar event for a confirmed appointment
 */
export async function createCalendarAppointment(params: {
  organizationId: string;
  patientName: string;
  patientPhone: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  clinicTimezone?: string;
}) {
  const auth = await getAuthenticatedCalendar(params.organizationId);
  if (!auth) {
    // If not connected, gracefully skip without crashing appointment creation
    return null;
  }

  const { calendar, calendarId } = auth;
  const timeZone = params.clinicTimezone || 'Asia/Kolkata';

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Appointment: ${params.patientName} (${params.serviceName})`,
        description: `Patient: ${params.patientName}\nPhone: ${params.patientPhone}\nService: ${params.serviceName}\n${params.notes ? `Notes: ${params.notes}` : ''}`,
        start: {
          dateTime: params.startsAt,
          timeZone,
        },
        end: {
          dateTime: params.endsAt,
          timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      },
    });

    // Clear previous error on successful insert
    try {
      const admin = createSupabaseAdminClient();
      await admin.from('calendar_integrations').update({
        last_error: null,
        last_error_at: null,
      }).eq('organization_id', params.organizationId);
    } catch {}

    return res.data;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('Google Calendar event insert error:', errMsg);

    try {
      const admin = createSupabaseAdminClient();
      await admin.from('calendar_integrations').update({
        last_error: errMsg,
        last_error_at: new Date().toISOString(),
      }).eq('organization_id', params.organizationId);
    } catch {}

    throw err;
  }
}

/**
 * Retroactively sync confirmed appointments that have not yet been pushed to Google Calendar
 */
export async function syncUnsyncedAppointments(organizationId: string) {
  const admin = createSupabaseAdminClient();
  const { data: appointments, error } = await admin
    .from('appointments')
    .select(`
      id,
      patient_name,
      patient_phone,
      starts_at,
      ends_at,
      notes,
      timezone,
      service_id
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .is('external_event_id', null)
    .order('starts_at', { ascending: true });

  if (error || !appointments || appointments.length === 0) {
    return { syncedCount: 0, totalPending: 0, errors: [] };
  }

  // Pre-fetch service names
  const serviceIds = Array.from(new Set((appointments as any[]).map((a: any) => a.service_id).filter(Boolean)));
  const { data: services } = await admin
    .from('services')
    .select('id, name')
    .in('id', serviceIds);

  const serviceMap = new Map<string, string>();
  (services as any[] || []).forEach((s: any) => {
    if (s?.id && s?.name) {
      serviceMap.set(s.id, s.name);
    }
  });

  let syncedCount = 0;
  const errors: string[] = [];

  for (const apt of (appointments as any[])) {
    try {
      const serviceName: string = serviceMap.get(apt.service_id) || 'General Consultation';
      const event = await createCalendarAppointment({
        organizationId,
        patientName: apt.patient_name,
        patientPhone: apt.patient_phone,
        serviceName,
        startsAt: apt.starts_at,
        endsAt: apt.ends_at,
        notes: apt.notes || undefined,
        clinicTimezone: apt.timezone || 'Asia/Kolkata',
      });

      if (event?.id) {
        await admin
          .from('appointments')
          .update({
            external_event_id: event.id,
            external_calendar_id: 'primary',
            updated_at: new Date().toISOString(),
          })
          .eq('id', apt.id);
        syncedCount++;
      }
    } catch (err: any) {
      errors.push(`Appointment ${apt.id} (${apt.patient_name}): ${err?.message || err}`);
    }
  }

  return {
    syncedCount,
    totalPending: appointments.length,
    errors,
  };
}

/**
 * Reschedule an existing Google Calendar event
 */
export async function updateCalendarAppointment(params: {
  organizationId: string;
  calendarEventId: string;
  newStartsAt: string;
  newEndsAt: string;
  clinicTimezone?: string;
}) {
  const auth = await getAuthenticatedCalendar(params.organizationId);
  if (!auth) return null;

  const { calendar, calendarId } = auth;
  const timeZone = params.clinicTimezone || 'Asia/Kolkata';

  const res = await calendar.events.patch({
    calendarId,
    eventId: params.calendarEventId,
    requestBody: {
      start: {
        dateTime: params.newStartsAt,
        timeZone,
      },
      end: {
        dateTime: params.newEndsAt,
        timeZone,
      },
    },
  });

  return res.data;
}

/**
 * Delete a cancelled appointment from Google Calendar
 */
export async function deleteCalendarAppointment(params: {
  organizationId: string;
  calendarEventId: string;
}) {
  const auth = await getAuthenticatedCalendar(params.organizationId);
  if (!auth) return null;

  const { calendar, calendarId } = auth;
  await calendar.events.delete({
    calendarId,
    eventId: params.calendarEventId,
  });

  return true;
}
