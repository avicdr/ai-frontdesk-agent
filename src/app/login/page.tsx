'use client';

// src/app/login/page.tsx
// Cinematic Obsidian × Phoenix Ember Login Console

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
      backgroundColor: 'var(--color-obsidian)',
      color: 'var(--color-text-primary)',
      position: 'relative',
    }}>
      {/* Top Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 30 }}>
        <ThemeToggle size="sm" showLabel />
      </div>

      {/* Editorial Obsidian Brand Panel (Desktop) */}
      <div
        className="hide-on-mobile"
        style={{
          width: '42%',
          maxWidth: '560px',
          background: 'var(--color-charcoal)',
          borderRight: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(2.5rem, 5vw, 4rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Warm Ambient Ember Glow */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(ellipse at center, rgba(232, 75, 44, 0.16), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(ellipse at center, rgba(200, 105, 56, 0.10), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top Logo */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'inherit',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Image
            src="/arenova.png"
            alt="Arenova"
            width={38}
            height={38}
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
            priority
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
          }}>
            AI Front Desk
          </span>
        </Link>

        {/* Center Quote / Editorial Section */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '380px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.3)',
            color: 'var(--color-amber)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)', boxShadow: '0 0 8px var(--color-flame)', display: 'inline-block' }} />
            Autonomous Clinic Operations
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)',
            fontWeight: 500,
            lineHeight: 1.2,
            color: 'var(--color-text-primary)',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}>
            Your clinic&apos;s front desk, always one step ahead.
          </h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}>
            Monitor real-time appointment bookings, inspect WhatsApp patient dialogues, and calibrate your clinic&apos;s clinical intelligence.
          </p>
        </div>

        {/* Bottom Metadata */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-muted)',
          position: 'relative',
          zIndex: 1,
        }}>
          <span style={{ color: 'var(--color-success)' }}>✦</span>
          <span>End-to-end encrypted &bull; Google Calendar synced</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Constrained Card Container */}
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
        }}>
          {/* Mobile Brand Header */}
          <div className="show-on-mobile" style={{ textAlign: 'center', marginBottom: '1.75rem', justifyContent: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
              <Image
                src="/arenova.png"
                alt="Arenova"
                width={32}
                height={32}
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: 'var(--color-text-primary)',
                fontWeight: 500,
              }}>
                AI Front Desk
              </span>
            </Link>
          </div>

          {/* Elevated Card */}
          <div className="card" style={{
            padding: 'clamp(1.75rem, 4vw, 2.5rem)',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-hero)',
          }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-amber)',
                marginBottom: '0.4rem',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)', boxShadow: '0 0 6px var(--color-flame)', display: 'inline-block' }} />
                Authorized Clinic Access
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.85rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
                margin: '0 0 0.35rem 0',
              }}>
                Welcome back
              </h1>
              <p style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                margin: 0,
              }}>
                Sign in to manage your clinic reception console
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label htmlFor="email" className="label" style={{ marginBottom: '0.4rem', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="doctor@clinic.com"
                  required
                  autoComplete="email"
                  style={{
                    height: '44px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label htmlFor="password" className="label" style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: '0.78rem', color: 'var(--color-amber)', textDecoration: 'none', fontWeight: 500 }}
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
                  style={{
                    height: '44px',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(232, 75, 44, 0.12)',
                  border: '1px solid rgba(232, 75, 44, 0.35)',
                  borderRadius: '10px',
                  color: 'var(--color-flame)',
                  fontSize: '0.85rem',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '44px',
                  marginTop: '0.35rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  justifyContent: 'center',
                }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In →'}
              </button>
            </form>

            <div className="divider" style={{ margin: '1.75rem 0' }} />

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: 'var(--color-amber)', textDecoration: 'none', fontWeight: 600 }}>
                Start free trial
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
