// src/app/api/v1/admin/campaigns/[id]/leads/route.ts
// Super Admin endpoint to add leads (single or bulk text/CSV) to a campaign

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { addLeadsToCampaign, parseLeadsText, getCampaign } from '@/lib/campaigns/campaign-service';
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

const AddLeadsSchema = z.object({
  rawText: z.string().optional(),
  leads: z.array(z.object({
    phone: z.string().min(5),
    name: z.string().optional(),
    clinicName: z.string().optional(),
  })).optional(),
}).refine(data => Boolean(data.rawText || (data.leads && data.leads.length > 0)), {
  message: 'Either rawText or leads array must be provided',
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
    const parsed = AddLeadsSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.validationError(parsed.error.flatten());
    }

    let leadsToInsert: Array<{ phone: string; name?: string; clinicName?: string }> = [];

    if (parsed.data.rawText) {
      leadsToInsert = parseLeadsText(parsed.data.rawText);
    } else if (parsed.data.leads) {
      leadsToInsert = parsed.data.leads;
    }

    if (leadsToInsert.length === 0) {
      return Errors.badRequest('No valid leads found to import');
    }

    const result = addLeadsToCampaign(campaignId, leadsToInsert);

    return successResponse({
      message: `Successfully imported ${result.added} lead(s). (${result.skippedDuplicates} duplicates skipped)`,
      stats: result,
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to add leads');
  }
}
