// src/app/api/v1/conversations/route.ts
// Clinic conversations and messages management API

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
import { z } from 'zod';

const ActionSchema = z.object({
  conversationId: z.string().uuid(),
  action: z.enum(['takeover', 'release_to_ai', 'send_message', 'close']),
  message: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // 1. Get user org
    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const conversationId = request.nextUrl.searchParams.get('conversationId');

    if (conversationId) {
      // Get single conversation with full message timeline
      const { data: conversation } = await admin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('organization_id', membership.organization_id)
        .single();

      if (!conversation) return Errors.notFound('Conversation not found');

      const { data: messages } = await admin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return successResponse({ conversation, messages: messages ?? [] });
    }

    // List all conversations for org
    const { data: conversations, error } = await admin
      .from('conversations')
      .select(`
        id,
        patient_phone,
        status,
        owner,
        last_message_at,
        created_at,
        handoff_reason
      `)
      .eq('organization_id', membership.organization_id)
      .order('last_message_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load conversations:', error);
      return Errors.internalError();
    }

    return successResponse({ conversations: conversations ?? [] });
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
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { conversationId, action, message } = parsed.data;

    // Check conversation ownership
    const { data: conv } = await admin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!conv) return Errors.notFound('Conversation not found');

    if (action === 'takeover') {
      await admin
        .from('conversations')
        .update({
          owner: 'human',
          status: 'handed_off',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return successResponse({ message: 'Conversation taken over by staff' });
    }

    if (action === 'release_to_ai') {
      await admin
        .from('conversations')
        .update({
          owner: 'ai',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return successResponse({ message: 'Conversation returned to AI control' });
    }

    if (action === 'close') {
      await admin
        .from('conversations')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return successResponse({ message: 'Conversation closed' });
    }

    if (action === 'send_message') {
      if (!message || message.trim() === '') {
        return Errors.badRequest('Message content is required');
      }

      // Record message in db
      const { data: newMsg } = await admin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: message,
          channel: 'whatsapp',
        })
        .select()
        .single();

      // Dispatch WhatsApp message to patient
      try {
        await sendWhatsAppMessage(
          membership.organization_id,
          conv.patient_phone,
          message
        );
      } catch (err) {
        console.warn('WhatsApp manual send error:', err);
      }

      await admin
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return successResponse({ message: newMsg });
    }

    return Errors.badRequest('Invalid action');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
