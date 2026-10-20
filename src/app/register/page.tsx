'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    timezone: 'Asia/Kolkata',
    country: 'IN',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            organization_name: formData.organizationName,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.');
        return;
      }

      // 2. If a session is established immediately, provision org and redirect to onboarding
      if (authData.session) {
        try {
          await fetch('/api/v1/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: formData.fullName,
              phone: formData.phone,
              organizationName: formData.organizationName,
              country: formData.country,
              timezone: formData.timezone,
            }),
          });
        } catch (err) {
          console.error('Org initialization error:', err);
        }
        router.push('/onboarding');
        return;
      }

      // If email confirmation is required by Supabase
      setStep('verify');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div className="animated-bg" />
        <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ marginBottom: '0.75rem' }}>Check Your Email</h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            We sent a verification link to <strong>{formData.email}</strong>.
            Click the link to activate your account and set up your clinic.
          </p>
          <Link href="/login?returnUrl=/onboarding" className="btn btn-primary" style={{ display: 'block' }}>
            Sign In to Continue Setup
          </Link>
        </div>
      </div>
    );
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

      <div style={{ width: '100%', maxWidth: '500px', position: 'relative', zIndex: 1 }}>
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
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            Create Your Account
          </h1>
          <p style={{
            color: 'hsl(var(--color-text-muted))',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            Get your AI receptionist live in minutes — free trial, no credit card
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label htmlFor="fullName" className="form-label">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Dr. Priya Sharma"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="form-label">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="organizationName" className="form-label">Clinic / Business Name *</label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleChange}
                className="form-input"
                placeholder="BrightSmile Dental Clinic"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="form-label">Work Email *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="you@clinic.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label htmlFor="reg-password" className="form-label">Password *</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label htmlFor="country" className="form-label">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label htmlFor="timezone" className="form-label">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                  <option value="America/New_York">ET (UTC-5)</option>
                  <option value="America/Los_Angeles">PT (UTC-8)</option>
                  <option value="Europe/London">GMT (UTC+0)</option>
                  <option value="Australia/Sydney">AEST (UTC+10)</option>
                </select>
              </div>
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
              {loading ? '⏳ Creating account...' : '🚀 Create Free Account'}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', textAlign: 'center' }}>
              By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <div className="divider" style={{ margin: '1.5rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'hsl(221, 83%, 70%)', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
