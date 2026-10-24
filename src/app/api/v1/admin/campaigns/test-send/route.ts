// src/app/api/v1/admin/campaigns/test-send/route.ts
// Direct endpoint for admin campaign test messages

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { sendBaileysTextMessage } from '@/lib/whatsapp/baileys-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const TestSendSchema = z.object({
  phone: z.string().min(7),
  message: z.string().min(1),
  organizationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    const isSuperAdminByEmail = isSuperAdminEmail(user.email);
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_super_admin && !isSuperAdminByEmail) {
      return Errors.forbidden('Super Admin privilege required');
    }

    const body = await request.json();
    const parsed = TestSendSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { phone, message, organizationId } = parsed.data;

    let targetOrgId = organizationId;
    if (!targetOrgId) {
      // Pick first active organization
      const { data: firstOrg } = await admin
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      targetOrgId = firstOrg?.id;
    }

    if (!targetOrgId) {
      return Errors.badRequest('No connected clinic organization found to send test WhatsApp message');
    }

    const res = await sendBaileysTextMessage(targetOrgId, phone, message);
    if (!res.success) {
      return Errors.badRequest(res.error || 'Failed to dispatch test WhatsApp message');
    }

    return successResponse({
      message: `Test message dispatched successfully to ${phone}`,
      sentText: message,
      messageId: res.messageId,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    console.error('Error sending test campaign message:', err);
    return Errors.internalError();
  }
}
