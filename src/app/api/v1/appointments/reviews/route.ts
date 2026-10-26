// src/app/api/v1/appointments/reviews/route.ts
// API route for dispatching and checking automated Google Review requests

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  dispatchReviewRequestForAppointment,
  processPendingAppointmentReviews,
} from '@/lib/reviews/review-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const body = await request.json().catch(() => ({}));
    const { appointmentId, action, force } = body;

    // Batch trigger action
    if (action === 'dispatch_pending') {
      const result = await processPendingAppointmentReviews();
      return successResponse(result);
    }

    if (!appointmentId) {
      return Errors.badRequest('Missing appointmentId');
    }

    // Verify tenant authorization: user must belong to appointment's organization
    const { data: appt } = await admin
      .from('appointments')
      .select('organization_id')
      .eq('id', appointmentId)
      .maybeSingle();

    if (!appt) {
      return Errors.notFound('Appointment not found');
    }

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', appt.organization_id)
      .maybeSingle();

    if (!membership) {
      return Errors.forbidden('You do not have access to this appointment');
    }

    const result = await dispatchReviewRequestForAppointment(appointmentId, {
      force: Boolean(force),
    });

    if (!result.success) {
      return Errors.badRequest(result.error || 'Failed to dispatch review request');
    }

    return successResponse(result);
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error dispatching review request:', err);
    return Errors.internalError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return Errors.notFound('No active clinic organization found');
    }

    // Return review stats for this clinic
    const [sentRes, pendingRes, profileRes] = await Promise.all([
      admin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', membership.organization_id)
        .eq('review_status', 'sent'),
      admin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', membership.organization_id)
        .in('status', ['confirmed', 'completed'])
        .is('review_requested_at', null),
      admin
        .from('clinic_profiles')
        .select('google_review_link, auto_review_request, review_request_delay_minutes')
        .eq('organization_id', membership.organization_id)
        .maybeSingle(),
    ]);

    return successResponse({
      reviewsSentCount: sentRes.count || 0,
      reviewsPendingCount: pendingRes.count || 0,
      config: profileRes.data || null,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error fetching review stats:', err);
    return Errors.internalError();
  }
}
