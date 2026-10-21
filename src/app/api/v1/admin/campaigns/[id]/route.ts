// src/app/api/v1/admin/campaigns/[id]/route.ts
// Super Admin endpoint to get, update, or delete a single campaign

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { getCampaign, updateCampaign, deleteCampaign } from '@/lib/campaigns/campaign-service';
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

const UpdateCampaignSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  organizationId: z.string().optional(),
  senderPhone: z.string().optional(),
  messageTemplate: z.string().min(5).max(1000).optional(),
  responseThresholdSeconds: z.number().int().min(5).max(3600).optional(),
  delaySeconds: z.number().int().min(2).max(60).optional(),
  status: z.enum(['draft', 'running', 'paused', 'completed']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifySuperAdmin();
    const { id } = await params;

    const { campaign, leads } = getCampaign(id);
    if (!campaign) {
      return Errors.notFound('Campaign not found');
    }

    return successResponse({
      campaign,
      leads,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to fetch campaign');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifySuperAdmin();
    const { id } = await params;

    const body = await request.json();
    const parsed = UpdateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    const updated = updateCampaign(id, parsed.data);
    if (!updated) {
      return Errors.notFound('Campaign not found');
    }

    return successResponse({
      message: 'Campaign updated successfully',
      campaign: updated,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to update campaign');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifySuperAdmin();
    const { id } = await params;

    const deleted = deleteCampaign(id);
    if (!deleted) {
      return Errors.notFound('Campaign not found');
    }

    return successResponse({
      message: 'Campaign deleted successfully',
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to delete campaign');
  }
}
