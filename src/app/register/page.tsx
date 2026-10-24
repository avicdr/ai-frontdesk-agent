'use client';

// src/app/register/page.tsx
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#111110] text-[#F3F0E8] relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(232,75,44,0.12),transparent_70%)] pointer-events-none" />
        <div className="card max-w-md w-full p-8 text-center bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E84B2C] to-[#C86938] flex items-center justify-center text-2xl text-[#F3F0E8] mx-auto mb-4 shadow-[0_0_20px_rgba(232,75,44,0.35)]">
            ✦
          </div>
          <h2 className="font-heading text-2xl font-semibold text-[#F3F0E8] mb-2">
            Verify Your Email
          </h2>
          <p className="text-xs text-[#9E9B93] mb-6 leading-relaxed">
            We sent an activation link to <strong className="text-[#F3F0E8] font-mono">{formData.email}</strong>.
            Click the link to activate your account and configure your clinic AI receptionist.
          </p>
          <Link
            href="/login?returnUrl=/onboarding"
            className="btn btn-primary w-full py-2.5 text-xs font-semibold"
          >
            Sign In to Continue Setup →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 bg-[#111110] text-[#F3F0E8] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(232,75,44,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(ellipse_at_bottom_left,rgba(200,105,56,0.1),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10" style={{ width: '100%', maxWidth: '520px', margin: '0 auto' }}>
        {/* Brand Logo Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 text-decoration-none group">
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={34}
              height={34}
              className="w-9 h-9 rounded-xl object-contain border border-[#F3F0E8]/12 shadow-[0_0_15px_rgba(232,75,44,0.25)] transition-transform group-hover:scale-105"
              priority
            />
            <span className="font-heading text-lg font-semibold tracking-tight text-[#F3F0E8]">
              AI Front Desk
            </span>
          </Link>
        </div>

        <div className="card p-8 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.7)] animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E84B2C]/10 border border-[#E84B2C]/30 text-[#E87A38] text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
              3-Day Free Operational Trial
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F3F0E8]">
              Create Your Clinic Account
            </h1>
            <p className="text-xs text-[#9E9B93] mt-1">
              Deploy your 24/7 autonomous receptionist in minutes — zero upfront card needed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="fullName" className="label text-xs">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input text-xs"
                  placeholder="Dr. Priya Sharma"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="label text-xs">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input text-xs font-mono"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="organizationName" className="label text-xs">Clinic / Practice Name *</label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={handleChange}
                className="input text-xs"
                placeholder="BrightSmile Dental Clinic"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="label text-xs">Practice Email *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="input text-xs"
                placeholder="doctor@clinic.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="label text-xs">Password *</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input text-xs"
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="label text-xs">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input text-xs"
                  placeholder="Repeat password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="country" className="label text-xs">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="input text-xs"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label htmlFor="timezone" className="label text-xs">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="input text-xs font-mono"
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
              <div className="p-3 rounded-xl bg-[#E84B2C]/10 border border-[#E84B2C]/30 text-[#E84B2C] text-xs leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-xs font-semibold mt-2"
              disabled={loading}
            >
              {loading ? 'Creating Clinic Workspace...' : 'Create Free Account'}
            </button>

            <p className="text-[11px] text-[#9E9B93] text-center leading-relaxed mt-2">
              By registering, you agree to our{' '}
              <Link href="/tos" className="text-[#E87A38] underline hover:text-[#E84B2C]">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#E87A38] underline hover:text-[#E84B2C]">Privacy Policy</Link>.
            </p>
          </form>

          <div className="my-5 border-t border-[#F3F0E8]/08" />

          <p className="text-center text-xs text-[#9E9B93]">
            Already have an active account?{' '}
            <Link href="/login" className="text-[#E87A38] hover:text-[#E84B2C] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
