'use client';

// src/app/login/page.tsx
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Check if logging in as super-admin
      const isAdminEmail = email.toLowerCase().trim() === 'admin@aifrontdesk.com';
      let isSuperAdmin = isAdminEmail;

      if (!isSuperAdmin && authData?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_super_admin')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profile?.is_super_admin) {
          isSuperAdmin = true;
        }
      }

      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramTarget = params?.get('returnUrl') || params?.get('redirectTo');

      let targetUrl = isSuperAdmin ? '/admin' : '/dashboard';

      if (!isSuperAdmin && authData?.user) {
        try {
          const onbRes = await fetch('/api/v1/onboarding');
          const onbJson = await onbRes.json();
          if (!onbJson?.data || onbJson.data.status !== 'completed') {
            targetUrl = '/onboarding';
          } else if (paramTarget && paramTarget !== '/dashboard' && paramTarget !== '/login') {
            targetUrl = paramTarget;
          }
        } catch {
          targetUrl = '/onboarding';
        }
      } else if (paramTarget && paramTarget !== '/dashboard' && paramTarget !== '/login') {
        targetUrl = paramTarget;
      }

      router.push(targetUrl);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#111110] text-[#F3F0E8] relative overflow-hidden">
      {/* Editorial Obsidian & Ember Brand Panel (Desktop) */}
      <div className="hidden lg:flex w-5/12 bg-[#0D0D0C] border-r border-[#F3F0E8]/08 flex-col justify-between p-12 relative overflow-hidden">
        {/* Warm Ambient Ember Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(232,75,44,0.18),transparent_70%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(ellipse_at_bottom_left,rgba(200,105,56,0.12),transparent_70%)] pointer-events-none" />

        {/* Top Logo */}
        <Link href="/" className="inline-flex items-center gap-3 text-decoration-none text-[#F3F0E8] relative z-10 group">
          <Image
            src="/arenova.png"
            alt="Arenova AI Front Desk"
            width={36}
            height={36}
            className="w-9 h-9 rounded-xl object-contain border border-[#F3F0E8]/12 shadow-[0_0_15px_rgba(232,75,44,0.25)] transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <span className="font-heading text-lg font-semibold tracking-tight">AI Front Desk</span>
        </Link>

        {/* Center Quote / Editorial Section */}
        <div className="relative z-10 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E84B2C]/10 border border-[#E84B2C]/30 text-[#E87A38] text-[11px] font-mono uppercase tracking-widest font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            Always Vigilant
          </div>
          <h2 className="font-heading text-3xl font-semibold leading-tight text-[#F3F0E8] mb-4">
            Your clinic&apos;s front desk, always one step ahead.
          </h2>
          <p className="text-sm text-[#9E9B93] leading-relaxed">
            Monitor real-time appointment bookings, audit patient WhatsApp dialogues, and configure your clinic&apos;s clinical intelligence.
          </p>
        </div>

        {/* Bottom Metadata */}
        <div className="flex items-center gap-2.5 text-xs font-mono text-[#9E9B93] relative z-10">
          <span className="text-[#63C7A2]">✦</span>
          <span>End-to-end encrypted • Google Calendar synced</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 text-decoration-none">
              <Image
                src="/arenova.png"
                alt="Arenova"
                width={32}
                height={32}
                className="w-8 h-8 rounded-xl object-contain border border-[#F3F0E8]/12"
              />
              <span className="font-heading text-lg font-semibold text-[#F3F0E8]">AI Front Desk</span>
            </Link>
          </div>

          <div className="card p-8 bg-[#171614] border border-[#F3F0E8]/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden animate-fade-in">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E87A38]">
                  Authorized Access
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F3F0E8]">
                Welcome back
              </h1>
              <p className="text-xs text-[#9E9B93] mt-1">
                Sign in to manage your clinic reception intelligence
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label text-xs">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input text-xs"
                  placeholder="doctor@clinic.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="label text-xs">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-mono text-[#E87A38] hover:text-[#E84B2C] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input text-xs"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#E84B2C]/10 border border-[#E84B2C]/30 text-[#E84B2C] text-xs leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full py-2.5 text-xs font-semibold mt-2"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="my-6 border-t border-[#F3F0E8]/08" />

            <p className="text-center text-xs text-[#9E9B93]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#E87A38] hover:text-[#E84B2C] font-semibold transition-colors">
                Start 3-day free trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
