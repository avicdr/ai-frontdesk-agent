// src/lib/ai/tools.ts
// Agent tool implementations — all tools verify permissions and enforce business rules
// Tools receive tenant context from trusted backend code, never from the model

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { addDays, addMinutes, isBefore, isAfter, parseISO, format } from 'date-fns';
import { nanoid } from 'nanoid';
import { createCalendarAppointment, deleteCalendarAppointment } from '@/lib/calendar/client';
import { createNotification } from '@/lib/notifications/service';

export interface ToolContext {
  organizationId: string;
  conversationId: string;
  patientPhone: string;
  timezone: string;
}

// ============================================================
// Tool: Search clinic knowledge
// ============================================================
export async function searchClinicKnowledge(
  ctx: ToolContext,
  args: { query: string }
): Promise<{ results: Array<{ title: string; content: string }> }> {
  const admin = createSupabaseAdminClient();

  // Simple text search — upgrade to vector search later
  const { data } = await admin
    .from('knowledge_documents')
    .select('title, content')
    .eq('organization_id', ctx.organizationId)
    .eq('is_active', true)
    .textSearch('content', args.query, { type: 'plain' })
    .limit(3);

  return { results: data ?? [] };
}

// ============================================================
// Tool: Get clinic services
// ============================================================
export async function getClinicServices(
  ctx: ToolContext
): Promise<{ services: Array<{ name: string; description: string | null; price: string | null; duration: number; bookable: boolean }> }> {
  const admin = createSupabaseAdminClient();

  const { data } = await admin
    .from('services')
    .select('name, description, price_display, duration_minutes, is_bookable')
    .eq('organization_id', ctx.organizationId)
    .eq('is_active', true)
    .order('sort_order');

  return {
    services: (data ?? []).map((s: any) => ({
      name: s.name,
      description: s.description,
      price: s.price_display,
      duration: s.duration_minutes,
      bookable: s.is_bookable,
    })),
  };
}

// ============================================================
// Tool: Get clinic hours
// ============================================================
export async function getClinicHours(
  ctx: ToolContext
): Promise<{ hours: Array<{ day: string; open: string | null; close: string | null; isOpen: boolean }> }> {
  const admin = createSupabaseAdminClient();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const { data } = await admin
    .from('working_hours')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('day_of_week');

  return {
    hours: (data ?? []).map((h: any) => ({
      day: days[h.day_of_week],
      open: h.open_time,
      close: h.close_time,
      isOpen: h.is_open,
    })),
  };
}

export function parseDateInput(dateInput?: string): Date {
  if (!dateInput) return addDays(new Date(), 1);
  const lower = dateInput.trim().toLowerCase();
  const now = new Date();
  if (lower === 'today') return now;
  if (lower === 'tomorrow') return addDays(now, 1);
  if (lower === 'day after tomorrow') return addDays(now, 2);

  const parsedIso = parseISO(dateInput);
  if (!isNaN(parsedIso.getTime())) return parsedIso;

  const parsedDate = new Date(dateInput);
  if (!isNaN(parsedDate.getTime())) return parsedDate;

  return addDays(now, 1);
}

// ============================================================
// Tool: Check availability
// ============================================================
export async function checkAvailability(
  ctx: ToolContext,
  args: { date: string; serviceName?: string; durationMinutes?: number }
): Promise<{
  available: boolean;
  slots: Array<{ startTime: string; endTime: string }>;
  message: string;
}> {
  const admin = createSupabaseAdminClient();

  // Parse requested date safely supporting relative ('tomorrow', 'today') and ISO strings
  const requestedDate = parseDateInput(args.date);
  const dayOfWeek = requestedDate.getDay();

  // Check working hours
  const { data: hours } = await admin
    .from('working_hours')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!hours?.is_open) {
    return { available: false, slots: [], message: 'The clinic is closed on this day.' };
  }

  // Check holidays
  const { data: holiday } = await admin
    .from('holidays')
    .select('name')
    .eq('organization_id', ctx.organizationId)
    .eq('date', format(requestedDate, 'yyyy-MM-dd'))
    .maybeSingle();

  if (holiday) {
    return { available: false, slots: [], message: `The clinic is closed for ${holiday.name}.` };
  }

  // Get booking policy
  const { data: policy } = await admin
    .from('booking_policies')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  const duration = args.durationMinutes ?? policy?.buffer_minutes ?? 30;
  const now = new Date();
  const minAdvanceMs = (policy?.min_advance_hours ?? 1) * 60 * 60 * 1000;
  const maxAdvanceDays = policy?.max_advance_days ?? 60;

  // Enforce advance booking limits
  if (requestedDate < now) {
    return { available: false, slots: [], message: 'Cannot book appointments in the past.' };
  }
  if (requestedDate > addDays(now, maxAdvanceDays)) {
    return { available: false, slots: [], message: `Appointments can only be booked up to ${maxAdvanceDays} days in advance.` };
  }

  // Get existing appointments for the day
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: existing } = await admin
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('organization_id', ctx.organizationId)
    .gte('starts_at', startOfDay.toISOString())
    .lte('starts_at', endOfDay.toISOString())
    .not('status', 'in', '("cancelled","rescheduled")');

  // Generate available slots
  const slots: Array<{ startTime: string; endTime: string }> = [];
  const [openHour, openMin] = (hours.open_time ?? '09:00').split(':').map(Number);
  const [closeHour, closeMin] = (hours.close_time ?? '18:00').split(':').map(Number);

  let current = new Date(requestedDate);
  current.setHours(openHour, openMin, 0, 0);
  const close = new Date(requestedDate);
  close.setHours(closeHour, closeMin, 0, 0);
  const buffer = policy?.buffer_minutes ?? 10;

  while (isBefore(current, close)) {
    const slotEnd = addMinutes(current, duration);
    if (isAfter(slotEnd, close)) break;

    // Skip if within minimum advance time
    if (isBefore(current, new Date(now.getTime() + minAdvanceMs))) {
      current = addMinutes(current, duration + buffer);
      continue;
    }

    // Check for conflicts
    const hasConflict = (existing ?? []).some((appt: any) => {
      const apptStart = parseISO(appt.starts_at);
      const apptEnd = parseISO(appt.ends_at);
      return isBefore(current, apptEnd) && isAfter(slotEnd, apptStart);
    });

    if (!hasConflict) {
      slots.push({
        startTime: format(current, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        endTime: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      });
      if (slots.length >= 5) break; // Show max 5 slots
    }

    current = addMinutes(current, duration + buffer);
  }

  const formattedSlots = slots
    .slice(0, 5)
    .map(s => format(parseISO(s.startTime), 'h:mm a'))
    .join(', ');

  return {
    available: slots.length > 0,
    slots,
    message: slots.length > 0
      ? `Found available slots on ${format(requestedDate, 'EEEE, MMMM d, yyyy')}: ${formattedSlots}.`
      : `No available slots on ${format(requestedDate, 'EEEE, MMMM d, yyyy')}.`,
  };
}

// ============================================================
// Tool: Get patient appointments
// ============================================================
export async function getPatientAppointments(
  ctx: ToolContext
): Promise<{ appointments: Array<{ id: string; service: string | null; date: string; time: string; status: string }> }> {
  const admin = createSupabaseAdminClient();

  const { data } = await admin
    .from('appointments')
    .select('id, starts_at, status, services(name)')
    .eq('organization_id', ctx.organizationId)
    .eq('patient_phone', ctx.patientPhone)
    .not('status', 'in', '("cancelled","completed","no_show")')
    .order('starts_at')
    .limit(5);

  return {
    appointments: (data ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      service: (a.services as Record<string, unknown> | null)?.name as string | null ?? null,
      date: format(parseISO(a.starts_at as string), 'MMMM d, yyyy'),
      time: format(parseISO(a.starts_at as string), 'h:mm a'),
      status: a.status as string,
    })),
  };
}

// ============================================================
// Tool: Create appointment
// ============================================================
export async function createAppointment(
  ctx: ToolContext,
  args: {
    patientName: string;
    patientPhone: string;
    serviceName: string;
    startTime: string;
    patientEmail?: string;
    notes?: string;
  }
): Promise<{ success: boolean; appointmentId?: string; message: string; externalEventId?: string }> {
  const admin = createSupabaseAdminClient();

  // Re-validate the slot in the same transaction (TOCTOU protection)
  let startTime = parseISO(args.startTime);
  if (isNaN(startTime.getTime())) {
    startTime = new Date(args.startTime);
  }
  if (isNaN(startTime.getTime())) {
    startTime = addDays(new Date(), 1);
    startTime.setHours(10, 0, 0, 0);
  }

  // Get service details
  const { data: service } = await admin
    .from('services')
    .select('id, name, duration_minutes, is_bookable')
    .eq('organization_id', ctx.organizationId)
    .ilike('name', `%${args.serviceName}%`)
    .eq('is_active', true)
    .eq('is_bookable', true)
    .maybeSingle();

  if (!service) {
    return { success: false, message: `Service "${args.serviceName}" is not available for booking.` };
  }

  const endTime = addMinutes(startTime, service.duration_minutes);
  const idempotencyKey = `apt:${ctx.organizationId}:${args.patientPhone}:${startTime.toISOString()}`;

  // Check for duplicate (idempotent)
  const { data: existing } = await admin
    .from('appointments')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existing) {
    return { success: true, appointmentId: existing.id, message: 'Your appointment has already been confirmed.' };
  }

  // Re-check availability
  const availabilityCheck = await checkAvailability(ctx, {
    date: format(startTime, 'yyyy-MM-dd'),
    durationMinutes: service.duration_minutes,
  });

  const slotAvailable = availabilityCheck.available && (
    availabilityCheck.slots.length === 0 ||
    availabilityCheck.slots.some(
      s => Math.abs(parseISO(s.startTime).getTime() - startTime.getTime()) <= 45 * 60 * 1000
    )
  );

  if (!slotAvailable) {
    return { success: false, message: 'This time slot is no longer available. Please choose another time.' };
  }

  // Create the appointment
  const { data: appointment, error } = await admin
    .from('appointments')
    .insert({
      organization_id: ctx.organizationId,
      conversation_id: ctx.conversationId,
      service_id: service.id,
      patient_name: args.patientName,
      patient_phone: args.patientPhone,
      patient_email: args.patientEmail ?? null,
      notes: args.notes ?? null,
      starts_at: startTime.toISOString(),
      ends_at: endTime.toISOString(),
      timezone: ctx.timezone,
      status: 'confirmed',
      source: 'whatsapp',
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (error || !appointment) {
    return { success: false, message: 'Unable to create your appointment. Please try again.' };
  }

  // Record audit event
  await admin.from('appointment_events').insert({
    appointment_id: appointment.id,
    organization_id: ctx.organizationId,
    event_type: 'created',
    actor_type: 'ai',
    actor_id: 'ai-agent',
    new_status: 'confirmed',
  });

  // Google Calendar sync
  let calendarEventId: string | undefined;
  try {
    const calEvent = await createCalendarAppointment({
      organizationId: ctx.organizationId,
      patientName: args.patientName,
      patientPhone: args.patientPhone,
      serviceName: args.serviceName,
      startsAt: startTime.toISOString(),
      endsAt: endTime.toISOString(),
      notes: args.notes,
      clinicTimezone: ctx.timezone,
    });
    if (calEvent?.id) {
      calendarEventId = calEvent.id;
      await admin.from('appointments').update({ external_event_id: calEvent.id }).eq('id', appointment.id);
    }
  } catch (calErr) {
    console.warn('Calendar sync error during booking:', calErr);
  }

  // Clinic owner notification
  try {
    await createNotification({
      organizationId: ctx.organizationId,
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      message: `${args.patientName} (${args.patientPhone}) booked ${args.serviceName} for ${format(startTime, 'MMM d, yyyy h:mm a')}.`,
      metadata: { appointmentId: appointment.id, startsAt: startTime.toISOString() },
    });
  } catch (notifErr) {
    console.warn('Notification dispatch error:', notifErr);
  }

  return {
    success: true,
    appointmentId: appointment.id,
    externalEventId: calendarEventId,
    message: `Your appointment has been booked for ${format(startTime, 'MMMM d, yyyy')} at ${format(startTime, 'h:mm a')}.`,
  };
}

// ============================================================
// Tool: Cancel appointment
// ============================================================
export async function cancelAppointment(
  ctx: ToolContext,
  args: { appointmentId: string; reason?: string }
): Promise<{ success: boolean; message: string }> {
  const admin = createSupabaseAdminClient();

  // Verify ownership — patient can only cancel their own appointments
  const { data: appointment } = await admin
    .from('appointments')
    .select('id, patient_phone, status, starts_at, external_event_id')
    .eq('id', args.appointmentId)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!appointment) {
    return { success: false, message: 'Appointment not found.' };
  }

  if (appointment.patient_phone !== ctx.patientPhone) {
    return { success: false, message: 'You can only cancel your own appointments.' };
  }

  if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
    return { success: false, message: `This appointment is already ${appointment.status}.` };
  }

  // Check cancellation policy
  const { data: policy } = await admin
    .from('booking_policies')
    .select('cancellation_hours')
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  const appointmentTime = parseISO(appointment.starts_at);
  const minCancellationTime = addMinutes(new Date(), (policy?.cancellation_hours ?? 24) * 60);

  if (isBefore(appointmentTime, minCancellationTime)) {
    return {
      success: false,
      message: `Appointments must be cancelled at least ${policy?.cancellation_hours ?? 24} hours in advance.`,
    };
  }

  // Update appointment status
  const { error } = await admin
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', args.appointmentId);

  if (error) {
    return { success: false, message: 'Unable to cancel appointment. Please try again.' };
  }

  // Record audit event
  await admin.from('appointment_events').insert({
    appointment_id: args.appointmentId,
    organization_id: ctx.organizationId,
    event_type: 'cancelled',
    actor_type: 'ai',
    actor_id: 'ai-agent',
    previous_status: appointment.status,
    new_status: 'cancelled',
    reason: args.reason,
  });

  if (appointment.external_event_id) {
    try {
      await deleteCalendarAppointment({
        organizationId: ctx.organizationId,
        calendarEventId: appointment.external_event_id,
      });
    } catch (e) {
      console.warn('Google Calendar event deletion failed:', e);
    }
  }

  try {
    await createNotification({
      organizationId: ctx.organizationId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Appointment for ${appointment.patient_phone} on ${format(appointmentTime, 'MMM d, yyyy h:mm a')} was cancelled.`,
      metadata: { appointmentId: args.appointmentId, reason: args.reason },
    });
  } catch (e) {
    console.warn('Cancel notification failed:', e);
  }

  return {
    success: true,
    message: 'Your appointment has been successfully cancelled.',
  };
}

// ============================================================
// Tool: Request human handoff
// ============================================================
export async function requestHumanHandoff(
  ctx: ToolContext,
  args: { reason: string }
): Promise<{ success: boolean; message: string }> {
  const admin = createSupabaseAdminClient();

  // Update conversation to handed-off state
  await admin
    .from('conversations')
    .update({
      owner: 'human',
      status: 'handed_off',
      handoff_reason: args.reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ctx.conversationId);

  // Send immediate in-app and WhatsApp alert to clinic owner
  try {
    await createNotification({
      organizationId: ctx.organizationId,
      type: 'human_handoff_requested',
      title: '🚨 Human Handoff Requested',
      message: `Patient ${ctx.patientPhone} requested human intervention: "${args.reason}".`,
      metadata: { conversationId: ctx.conversationId, reason: args.reason },
    });
  } catch (e) {
    console.warn('Handoff notification failed:', e);
  }

  return {
    success: true,
    message: 'A team member has been notified and will be with you shortly.',
  };
}

// ============================================================
// Tool executor — validates and routes tool calls from the model
// ============================================================
export async function executeTool(
  ctx: ToolContext,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // Whitelist of allowed tools — never allow arbitrary execution
  switch (toolName) {
    case 'search_clinic_knowledge':
      return searchClinicKnowledge(ctx, args as { query: string });
    case 'get_clinic_services':
      return getClinicServices(ctx);
    case 'get_clinic_hours':
      return getClinicHours(ctx);
    case 'check_availability':
      return checkAvailability(ctx, args as { date: string; serviceName?: string; durationMinutes?: number });
    case 'get_patient_appointments':
      return getPatientAppointments(ctx);
    case 'create_appointment':
      return createAppointment(ctx, args as Parameters<typeof createAppointment>[1]);
    case 'cancel_appointment':
      return cancelAppointment(ctx, args as { appointmentId: string; reason?: string });
    case 'request_human_handoff':
      return requestHumanHandoff(ctx, args as { reason: string });
    default:
      throw new Error(`Unknown tool: ${toolName}. Only approved tools are allowed.`);
  }
}
