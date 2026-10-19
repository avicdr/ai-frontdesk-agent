// src/app/api/v1/appointments/route.ts
// Clinic appointments management API (listing, manual booking, updating status, rescheduling)

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { createCalendarAppointment, deleteCalendarAppointment } from '@/lib/calendar/client';
import { z } from 'zod';
import { parseISO, addMinutes } from 'date-fns';

const CreateAppointmentSchema = z.object({
  patientName: z.string().min(2),
  patientPhone: z.string().min(7),
  patientEmail: z.string().email().optional().nullable(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  notes: z.string().optional(),
});

const UpdateAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  startsAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let query = admin
      .from('appointments')
      .select(`
        id,
        patient_name,
        patient_phone,
        patient_email,
        starts_at,
        ends_at,
        status,
        notes,
        source,
        created_at,
        services ( id, name, duration_minutes, price_display )
      `)
      .eq('organization_id', membership.organization_id)
      .order('starts_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: appointments, error } = await query;
    if (error) {
      console.error('Error fetching appointments:', error);
      return Errors.internalError();
    }

    return successResponse({ appointments: appointments ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const body = await request.json();
    const parsed = CreateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { patientName, patientPhone, patientEmail, serviceId, startsAt, notes } = parsed.data;

    // Get service duration
    const { data: service } = await admin
      .from('services')
      .select('name, duration_minutes')
      .eq('id', serviceId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!service) return Errors.badRequest('Selected service not found');

    const startTime = parseISO(startsAt);
    const endTime = addMinutes(startTime, service.duration_minutes);

    // Insert appointment
    const { data: appt, error } = await admin
      .from('appointments')
      .insert({
        organization_id: membership.organization_id,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        service_id: serviceId,
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        status: 'confirmed',
        source: 'manual',
        notes,
      })
      .select()
      .single();

    if (error || !appt) {
      console.error('Failed to create manual appointment:', error);
      return Errors.internalError();
    }

    // Attempt Google Calendar Sync
    try {
      const calEvent = await createCalendarAppointment({
        organizationId: membership.organization_id,
        patientName,
        patientPhone,
        serviceName: service.name,
        startsAt: startTime.toISOString(),
        endsAt: endTime.toISOString(),
        notes,
      });

      if (calEvent?.id) {
        await admin
          .from('appointments')
          .update({ external_event_id: calEvent.id })
          .eq('id', appt.id);
      }
    } catch (calErr) {
      console.warn('Manual booking calendar sync warning:', calErr);
    }

    // Record audit event
    await admin.from('appointment_events').insert({
      appointment_id: appt.id,
      organization_id: membership.organization_id,
      event_type: 'created',
      actor_type: 'user',
      actor_id: user.id,
      new_status: 'confirmed',
    });

    return successResponse({ appointment: appt }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const body = await request.json();
    const parsed = UpdateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { appointmentId, status, startsAt, notes, reason } = parsed.data;

    const { data: existingAppt } = await admin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!existingAppt) return Errors.notFound('Appointment not found');

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (startsAt) {
      const startTime = parseISO(startsAt);
      updates.starts_at = startTime.toISOString();
      // calculate new end time
      if (existingAppt.service_id) {
        const { data: s } = await admin.from('services').select('duration_minutes').eq('id', existingAppt.service_id).single();
        if (s) {
          updates.ends_at = addMinutes(startTime, s.duration_minutes).toISOString();
        }
      }
    }

    const { data: updated, error } = await admin
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) return Errors.internalError();

    // If cancelled, remove Google Calendar event
    if (status === 'cancelled' && existingAppt.external_event_id) {
      try {
        await deleteCalendarAppointment({
          organizationId: membership.organization_id,
          calendarEventId: existingAppt.external_event_id,
        });
      } catch (e) {
        console.warn('Calendar delete event warning:', e);
      }
    }

    // Audit log
    await admin.from('appointment_events').insert({
      appointment_id: appointmentId,
      organization_id: membership.organization_id,
      event_type: status ? (status === 'cancelled' ? 'cancelled' : 'updated') : 'rescheduled',
      actor_type: 'user',
      actor_id: user.id,
      previous_status: existingAppt.status,
      new_status: status || existingAppt.status,
      reason,
    });

    return successResponse({ appointment: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
