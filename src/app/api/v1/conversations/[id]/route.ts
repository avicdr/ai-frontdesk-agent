// src/app/api/v1/conversations/[id]/route.ts
// Direct conversation thread retrieval by ID

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
