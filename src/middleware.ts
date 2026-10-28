// src/middleware.ts
// Next.js middleware for session refresh and auth-based routing

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSafeRedirectUrl } from '@/lib/url';
import { isSuperAdminEmail } from '@/lib/security/admin';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/onboarding', '/admin'];
// Routes accessible only when NOT authenticated
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
// Admin-only routes
const ADMIN_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // API endpoints independently enforce authentication, authorization, and RLS
  // in their respective route handlers (via requireServerUser() / requireSuperAdmin())
  // and return typed JSON 401s rather than HTML page redirects.
  // Skipping the remote Supabase Auth network call in middleware eliminates 200ms–500ms of latency
  // on every API request.
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Refresh session if expired — IMPORTANT for SSR page navigations
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  if (isProtected && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth routes
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));
  if (isAuthRoute && user) {
    const isSuperAdmin = isSuperAdminEmail(user.email);
    const redirectParam = request.nextUrl.searchParams.get('returnUrl') || request.nextUrl.searchParams.get('redirectTo');
    
    if (redirectParam && redirectParam !== '/login' && redirectParam !== '/dashboard') {
      return NextResponse.redirect(getSafeRedirectUrl(redirectParam, request));
    }
    
    return NextResponse.redirect(getSafeRedirectUrl(isSuperAdmin ? '/admin' : '/dashboard', request));
  }

  // Admin route protection (additional check via API)
  // Full super-admin check happens in the API route / page itself
  // Middleware just checks basic auth here

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/v1/webhooks (webhooks must not require session cookies)
     * - api/health (keep-alive pings must respond with minimal overhead)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/v1/webhooks|api/health).*)',
  ],
};
