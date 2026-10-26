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
  lastUserMessage?: string;
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
export function detectTimePreference(
  explicitPref?: string,
  explicitPeriod?: string,
  lastUserMessage?: string
): {
  period: 'morning' | 'afternoon' | 'evening' | 'all';
  targetHour?: number;
  targetMinute?: number;
  rawPreference?: string;
} {
  const combined = [explicitPeriod, explicitPref, lastUserMessage].filter(Boolean).join(' ').toLowerCase();

  // 1. Specific time matching e.g. "5pm", "5:30 pm", "17:00", "at 4pm", "around 11:30"
  const time12Match = combined.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (time12Match) {
    let hour = parseInt(time12Match[1], 10);
    const minute = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
    const meridian = time12Match[3].toLowerCase();
    if (meridian === 'pm' && hour < 12) hour += 12;
    if (meridian === 'am' && hour === 12) hour = 0;
    const period = hour >= 16 ? 'evening' : hour >= 12 ? 'afternoon' : 'morning';
    return { period, targetHour: hour, targetMinute: minute, rawPreference: time12Match[0] };
  }

  const time24Match = combined.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (time24Match) {
    const hour = parseInt(time24Match[1], 10);
    const minute = parseInt(time24Match[2], 10);
    const period = hour >= 16 ? 'evening' : hour >= 12 ? 'afternoon' : 'morning';
    return { period, targetHour: hour, targetMinute: minute, rawPreference: time24Match[0] };
  }

  // 2. Period keywords
  if (/\b(evening|night|pm|late|after 4|after 5|after 6|post 4|post 5)\b/i.test(combined)) {
    return { period: 'evening', rawPreference: 'evening' };
  }
  if (/\b(afternoon|post lunch|noon|lunch)\b/i.test(combined)) {
    return { period: 'afternoon', rawPreference: 'afternoon' };
  }
  if (/\b(morning|am|early)\b/i.test(combined)) {
    return { period: 'morning', rawPreference: 'morning' };
  }

  return { period: 'all' };
}

export async function checkAvailability(
  ctx: ToolContext,
  args: {
    date: string;
    serviceName?: string;
    durationMinutes?: number;
    preferredTime?: string;
    period?: 'morning' | 'afternoon' | 'evening' | 'all';
  }
): Promise<{
  available: boolean;
  slots: Array<{ startTime: string; endTime: string }>;
  allSlots?: Array<{ startTime: string; endTime: string }>;
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

  // Determine appointment duration:
  // 1. Explicitly requested durationMinutes
  // 2. Duration of matching clinic service from DB
  // 3. Default fallback: 30 minutes (do NOT use policy buffer as service duration!)
  let duration = args.durationMinutes;
  if (!duration && args.serviceName) {
    const { data: svc } = await admin
      .from('services')
      .select('duration_minutes')
      .eq('organization_id', ctx.organizationId)
      .ilike('name', `%${args.serviceName.trim()}%`)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (svc?.duration_minutes) {
      duration = svc.duration_minutes;
    }
  }
  if (!duration) {
    duration = 30;
  }

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

  // Normalize open, close, and break times
  const normalizeTime = (val: string | null | undefined, fallback: string) => {
    if (!val) return fallback;
    const parts = String(val).trim().split(':');
    const h = parts[0].padStart(2, '0');
    const m = (parts[1] || '00').padStart(2, '0');
    return `${h}:${m}`;
  };

  const rawOpen = normalizeTime(hours.open_time, '09:00');
  const rawClose = normalizeTime(hours.close_time, '18:00');
  let current = parseClinicDateTime(`${dateStr}T${rawOpen}:00`, tz);
  const close = parseClinicDateTime(`${dateStr}T${rawClose}:00`, tz);

  const breakStart = hours.break_start ? parseClinicDateTime(`${dateStr}T${normalizeTime(hours.break_start, '13:00')}:00`, tz) : null;
  const breakEnd = hours.break_end ? parseClinicDateTime(`${dateStr}T${normalizeTime(hours.break_end, '14:00')}:00`, tz) : null;

  const buffer = policy?.buffer_minutes ?? 0;

  const allDaySlots: Array<{ startTime: string; endTime: string; dateObj: Date }> = [];

  // Generate ALL valid slots across the clinic's full working hours
  while (isBefore(current, close)) {
    const slotEnd = addMinutes(current, duration);
    if (isAfter(slotEnd, close)) break;

    // Skip if within minimum advance notice window
    if (isBefore(current, new Date(now.getTime() + minAdvanceMs))) {
      current = addMinutes(current, duration + buffer);
      continue;
    }

    // Skip if overlapping clinic break hours
    if (breakStart && breakEnd && isBefore(current, breakEnd) && isAfter(slotEnd, breakStart)) {
      current = breakEnd;
      continue;
    }

    // Check for conflicts with existing booked appointments
    const hasConflict = (existing ?? []).some((appt: any) => {
      const apptStart = parseISO(appt.starts_at);
      const apptEnd = parseISO(appt.ends_at);
      return isBefore(current, apptEnd) && isAfter(slotEnd, apptStart);
    });

    if (!hasConflict) {
      const localSlotHour = current.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const [hPart, mPart] = localSlotHour.split(':');
      allDaySlots.push({
        startTime: `${dateStr}T${hPart}:${mPart}:00`,
        endTime: slotEnd.toISOString(),
        dateObj: new Date(current.getTime()),
      });
    }

    current = addMinutes(current, duration + buffer);
  }

  // Format helper for slot timestamps
  const formatSlotTime = (isoOrLocalStr: string) => {
    const d = parseClinicDateTime(isoOrLocalStr, tz);
    return d.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatHeaderTime = (timeStr: string) => {
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m > 0 ? `:${String(m).padStart(2, '0')}` : ':00';
    return `${displayH}${displayM} ${period}`;
  };

  const openDisplay = formatHeaderTime(rawOpen);
  const closeDisplay = formatHeaderTime(rawClose);
  const hoursNote = `Working hours: ${openDisplay} – ${closeDisplay}`;

  const dateFormatted = new Date(startOfDay.getTime() + 12 * 3600 * 1000).toLocaleDateString('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (allDaySlots.length === 0) {
    return {
      available: false,
      slots: [],
      allSlots: [],
      message: `No available slots on ${dateFormatted} (${hoursNote}). The clinic is fully booked on this day.`,
    };
  }

  // Partition slots by time of day in clinic local timezone
  const getSlotHour = (d: Date) => {
    const str = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    return parseInt(str, 10);
  };

  const morningSlots = allDaySlots.filter(s => getSlotHour(s.dateObj) < 12);
  const afternoonSlots = allDaySlots.filter(s => {
    const h = getSlotHour(s.dateObj);
    return h >= 12 && h < 16;
  });
  const eveningSlots = allDaySlots.filter(s => getSlotHour(s.dateObj) >= 16);

  // Detect time preference from arguments or last patient message
  const pref = detectTimePreference(args.preferredTime, args.period, ctx.lastUserMessage);

  let returnedSlots: Array<{ startTime: string; endTime: string }> = [];
  let message = '';

  if (pref.targetHour !== undefined) {
    // Specific target time requested (e.g. 5pm)
    const targetDate = parseClinicDateTime(
      `${dateStr}T${String(pref.targetHour).padStart(2, '0')}:${String(pref.targetMinute ?? 0).padStart(2, '0')}:00`,
      tz
    );
    const sorted = [...allDaySlots].sort((a, b) => {
      return Math.abs(a.dateObj.getTime() - targetDate.getTime()) - Math.abs(b.dateObj.getTime() - targetDate.getTime());
    });
    const selected = sorted.slice(0, 5).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    returnedSlots = selected.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
    const formatted = selected.map(s => formatSlotTime(s.startTime)).join(', ');
    const displayTarget = formatSlotTime(targetDate.toISOString());
    message = `Found available slots around ${displayTarget} on ${dateFormatted}: ${formatted} (${hoursNote}).`;
  } else if (pref.period === 'evening') {
    if (eveningSlots.length > 0) {
      const selected = eveningSlots.slice(0, 6);
      returnedSlots = selected.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
      const formatted = selected.map(s => formatSlotTime(s.startTime)).join(', ');
      message = `Found available evening slots on ${dateFormatted}: ${formatted} (${hoursNote}).`;
    } else {
      const alt = allDaySlots.slice(-4).map(s => formatSlotTime(s.startTime)).join(', ');
      returnedSlots = allDaySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
      message = `No evening slots are available on ${dateFormatted} (${hoursNote}). However, earlier slots are available: ${alt}. Would you like an earlier time?`;
    }
  } else if (pref.period === 'afternoon') {
    if (afternoonSlots.length > 0) {
      const selected = afternoonSlots.slice(0, 6);
      returnedSlots = selected.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
      const formatted = selected.map(s => formatSlotTime(s.startTime)).join(', ');
      message = `Found available afternoon slots on ${dateFormatted}: ${formatted} (${hoursNote}).`;
    } else {
      const alt = allDaySlots.slice(0, 4).map(s => formatSlotTime(s.startTime)).join(', ');
      returnedSlots = allDaySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
      message = `No afternoon slots are available on ${dateFormatted} (${hoursNote}). Available slots: ${alt}.`;
    }
  } else if (pref.period === 'morning') {
    if (morningSlots.length > 0) {
      const selected = morningSlots.slice(0, 6);
      returnedSlots = selected.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
      const formatted = selected.map(s => formatSlotTime(s.startTime)).join(', ');
      message = `Found available morning slots on ${dateFormatted}: ${formatted} (${hoursNote}).`;
    } else {
      const alt = allDaySlots.slice(0, 4).map(s => formatSlotTime(s.startTime)).join(', ');
      returnedSlots = allDaySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
      message = `No morning slots are available on ${dateFormatted} (${hoursNote}). Later slots available: ${alt}.`;
    }
  } else {
    // All day distribution covering the clinic's full working hours
    returnedSlots = allDaySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime }));
    const lines: string[] = [`Found available slots on ${dateFormatted} (${hoursNote}):`];
    if (morningSlots.length > 0) {
      lines.push(`• Morning: ${morningSlots.slice(0, 3).map(s => formatSlotTime(s.startTime)).join(', ')}`);
    }
    if (afternoonSlots.length > 0) {
      lines.push(`• Afternoon: ${afternoonSlots.slice(0, 3).map(s => formatSlotTime(s.startTime)).join(', ')}`);
    }
    if (eveningSlots.length > 0) {
      lines.push(`• Evening: ${eveningSlots.slice(0, 3).map(s => formatSlotTime(s.startTime)).join(', ')}`);
    }
    if (lines.length === 1) {
      lines.push(allDaySlots.slice(0, 6).map(s => formatSlotTime(s.startTime)).join(', '));
    }
    lines.push('Which time works best for you?');
    message = lines.join('\n');
  }

  return {
    available: allDaySlots.length > 0,
    slots: returnedSlots,
    allSlots: allDaySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime })),
    message,
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

  // Get service details — smart search with fallback
  let service: { id: string; name: string; duration_minutes: number; is_bookable: boolean } | null = null;

  // 1. Direct substring match
  const { data: directMatches } = await admin
    .from('services')
    .select('id, name, duration_minutes, is_bookable')
    .eq('organization_id', ctx.organizationId)
    .ilike('name', `%${args.serviceName.trim()}%`)
    .eq('is_active', true)
    .eq('is_bookable', true)
    .limit(1);

  if (directMatches?.[0]) {
    service = directMatches[0];
  }

  // 2. Strip parentheses (e.g. "Teeth Whitening (Laser Bleaching)" -> "Teeth Whitening")
  if (!service) {
    const stripped = args.serviceName.replace(/\(.*?\)/g, '').trim();
    if (stripped && stripped.toLowerCase() !== args.serviceName.toLowerCase()) {
      const { data: strippedMatches } = await admin
        .from('services')
        .select('id, name, duration_minutes, is_bookable')
        .eq('organization_id', ctx.organizationId)
        .ilike('name', `%${stripped}%`)
        .eq('is_active', true)
        .eq('is_bookable', true)
        .limit(1);
      if (strippedMatches?.[0]) {
        service = strippedMatches[0];
      }
    }
  }

  // 3. Match by key procedure terms
  if (!service) {
    const keywords = args.serviceName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 4);

    for (const kw of keywords) {
      const { data: kwMatches } = await admin
        .from('services')
        .select('id, name, duration_minutes, is_bookable')
        .eq('organization_id', ctx.organizationId)
        .ilike('name', `%${kw}%`)
        .eq('is_active', true)
        .eq('is_bookable', true)
        .limit(1);

      if (kwMatches?.[0]) {
        service = kwMatches[0];
        break;
      }
    }
  }

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

  // Re-check availability in clinic timezone across full working day
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(startTime);
  const availabilityCheck = await checkAvailability(ctx, {
    date: dateStr,
    durationMinutes: service.duration_minutes,
    preferredTime: 'all',
  });

  const validSlots = availabilityCheck.allSlots ?? availabilityCheck.slots;
  const slotAvailable = availabilityCheck.available && (
    validSlots.length === 0 ||
    validSlots.some(
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

  // Fetch clinic profile for location & Google Maps link
  const { data: profile } = await admin
    .from('clinic_profiles')
    .select('address_line1, city, google_maps_url')
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  const locationMsg = profile?.address_line1
    ? ` 📍 Location: ${profile.address_line1}${profile.city ? `, ${profile.city}` : ''}.${profile.google_maps_url ? ` Directions: ${profile.google_maps_url}` : ''}`
    : '';

  return {
    success: true,
    appointmentId: appointment.id,
    externalEventId: calendarEventId,
    message: `Your appointment has been booked for ${displayDate} at ${displayTime}.${locationMsg}`,
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
      return checkAvailability(ctx, args as {
        date: string;
        serviceName?: string;
        durationMinutes?: number;
        preferredTime?: string;
        period?: 'morning' | 'afternoon' | 'evening' | 'all';
      });
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
