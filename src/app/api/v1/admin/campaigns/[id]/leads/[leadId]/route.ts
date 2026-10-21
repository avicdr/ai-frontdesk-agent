// src/app/api/v1/admin/campaigns/[id]/leads/[leadId]/route.ts
// Super Admin endpoint to delete an individual lead from a campaign

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { deleteLead } from '@/lib/campaigns/campaign-service';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; leadId: string }> }
) {
  try {
    await verifySuperAdmin();
    const { leadId } = await params;

    deleteLead(leadId);

    return successResponse({
      message: 'Lead deleted successfully',
    });
  } catch (err: any) {
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    if (err?.message === 'FORBIDDEN') return Errors.forbidden('Super-admin privileges required');
    return Errors.internalError(err?.message || 'Failed to delete lead');
  }
}
