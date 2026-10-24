'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
        background: '#FAF5EE',
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: '20px',
          background: '#FFFFFF',
          border: '1px solid #E9DED3',
          boxShadow: '0 8px 30px rgba(32, 26, 23, 0.08)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #C4512A, #9E3D23)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            color: '#FFFFFF',
            fontWeight: 700,
            margin: '0 auto 1.25rem',
          }}>✦</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.65rem',
            fontWeight: 400,
            color: '#201A17',
            marginBottom: '0.75rem',
          }}>
            Check your email
          </h2>
          <p style={{ color: '#756A62', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            We sent a verification link to <strong style={{ color: '#201A17' }}>{formData.email}</strong>.
            Click the link to activate your account and configure your clinic AI front desk.
          </p>
          <Link href="/login?returnUrl=/onboarding" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '0.75rem' }}>
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
      padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)',
      background: '#FAF5EE',
      position: 'relative',
    }}>
      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        {/* Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
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
              fontSize: '1.3rem',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#201A17',
            }}>AI Front Desk</span>
          </Link>
        </div>

        <div style={{
          padding: 'clamp(1.75rem, 4vw, 2.75rem)',
          borderRadius: '20px',
          background: '#FFFFFF',
          border: '1px solid #E9DED3',
          boxShadow: '0 8px 30px rgba(32, 26, 23, 0.07)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.75rem',
            fontWeight: 400,
            marginBottom: '0.4rem',
            textAlign: 'center',
            color: '#201A17',
            letterSpacing: '-0.02em',
          }}>
            Create your account
          </h1>
          <p style={{
            color: '#756A62',
            fontSize: '0.875rem',
            textAlign: 'center',
            marginBottom: '1.75rem',
          }}>
            Get your AI receptionist live in minutes — free trial, no credit card
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label htmlFor="fullName" className="label">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input"
                  placeholder="Dr. Priya Sharma"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="label">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="organizationName" className="label">Clinic / Practice Name *</label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleChange}
                className="input"
                placeholder="BrightSmile Dental Clinic"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Work Email *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="doctor@clinic.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label htmlFor="reg-password" className="label">Password *</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
              <div>
                <label htmlFor="country" className="label">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label htmlFor="timezone" className="label">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="input"
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
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>

            <p style={{ fontSize: '0.75rem', color: '#756A62', textAlign: 'center', lineHeight: 1.5 }}>
              By registering, you agree to our{' '}
              <Link href="/tos" style={{ color: '#C4512A', textDecoration: 'underline' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: '#C4512A', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </form>

          <div className="divider" style={{ margin: '1.5rem 0' }} />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#756A62' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C4512A', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
