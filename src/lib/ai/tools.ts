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

export function getTimezoneOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  } catch {
    return 330; // Default +05:30 for India
  }
}

/**
 * Returns YYYY-MM-DD for a date offset in the specified timezone
 */
export function getClinicDateStr(timeZone: string = 'Asia/Kolkata', daysOffset: number = 0): string {
  const d = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/**
 * Converts a date/time string from the clinic's local timezone into a UTC Date object.
 * Handles inputs like "2026-10-20T11:00:00", "2026-10-20T11:00:00Z", "2026-10-20 11:00", etc.
 */
export function parseClinicDateTime(dateTimeInput: string, timeZone: string = 'Asia/Kolkata'): Date {
  if (!dateTimeInput) {
    const fallback = addDays(new Date(), 1);
    fallback.setHours(10, 0, 0, 0);
    return fallback;
  }

  // If string contains explicit non-Z offset like +05:30, +0530, -04:00, parse directly
  const hasExplicitOffset = /[+-]\d{2}:?\d{2}$/.test(dateTimeInput.trim());
  if (hasExplicitOffset) {
    const d = new Date(dateTimeInput);
    if (!isNaN(d.getTime())) return d;
  }

  // Strip trailing 'Z' if present: LLMs emit 'Z' suffix thinking it's standard format,
  // but the user and clinic specified local wall-clock time (e.g. 11:00 AM).
  const cleanStr = dateTimeInput.trim().replace(/Z$/i, '');
  const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);

  if (match) {
    const [, y, m, d, hr, min, sec] = match;
    const naiveUtc = new Date(Date.UTC(+y, +m - 1, +d, +hr, +min, +(sec || 0)));
    const offsetMinutes = getTimezoneOffsetMinutes(timeZone, naiveUtc);
    return new Date(naiveUtc.getTime() - offsetMinutes * 60000);
  }

  const parsed = new Date(dateTimeInput);
  if (!isNaN(parsed.getTime())) return parsed;

  const fallback = addDays(new Date(), 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}

export function parseDateInput(dateInput?: string, timeZone: string = 'Asia/Kolkata'): { dateStr: string; dayOfWeek: number } {
  const lower = (dateInput || '').trim().toLowerCase();
  let dateStr: string;

  if (!dateInput || lower === 'tomorrow') {
    dateStr = getClinicDateStr(timeZone, 1);
  } else if (lower === 'today') {
    dateStr = getClinicDateStr(timeZone, 0);
  } else if (lower === 'day after tomorrow') {
    dateStr = getClinicDateStr(timeZone, 2);
  } else {
    const match = lower.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      dateStr = match[0];
    } else {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        dateStr = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed);
      } else {
        dateStr = getClinicDateStr(timeZone, 1);
      }
    }
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const naiveUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = naiveUtc.getUTCDay();

  return { dateStr, dayOfWeek };
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
  const tz = ctx.timezone || 'Asia/Kolkata';

  // Parse requested date safely supporting relative ('tomorrow', 'today') and ISO strings in clinic timezone
  const { dateStr, dayOfWeek } = parseDateInput(args.date, tz);

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
    .eq('date', dateStr)
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

  // Boundary timestamps for the requested day in the clinic's timezone
  const startOfDay = parseClinicDateTime(`${dateStr}T00:00:00`, tz);
  const endOfDay = parseClinicDateTime(`${dateStr}T23:59:59`, tz);

  if (endOfDay < now) {
    return { available: false, slots: [], message: 'Cannot book appointments in the past.' };
  }
  if (startOfDay > addDays(now, maxAdvanceDays)) {
    return { available: false, slots: [], message: `Appointments can only be booked up to ${maxAdvanceDays} days in advance.` };
  }

  // Query existing appointments for the day
  const { data: existing } = await admin
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('organization_id', ctx.organizationId)
    .gte('starts_at', startOfDay.toISOString())
    .lte('starts_at', endOfDay.toISOString())
    .not('status', 'in', '("cancelled","rescheduled")');

  // Generate available slots using clinic opening and closing times
  const openTime = hours.open_time ?? '09:00';
  const closeTime = hours.close_time ?? '18:00';
  let current = parseClinicDateTime(`${dateStr}T${openTime}:00`, tz);
  const close = parseClinicDateTime(`${dateStr}T${closeTime}:00`, tz);
  const buffer = policy?.buffer_minutes ?? 10;

  const slots: Array<{ startTime: string; endTime: string }> = [];

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
      const localSlotHour = current.toLocaleTimeString('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const [hPart, mPart] = localSlotHour.split(':');
      slots.push({
        startTime: `${dateStr}T${hPart}:${mPart}:00`,
        endTime: slotEnd.toISOString(),
      });
      if (slots.length >= 8) break;
    }

    current = addMinutes(current, duration + buffer);
  }

  const formattedSlots = slots
    .slice(0, 5)
    .map(s => {
      const d = parseClinicDateTime(s.startTime, tz);
      return d.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    })
    .join(', ');

  const dateFormatted = new Date(startOfDay.getTime() + 12 * 3600 * 1000).toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    available: slots.length > 0,
    slots,
    message: slots.length > 0
      ? `Found available slots on ${dateFormatted}: ${formattedSlots}.`
      : `No available slots on ${dateFormatted}.`,
  };
}

// ============================================================
// Tool: Get patient appointments
// ============================================================
export async function getPatientAppointments(
  ctx: ToolContext
): Promise<{ appointments: Array<{ id: string; service: string | null; date: string; time: string; status: string }> }> {
  const admin = createSupabaseAdminClient();
  const tz = ctx.timezone || 'Asia/Kolkata';

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
      date: new Date(a.starts_at as string).toLocaleDateString('en-US', { timeZone: tz, month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date(a.starts_at as string).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }),
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
  const tz = ctx.timezone || 'Asia/Kolkata';

  // Parse clinic local time into true UTC Date
  let startTime = parseClinicDateTime(args.startTime, tz);

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

  // Re-check availability in clinic timezone
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(startTime);
  const availabilityCheck = await checkAvailability(ctx, {
    date: dateStr,
    durationMinutes: service.duration_minutes,
  });

  const slotAvailable = availabilityCheck.available && (
    availabilityCheck.slots.length === 0 ||
    availabilityCheck.slots.some(
      s => Math.abs(parseClinicDateTime(s.startTime, tz).getTime() - startTime.getTime()) <= 45 * 60 * 1000
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
      timezone: tz,
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
      clinicTimezone: tz,
    });
    if (calEvent?.id) {
      calendarEventId = calEvent.id;
      await admin.from('appointments').update({ external_event_id: calEvent.id }).eq('id', appointment.id);
    }
  } catch (calErr) {
    console.warn('Calendar sync error during booking:', calErr);
  }

  const displayTime = startTime.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const displayDate = startTime.toLocaleDateString('en-US', {
    timeZone: tz,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Clinic owner notification
  try {
    await createNotification({
      organizationId: ctx.organizationId,
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      message: `${args.patientName} (${args.patientPhone}) booked ${args.serviceName} for ${displayDate} at ${displayTime}.`,
      metadata: { appointmentId: appointment.id, startsAt: startTime.toISOString() },
    });
  } catch (notifErr) {
    console.warn('Notification dispatch error:', notifErr);
  }

  return {
    success: true,
    appointmentId: appointment.id,
    externalEventId: calendarEventId,
    message: `Your appointment has been booked for ${displayDate} at ${displayTime}.`,
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
