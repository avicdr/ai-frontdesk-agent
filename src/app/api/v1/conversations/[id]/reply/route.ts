// src/app/api/v1/conversations/[id]/reply/route.ts
// Direct manual reply to patient via WhatsApp endpoint

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const body = await request.json();
    const message = body.message?.trim();
    if (!message) {
      return Errors.badRequest('Message content is required');
    }

    const { data: conv } = await admin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!conv) return Errors.notFound('Conversation not found');

    const { data: newMsg } = await admin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        organization_id: membership.organization_id,
        external_id: `${membership.organization_id}:dashboard:${Date.now()}`,
        role: 'assistant',
        content: message,
        channel: 'whatsapp',
        metadata: { sent_by_owner: true, from_dashboard: true },
      })
      .select()
      .single();

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
