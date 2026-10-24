'use client';

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#FAF5EE',
      position: 'relative',
    }}>
      {/* Left editorial brand panel (desktop) */}
      <div className="hide-on-mobile" style={{
        width: '44%',
        background: 'linear-gradient(155deg, #251B17 0%, #352520 50%, #201A17 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.5rem',
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFCF7',
      }}>
        {/* Warm ambient orange light */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(196, 81, 42, 0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top Logo */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: '#FFFCF7', position: 'relative', zIndex: 1 }}>
          <Image
            src="/arenova.png"
            alt="Arenova"
            width={34}
            height={34}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
            priority
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
          }}>AI Front Desk</span>
        </Link>

        {/* Center quote */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '380px' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(240, 120, 67, 0.15)',
            border: '1px solid rgba(240, 120, 67, 0.3)',
            color: '#F07843',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginBottom: '1.25rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Always Active
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.1rem',
            fontWeight: 400,
            lineHeight: 1.2,
            color: '#FFFCF7',
            marginBottom: '1rem',
          }}>
            Your clinic&apos;s front desk, always one step ahead.
          </h2>
          <p style={{
            color: 'rgba(255, 252, 247, 0.65)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}>
            Sign in to check live appointment requests, monitor WhatsApp conversations, and customize your AI receptionist&apos;s knowledge base.
          </p>
        </div>

        {/* Bottom guarantee */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.78rem',
          color: 'rgba(255, 252, 247, 0.5)',
          position: 'relative',
          zIndex: 1,
        }}>
          <span>🛡️</span>
          <span>End-to-end encrypted &bull; Google Calendar synced</span>
        </div>
      </div>

      {/* Right Form panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile brand header */}
          <div className="show-on-mobile" style={{ textAlign: 'center', marginBottom: '2rem', justifyContent: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
              <Image
                src="/arenova.png"
                alt="Arenova"
                width={32}
                height={32}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: '#201A17',
              }}>AI Front Desk</span>
            </Link>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 400,
              marginBottom: '0.35rem',
              color: '#201A17',
              letterSpacing: '-0.02em',
            }}>
              Welcome back
            </h1>
            <p style={{
              color: '#756A62',
              fontSize: '0.875rem',
            }}>
              Sign in to manage your clinic reception dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label htmlFor="email" className="label" style={{ marginBottom: '0.35rem' }}>Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="doctor@clinic.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label htmlFor="password" className="label">Password</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '0.75rem', color: '#C4512A', textDecoration: 'none', fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: '#FDF2F2',
                border: '1px solid #F8D7D5',
                borderRadius: '10px',
                color: '#9E3D23',
                fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '1.75rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#756A62' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#C4512A', textDecoration: 'none', fontWeight: 600 }}>
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
