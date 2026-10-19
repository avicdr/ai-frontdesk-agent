// src/lib/supabase/server.ts
// Server-side Supabase client (for API routes and Server Components)
// Uses service-role key for admin operations, or user session for RLS

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for Server Components and API Routes.
 * Reads the session from cookies and respects RLS.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set
            // Middleware handles refreshing sessions
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service-role key.
 * ONLY use this in server-side code where full access is required.
 * Never expose this to the browser.
 */
export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Gets the current authenticated user server-side.
 * Returns null if not authenticated.
 */
export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

import { redirect } from 'next/navigation';

/**
 * Gets the current user with their profile.
 * Throws if not authenticated.
 */
export async function requireServerUser() {
  const user = await getServerUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}

import { isSuperAdminEmail } from '@/lib/security/admin';

/**
 * Ensures user is authenticated and is a platform super-admin.
 * Auto-provisions and maintains admin profile, redirects gracefully if unauthorized.
 */
export async function requireSuperAdmin() {
  const user = await getServerUser();
  if (!user) {
    redirect('/login?returnUrl=/admin');
  }

  const admin = createSupabaseAdminClient();
  const isSuperAdminByEmail = isSuperAdminEmail(user.email);

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, full_name, phone, avatar_url, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_super_admin && !isSuperAdminByEmail) {
    redirect('/dashboard');
  }

  let finalProfile = profile;
  if (!finalProfile || !finalProfile.is_super_admin) {
    const { data: upserted } = await admin
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Platform Super Admin',
        phone: profile?.phone || user.user_metadata?.phone || '+91 99999 99999',
        avatar_url: profile?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        is_super_admin: true,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .maybeSingle();

    finalProfile = upserted ?? {
      id: user.id,
      full_name: profile?.full_name || user.user_metadata?.full_name || 'Platform Super Admin',
      phone: profile?.phone || '+91 99999 99999',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
      is_super_admin: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return { user, profile: finalProfile, admin };
}
