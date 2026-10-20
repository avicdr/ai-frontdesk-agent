// src/app/api/v1/auth/signout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSafeRedirectUrl } from '@/lib/url';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(getSafeRedirectUrl('/login', request).toString());
}
