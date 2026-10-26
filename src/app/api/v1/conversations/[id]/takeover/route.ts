// src/app/api/v1/conversations/[id]/takeover/route.ts
// Direct human takeover / release to AI endpoint

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';

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

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const newOwner = body.owner === 'human' || body.owner === 'ai' ? body.owner : 'human';
    const newStatus = newOwner === 'human' ? 'handed_off' : 'active';

    const { data: conv } = await admin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('organization_id', membership.organization_id)
      .single();

    if (!conv) return Errors.notFound('Conversation not found');

    await admin
      .from('conversations')
      .update({
        owner: newOwner,
        status: newStatus,
        handoff_reason: newOwner === 'human' ? (body.reason || 'Staff took over live chat via dashboard') : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return successResponse({
      message: newOwner === 'human' ? 'Conversation taken over by staff' : 'Conversation returned to AI control',
      owner: newOwner,
      status: newStatus,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    if (msg === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError();
  }
}
