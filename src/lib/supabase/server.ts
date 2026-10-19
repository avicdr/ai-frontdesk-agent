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
