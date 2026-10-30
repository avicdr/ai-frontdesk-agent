// src/lib/security/admin-auth.ts
// Reusable API authorization check for Platform Super-Admin endpoints

import { getServerUser } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { isSuperAdminEmail } from '@/lib/security/admin';
import { Errors } from '@/lib/api/response';
import { NextResponse } from 'next/server';

export async function verifySuperAdminApi(): Promise<{
  authorized: boolean;
  user?: any;
  errorResponse?: NextResponse;
}> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { authorized: false, errorResponse: Errors.unauthorized('Authentication required') };
    }

    const admin = createSupabaseAdminClient();
    const isSuperAdminByEmail = isSuperAdminEmail(user.email);
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_super_admin && !isSuperAdminByEmail) {
      return { authorized: false, errorResponse: Errors.forbidden('Super-admin privileges required') };
    }

    return { authorized: true, user };
  } catch (err: any) {
    console.error('Super-admin API verification error:', err);
    return { authorized: false, errorResponse: Errors.internalError('Failed to verify admin status') };
  }
}

