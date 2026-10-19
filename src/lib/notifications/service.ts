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
  metadata?: Record<string, unknown>;
}

export async function createNotification(payload: NotificationPayload) {
  const admin = createSupabaseAdminClient();

  // 1. Record notification in database
  const { data: record, error } = await admin
    .from('notifications')
    .insert({
      organization_id: payload.organizationId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
      status: 'unread',
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
    } catch (err) {
      console.warn(`Could not dispatch WhatsApp alert to ${payload.recipientPhone}:`, err);
    }
  }

  return record;
}
