'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      if (paramTarget && paramTarget !== '/dashboard' && paramTarget !== '/login') {
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 3vw, 2rem)',
      position: 'relative',
    }}>
      <div className="animated-bg" />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
            }}>🤖</div>
            <span style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: '1.2rem',
              letterSpacing: '-0.02em',
              color: 'hsl(var(--color-text-primary))',
            }}>AI Front Desk</span>
          </Link>
        </div>

        <div className="card" style={{ padding: 'clamp(1.25rem, 4vw, 2.25rem)' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            Welcome back
          </h1>
          <p style={{
            color: 'hsl(var(--color-text-muted))',
            fontSize: '0.875rem',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            Sign in to your clinic dashboard
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@clinic.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="form-label">Password</label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: '0.75rem', color: 'hsl(221, 83%, 70%)', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'hsla(0, 84%, 60%, 0.1)',
                border: '1px solid hsla(0, 84%, 60%, 0.3)',
                borderRadius: '8px',
                color: 'hsl(0, 84%, 70%)',
                fontSize: '0.875rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '1.5rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'hsl(221, 83%, 70%)', textDecoration: 'none', fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
