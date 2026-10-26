// src/lib/reviews/review-service.ts
// Service for dispatching automated Google Business Review requests to patients via WhatsApp

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { createNotification } from '@/lib/notifications/service';
import { nanoid } from 'nanoid';

export { DEFAULT_REVIEW_TEMPLATE, formatReviewMessage } from './constants';
import { formatReviewMessage } from './constants';

export interface ReviewDispatchResult {
  success: boolean;
  appointmentId: string;
  patientName?: string;
  patientPhone?: string;
  messageId?: string;
  error?: string;
  alreadyRequested?: boolean;
}

/**
 * Dispatches an automated Google Review WhatsApp message to an appointment's patient.
 */
export async function dispatchReviewRequestForAppointment(
  appointmentId: string,
  options?: { force?: boolean }
): Promise<ReviewDispatchResult> {
  const admin = createSupabaseAdminClient();

  // 1. Fetch appointment details
  const { data: appt, error: apptErr } = await admin
    .from('appointments')
    .select('*, services:service_id(name)')
    .eq('id', appointmentId)
    .single();

  if (apptErr || !appt) {
    return {
      success: false,
      appointmentId,
      error: `Appointment not found: ${apptErr?.message || 'unknown'}`,
    };
  }

  // 2. Check if review was already requested
  if (appt.review_requested_at && !options?.force) {
    return {
      success: false,
      appointmentId,
      alreadyRequested: true,
      error: `Review request was already sent at ${appt.review_requested_at}`,
    };
  }

  // 3. Fetch clinic profile for review link and template
  const { data: profile } = await admin
    .from('clinic_profiles')
    .select('*')
    .eq('organization_id', appt.organization_id)
    .maybeSingle();

  const reviewLink = profile?.google_review_link;
  if (!reviewLink || !reviewLink.trim()) {
    return {
      success: false,
      appointmentId,
      error: 'Clinic has not configured a Google Business review link in Clinic Settings.',
    };
  }

  const clinicName = profile?.clinic_name || 'AI Front Desk Clinic';
  const serviceName = (appt.services as any)?.name || 'Consultation';

  // 4. Construct message text
  const messageText = formatReviewMessage(profile?.review_request_template, {
    patientName: appt.patient_name,
    clinicName,
    reviewLink: reviewLink.trim(),
    serviceName,
  });

  // 5. Send message via WhatsApp (try Baileys first, fallback to Meta Cloud API)
  let sendSuccess = false;
  let messageId: string | undefined;
  let sendError: string | undefined;

  try {
    const { sendBaileysTextMessage } = await import('@/lib/whatsapp/baileys-service');
    const baileysRes = await sendBaileysTextMessage(
      appt.organization_id,
      appt.patient_phone,
      messageText
    );

    if (baileysRes.success) {
      sendSuccess = true;
      messageId = baileysRes.messageId;
    } else {
      sendError = baileysRes.error;
    }
  } catch (bErr: any) {
    sendError = bErr?.message;
  }

  // Fallback to Meta Cloud API if Baileys is not connected
  if (!sendSuccess) {
    try {
      const { data: metaIntegration } = await admin
        .from('whatsapp_integrations')
        .select('*')
        .eq('organization_id', appt.organization_id)
        .eq('status', 'connected')
        .maybeSingle();

      if (metaIntegration?.phone_number_id && metaIntegration?.access_token_encrypted) {
        const metaRes = await sendWhatsAppMessage(
          appt.organization_id,
          appt.patient_phone,
          messageText
        );
        if (metaRes.success) {
          sendSuccess = true;
          messageId = metaRes.messageId;
          sendError = undefined;
        } else {
          sendError = metaRes.error;
        }
      }
    } catch (mErr: any) {
      sendError = mErr?.message;
    }
  }

  if (!sendSuccess) {
    return {
      success: false,
      appointmentId,
      patientName: appt.patient_name,
      patientPhone: appt.patient_phone,
      error: sendError || 'Failed to dispatch WhatsApp message across available WhatsApp channels.',
    };
  }

  const nowIso = new Date().toISOString();

  // 6. Update appointment record
  await admin
    .from('appointments')
    .update({
      review_requested_at: nowIso,
      review_status: 'sent',
      updated_at: nowIso,
    })
    .eq('id', appt.id);

  // 7. Record appointment audit event
  try {
    await admin.from('appointment_events').insert({
      appointment_id: appt.id,
      organization_id: appt.organization_id,
      event_type: 'review_requested',
      actor_type: 'ai',
      actor_id: 'review-automator',
      metadata: {
        review_link: reviewLink,
        message_id: messageId,
      },
    });
  } catch (eventErr) {
    console.warn('Failed to record review_requested appointment event:', eventErr);
  }

  // 8. Record in conversation messages table so it appears in the live timeline
  try {
    let convId = appt.conversation_id;
    if (!convId) {
      // Find existing active conversation or create one
      const { data: conv } = await admin
        .from('conversations')
        .select('id')
        .eq('organization_id', appt.organization_id)
        .eq('patient_phone', appt.patient_phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conv) {
        convId = conv.id;
      } else {
        const { data: newConv } = await admin
          .from('conversations')
          .insert({
            organization_id: appt.organization_id,
            channel: 'whatsapp',
            patient_phone: appt.patient_phone,
            patient_name: appt.patient_name,
            status: 'active',
            owner: 'ai',
            last_message_at: nowIso,
          })
          .select('id')
          .single();
        convId = newConv?.id;
      }
    }

    if (convId) {
      await admin.from('messages').insert({
        conversation_id: convId,
        organization_id: appt.organization_id,
        external_id: `${appt.organization_id}:rev:${messageId || nanoid(10)}`,
        role: 'assistant',
        content: messageText,
        status: 'sent',
        sent_at: nowIso,
        metadata: {
          type: 'google_review_request',
          appointment_id: appt.id,
          review_link: reviewLink,
        },
      });

      await admin
        .from('conversations')
        .update({ last_message_at: nowIso })
        .eq('id', convId);
    }
  } catch (msgErr) {
    console.warn('Failed to record review message in timeline:', msgErr);
  }

  // 9. In-app notification for clinic staff
  try {
    await createNotification({
      organizationId: appt.organization_id,
      type: 'review_requested',
      title: '⭐ Google Review Request Sent',
      message: `Automated review link sent to ${appt.patient_name} (${appt.patient_phone}).`,
      metadata: {
        appointmentId: appt.id,
        patientPhone: appt.patient_phone,
        reviewLink,
      },
    });
  } catch (notifErr) {
    console.warn('Failed to record in-app notification:', notifErr);
  }

  return {
    success: true,
    appointmentId,
    patientName: appt.patient_name,
    patientPhone: appt.patient_phone,
    messageId,
  };
}

/**
 * Background processor that finds all appointments eligible for automated review requests and dispatches them.
 */
export async function processPendingAppointmentReviews(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // 1. Fetch clinics with auto_review_request enabled and a valid review link
  const { data: profiles, error: profErr } = await admin
    .from('clinic_profiles')
    .select('organization_id, google_review_link, auto_review_request, review_request_delay_minutes')
    .eq('auto_review_request', true)
    .not('google_review_link', 'is', null);

  if (profErr || !profiles || profiles.length === 0) {
    return { processed: 0, sent: 0, failed: 0, errors: [] };
  }

  const profileMap = new Map<string, any>();
  for (const p of profiles) {
    if (p.google_review_link && p.google_review_link.trim().length > 5) {
      profileMap.set(p.organization_id, p);
    }
  }

  if (profileMap.size === 0) {
    return { processed: 0, sent: 0, failed: 0, errors: [] };
  }

  const orgIds = Array.from(profileMap.keys());

  // 2. Fetch appointments eligible for review request
  const { data: appointments, error: apptErr } = await admin
    .from('appointments')
    .select('id, organization_id, patient_name, patient_phone, starts_at, ends_at, status, review_requested_at')
    .in('organization_id', orgIds)
    .in('status', ['confirmed', 'completed'])
    .is('review_requested_at', null)
    .gte('starts_at', twoDaysAgo.toISOString())
    .order('ends_at', { ascending: true })
    .limit(50);

  if (apptErr || !appointments || appointments.length === 0) {
    return { processed: 0, sent: 0, failed: 0, errors: [] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const appt of appointments) {
    const prof = profileMap.get(appt.organization_id);
    if (!prof) continue;

    const delayMinutes = prof.review_request_delay_minutes ?? 60;
    const endsAt = new Date(appt.ends_at);
    const triggerTime = new Date(endsAt.getTime() + delayMinutes * 60 * 1000);

    // Eligible if appointment is completed, or if ends_at + delay has elapsed
    const isDue = appt.status === 'completed' || now >= triggerTime;

    if (!isDue) continue;

    const res = await dispatchReviewRequestForAppointment(appt.id);
    if (res.success) {
      sent++;
    } else {
      failed++;
      if (res.error) errors.push(`${appt.patient_name}: ${res.error}`);
    }
  }

  return {
    processed: appointments.length,
    sent,
    failed,
    errors,
  };
}
