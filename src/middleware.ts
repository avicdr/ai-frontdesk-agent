// src/middleware.ts
// Next.js middleware for session refresh and auth-based routing

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // Refresh session if expired — IMPORTANT for SSR
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

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
    const isSuperAdminEmail = user.email?.toLowerCase().trim() === 'admin@aifrontdesk.com';
    const redirectParam = request.nextUrl.searchParams.get('returnUrl') || request.nextUrl.searchParams.get('redirectTo');
    
    if (redirectParam && redirectParam !== '/login' && redirectParam !== '/dashboard') {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    
    return NextResponse.redirect(new URL(isSuperAdminEmail ? '/admin' : '/dashboard', request.url));
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
