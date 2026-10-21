// src/app/api/v1/admin/campaigns/[id]/actions/route.ts
// Super Admin endpoint to trigger campaign execution: start, pause, reset, or test_send

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import {
  getCampaign,
  startCampaignRunner,
  pauseCampaignRunner,
  resetLeadStatus,
  resolveTemplate,
} from '@/lib/campaigns/campaign-service';
import { sendBaileysTextMessage } from '@/lib/whatsapp/baileys-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function verifySuperAdmin() {
  const user = await requireServerUser();
  const admin = createSupabaseAdminClient();

  const isSuperAdminByEmail = isSuperAdminEmail(user.email);
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_super_admin && !isSuperAdminByEmail) {
    throw new Error('FORBIDDEN');
  }

  return { user, admin };
}

const ActionSchema = z.object({
  action: z.enum(['start', 'pause', 'reset', 'test_send']),
  testPhone: z.string().optional(),
  testName: z.string().optional(),
  testClinicName: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifySuperAdmin();
    const { id: campaignId } = await params;

    const { campaign } = getCampaign(campaignId);
    if (!campaign) {
      return Errors.notFound('Campaign not found');
    }

    const body = await request.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const { action, testPhone, testName, testClinicName } = parsed.data;

    if (action === 'start') {
      const result = await startCampaignRunner(campaignId, async (orgId, toPhone, text) => {
        return sendBaileysTextMessage(orgId, toPhone, text);
      });
      return successResponse(result);
    }

    if (action === 'pause') {
      const result = pauseCampaignRunner(campaignId);
      return successResponse(result);
    }

    if (action === 'reset') {
      resetLeadStatus(campaignId);
      return successResponse({ message: 'All leads reset to pending status' });
    }

    if (action === 'test_send') {
      if (!testPhone) {
        return Errors.badRequest('testPhone is required for test_send');
      }

      const mockLead = {
        id: 'test',
        campaignId,
        name: testName || 'Dr. Test',
        clinicName: testClinicName || 'Test Dental Clinic',
        phone: testPhone,
        status: 'pending' as const,
        qualificationStatus: 'pending' as const,
        sentAt: null,
        repliedAt: null,
        responseTimeSeconds: null,
        outreachMessage: null,
        replyText: null,
        aiNotes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const resolvedText = resolveTemplate(campaign.messageTemplate, mockLead);
      const res = await sendBaileysTextMessage(campaign.organizationId, testPhone, resolvedText);

      if (!res.success) {
        return Errors.badRequest(res.error || 'Failed to dispatch test WhatsApp message');
      }

      return successResponse({
        message: `Test message dispatched successfully to ${testPhone}`,
        sentText: resolvedText,
        messageId: res.messageId,
      });
    }

    return Errors.badRequest('Invalid action');
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to execute campaign action');
  }
}
