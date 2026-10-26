// src/app/api/v1/admin/data/route.ts
// Platform Super-Admin helper endpoint to fetch clinics and plans for quick admin actions

import { NextRequest } from 'next/server';
import { successResponse, Errors } from '@/lib/api/response';
import { requireServerUser, createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { getCachedSubscriptionPlans } from '@/lib/cache/plans';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerUser();
    const admin = createSupabaseAdminClient();

    // Verify user is super-admin
    const isSuperAdminByEmail = isSuperAdminEmail(user.email);
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_super_admin && !isSuperAdminByEmail) {
      return Errors.forbidden('Super-admin privileges required');
    }

    const [orgsRes, plans] = await Promise.all([
      admin
        .from('organizations')
        .select('id, name, slug, status, created_at')
        .order('name', { ascending: true }),
      getCachedSubscriptionPlans(),
    ]);

    return successResponse({
      organizations: orgsRes.data ?? [],
      plans: plans ?? [],
    });
  } catch (err: any) {
    console.error('Admin data fetch error:', err);
    if (err?.message === 'UNAUTHENTICATED') return Errors.unauthorized();
    return Errors.internalError(err?.message || 'Failed to fetch admin data');
  }
}
