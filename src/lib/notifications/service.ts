// src/lib/notifications/service.ts
// Clinic and patient notifications service

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

export type NotificationType = 
  | 'appointment_booked'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'human_handoff_requested'
  | 'subscription_expiring'
  | 'payment_received';

interface NotificationPayload {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientPhone?: string;
  recipientEmail?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export async function createNotification(payload: NotificationPayload) {
  const admin = createSupabaseAdminClient();

  const channel = payload.recipientPhone ? 'whatsapp' : (payload.recipientEmail ? 'email' : 'email');
  const recipient = payload.recipientPhone || payload.recipientEmail || 'clinic-admin';
  const idempotencyKey = `notif:${payload.organizationId}:${payload.type}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;

  let relatedEntityType = payload.relatedEntityType;
  let relatedEntityId = payload.relatedEntityId;
  if (!relatedEntityType && payload.metadata) {
    if (typeof payload.metadata.appointmentId === 'string') {
      relatedEntityType = 'appointment';
      relatedEntityId = payload.metadata.appointmentId;
    } else if (typeof payload.metadata.conversationId === 'string') {
      relatedEntityType = 'conversation';
      relatedEntityId = payload.metadata.conversationId;
    }
  }

  // 1. Record notification in database
  const { data: record, error } = await admin
    .from('notifications')
    .insert({
      organization_id: payload.organizationId,
      notification_type: payload.type,
      channel: channel as 'email' | 'whatsapp' | 'sms',
      recipient: recipient,
      subject: payload.title,
      body: payload.message,
      status: 'pending',
      idempotency_key: idempotencyKey,
      related_entity_type: relatedEntityType || null,
      related_entity_id: relatedEntityId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create in-app notification:', error);
  }

  // 2. If recipient phone is specified, dispatch WhatsApp message
  if (payload.recipientPhone) {
    try {
      await sendWhatsAppMessage(
        payload.organizationId,
        payload.recipientPhone,
        payload.message
      );
      if (record?.id) {
        await admin
          .from('notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', record.id);
      }
    } catch (err) {
      console.warn(`Could not dispatch WhatsApp alert to ${payload.recipientPhone}:`, err);
      if (record?.id) {
        await admin
          .from('notifications')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            failure_reason: err instanceof Error ? err.message : String(err),
          })
          .eq('id', record.id);
      }
    }
  }

  return record;
}
