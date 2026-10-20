// src/app/api/v1/integrations/whatsapp/session/route.ts
// API endpoints to initiate, poll, and terminate Baileys WhatsApp sessions

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  startBaileysSession,
  getBaileysSessionStatus,
  disconnectBaileysSession,
} from '@/lib/whatsapp/baileys-service';
import { z } from 'zod';

const StartSessionSchema = z.object({
  mode: z.enum(['qr', 'pairing_code']).default('qr'),
  phoneNumber: z.string().optional(),
  forceReconnect: z.boolean().optional(),
});

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

    const body = await request.json().catch(() => ({}));
    const parsed = StartSessionSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { mode, phoneNumber, forceReconnect } = parsed.data;

    // Trigger or get session state
    const state = await startBaileysSession(membership.organization_id, {
      mode,
      phoneNumber,
      forceReconnect,
    });

    return successResponse(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Start WhatsApp session error:', err);
    return Errors.internalError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    const state = await getBaileysSessionStatus(membership.organization_id);
    return successResponse(state);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Get WhatsApp session status error:', err);
    return Errors.internalError();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const { data: membership } = await admin
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return Errors.forbidden();

    await disconnectBaileysSession(membership.organization_id);
    return successResponse({ success: true, status: 'disconnected' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    if (message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Disconnect WhatsApp session error:', err);
    return Errors.internalError();
  }
}
