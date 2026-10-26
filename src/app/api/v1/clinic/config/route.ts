// src/app/api/v1/clinic/config/route.ts
// Clinic Configuration API: Clinic Details, AI Agent Persona, Services, Working Hours & Booking Policies

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { CLINIC_TYPES } from '@/lib/constants/clinic-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();
    const isSuperAdminByEmail = isSuperAdminEmail(user.email);

    // Get user's organization
    let { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    let orgId = membership?.organization_id;

    // If super admin has no org or wants to inspect a specific org via query param
    const requestedOrgId = request.nextUrl.searchParams.get('organizationId');
    if (requestedOrgId && isSuperAdminByEmail) {
      orgId = requestedOrgId;
    }

    if (!orgId) {
      // Find or fallback to the first active organization if super admin
      if (isSuperAdminByEmail) {
        const { data: firstOrg } = await admin
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        orgId = firstOrg?.id;
      }
    }

    if (!orgId) {
      return Errors.notFound('No active clinic organization found for user');
    }

    // Query all clinic config sections in parallel
    const [profileRes, agentRes, servicesRes, hoursRes, policyRes, orgRes] = await Promise.all([
      admin.from('clinic_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
      admin.from('agent_configurations').select('*').eq('organization_id', orgId).order('version', { ascending: false }).limit(1).maybeSingle(),
      admin.from('services').select('*').eq('organization_id', orgId).eq('is_active', true).order('sort_order', { ascending: true }),
      admin.from('working_hours').select('*').eq('organization_id', orgId).order('day_of_week', { ascending: true }),
      admin.from('booking_policies').select('*').eq('organization_id', orgId).maybeSingle(),
      admin.from('organizations').select('name, timezone').eq('id', orgId).maybeSingle(),
    ]);

    const profile = profileRes.data;
    const agent = agentRes.data;
    const services = servicesRes.data || [];
    const workingHours = hoursRes.data || [];
    const policy = policyRes.data;
    const org = orgRes.data;

    const responseData = {
      clinic: {
        name: profile?.clinic_name || org?.name || '',
        phone: profile?.phone || '',
        address: profile?.address_line1 || '',
        city: profile?.city || '',
        timezone: profile?.timezone || org?.timezone || 'Asia/Kolkata',
        businessType: profile?.business_type || 'dental_clinic',
        googleMapsUrl: profile?.google_maps_url || '',
        latitude: profile?.latitude ? Number(profile.latitude) : null,
        longitude: profile?.longitude ? Number(profile.longitude) : null,
        googleReviewLink: profile?.google_review_link || '',
        autoReviewRequest: profile?.auto_review_request ?? true,
        reviewRequestDelayMinutes: profile?.review_request_delay_minutes ?? 60,
        reviewRequestTemplate: profile?.review_request_template || '',
      },
      agent: {
        assistantName: agent?.assistant_name || 'Roma',
        tone: agent?.tone || 'friendly',
        greeting: agent?.greeting_message || '',
      },
      services: services.map((s: any) => ({
        id: s.id,
        name: s.name,
        duration: s.duration_minutes,
        price: s.price_display || (s.price_min ? `₹${s.price_min}` : ''),
        isBookable: s.is_bookable,
      })),
      workingHours: workingHours.map((h: any) => ({
        dayOfWeek: h.day_of_week,
        isOpen: Boolean(h.is_open),
        openTime: h.open_time ? h.open_time.slice(0, 5) : '09:00',
        closeTime: h.close_time ? h.close_time.slice(0, 5) : '18:00',
      })),
      bookingPolicy: {
        minAdvanceHours: policy?.min_advance_hours ?? 2,
        maxAdvanceDays: policy?.max_advance_days ?? 30,
        cancellationHours: policy?.cancellation_hours ?? 12,
        bufferMinutes: policy?.buffer_minutes ?? 10,
      },
    };

    return successResponse(responseData);
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error fetching clinic config:', err);
    return Errors.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();
    const isSuperAdminByEmail = isSuperAdminEmail(user.email);

    // Get user's organization
    let { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    let orgId = membership?.organization_id;

    const requestedOrgId = request.nextUrl.searchParams.get('organizationId');
    if (requestedOrgId && isSuperAdminByEmail) {
      orgId = requestedOrgId;
    }

    if (!orgId) {
      if (isSuperAdminByEmail) {
        const { data: firstOrg } = await admin
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        orgId = firstOrg?.id;
      }
    }

    if (!orgId) {
      return Errors.notFound('No active clinic organization found for user');
    }

    const body = await request.json();
    const { clinic, agent, services, workingHours, bookingPolicy } = body;

    // 1. Update Clinic Profile
    if (clinic) {
      const profileUpdates: Record<string, unknown> = {
        organization_id: orgId,
        clinic_name: clinic.name || 'AI Front Desk Clinic',
        phone: clinic.phone || null,
        address_line1: clinic.address || null,
        city: clinic.city || null,
        timezone: clinic.timezone || 'Asia/Kolkata',
        updated_at: new Date().toISOString(),
      };

      if (clinic.businessType && CLINIC_TYPES.some(t => t.id === clinic.businessType)) {
        profileUpdates.business_type = clinic.businessType;
      }

      if (clinic.googleMapsUrl !== undefined) {
        profileUpdates.google_maps_url = clinic.googleMapsUrl || null;
      }
      if (clinic.latitude !== undefined) {
        profileUpdates.latitude = clinic.latitude || null;
      }
      if (clinic.longitude !== undefined) {
        profileUpdates.longitude = clinic.longitude || null;
      }
      if (clinic.googleReviewLink !== undefined) {
        profileUpdates.google_review_link = clinic.googleReviewLink || null;
      }
      if (clinic.autoReviewRequest !== undefined) {
        profileUpdates.auto_review_request = Boolean(clinic.autoReviewRequest);
      }
      if (clinic.reviewRequestDelayMinutes !== undefined) {
        profileUpdates.review_request_delay_minutes = Number(clinic.reviewRequestDelayMinutes);
      }
      if (clinic.reviewRequestTemplate !== undefined) {
        profileUpdates.review_request_template = clinic.reviewRequestTemplate || null;
      }

      await admin
        .from('clinic_profiles')
        .upsert(profileUpdates, { onConflict: 'organization_id' });

      // Keep organization table in sync
      if (clinic.name) {
        await admin
          .from('organizations')
          .update({
            name: clinic.name,
            timezone: clinic.timezone || 'Asia/Kolkata',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);
      }
    }

    // 2. Update Agent Configuration
    if (agent) {
      // Postgres tone check constraint allows: 'professional', 'friendly', 'formal'
      let safeTone = 'friendly';
      if (agent.tone === 'professional' || agent.tone === 'formal') {
        safeTone = agent.tone;
      } else if (agent.tone === 'concise') {
        safeTone = 'professional';
      }

      const { data: existingAgent } = await admin
        .from('agent_configurations')
        .select('id, version')
        .eq('organization_id', orgId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingAgent) {
        await admin
          .from('agent_configurations')
          .update({
            assistant_name: agent.assistantName || 'Roma',
            tone: safeTone,
            greeting_message: agent.greeting || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAgent.id);
      } else {
        await admin.from('agent_configurations').insert({
          organization_id: orgId,
          version: 1,
          status: 'draft',
          assistant_name: agent.assistantName || 'Roma',
          tone: safeTone,
          greeting_message: agent.greeting || null,
          created_by: user.id,
        });
      }
    }

    // 3. Update Services
    if (Array.isArray(services)) {
      // Mark old services as inactive
      await admin
        .from('services')
        .update({ is_active: false })
        .eq('organization_id', orgId);

      // Upsert/insert new list
      for (let i = 0; i < services.length; i++) {
        const s = services[i];
        if (!s.name) continue;

        let priceNum: number | null = null;
        if (s.price) {
          const parsed = parseFloat(String(s.price).replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed)) priceNum = parsed;
        }

        await admin.from('services').insert({
          organization_id: orgId,
          name: s.name,
          duration_minutes: parseInt(String(s.duration || 30), 10) || 30,
          price_min: priceNum,
          price_max: priceNum,
          price_display: s.price ? String(s.price) : null,
          is_bookable: s.isBookable !== false,
          sort_order: i,
          is_active: true,
        });
      }
    }

    // 4. Update Working Hours
    if (Array.isArray(workingHours)) {
      for (const h of workingHours) {
        if (typeof h.dayOfWeek !== 'number') continue;
        await admin
          .from('working_hours')
          .upsert(
            {
              organization_id: orgId,
              day_of_week: h.dayOfWeek,
              is_open: Boolean(h.isOpen),
              open_time: h.isOpen ? (h.openTime ? `${h.openTime}:00`.slice(0, 8) : '09:00:00') : null,
              close_time: h.isOpen ? (h.closeTime ? `${h.closeTime}:00`.slice(0, 8) : '18:00:00') : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id,day_of_week' }
          );
      }
    }

    // 5. Update Booking Policy
    if (bookingPolicy) {
      await admin.from('booking_policies').upsert(
        {
          organization_id: orgId,
          min_advance_hours: parseInt(String(bookingPolicy.minAdvanceHours || 2), 10) || 2,
          max_advance_days: parseInt(String(bookingPolicy.maxAdvanceDays || 30), 10) || 30,
          cancellation_hours: parseInt(String(bookingPolicy.cancellationHours || 12), 10) || 12,
          buffer_minutes: parseInt(String(bookingPolicy.bufferMinutes || 10), 10) || 10,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      );
    }

    return successResponse({ updated: true, organizationId: orgId });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error saving clinic config:', err);
    return Errors.internalError();
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
