// src/app/api/v1/admin/campaigns/route.ts
// Super Admin endpoints to list and create WhatsApp outreach campaigns

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { listCampaigns, createCampaign } from '@/lib/campaigns/campaign-service';
import { getConnectedBaileysSessions } from '@/lib/whatsapp/baileys-service';
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

const CreateCampaignSchema = z.object({
  name: z.string().min(2).max(100),
  organizationId: z.string().min(1),
  senderPhone: z.string().optional(),
  messageTemplate: z.string().min(5).max(1000).optional(),
  responseThresholdSeconds: z.number().int().min(5).max(3600).optional(),
  delaySeconds: z.number().int().min(2).max(60).optional(),
});

export async function GET() {
  try {
    await verifySuperAdmin();

    const campaigns = listCampaigns();
    const senders = await getConnectedBaileysSessions();

    return successResponse({
      campaigns,
      senders,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to list campaigns');
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifySuperAdmin();

    const body = await request.json();
    const parsed = CreateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const campaign = createCampaign(parsed.data);

    return successResponse({
      message: 'Campaign created successfully',
      campaign,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to create campaign');
  }
}
