import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-charcoal)',
        color: 'var(--color-text-muted)',
        fontSize: '0.825rem',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Upper Main Footer Grid */}
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: 'clamp(3rem, 6vw, 4.5rem) clamp(1.25rem, 5vw, 3rem) 2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
        }}
      >
        {/* Column 1: Brand & Business Statement */}
        <div style={{ gridColumn: 'span 1' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'inherit',
              marginBottom: '1rem',
            }}
          >
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={34}
              height={34}
              style={{
                width: '34px',
                height: '34px',
                objectFit: 'contain',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                color: 'var(--color-text-primary)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              Arenova
            </span>
          </Link>

          <p
            style={{
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginBottom: '1.25rem',
            }}
          >
            AI WhatsApp Receptionist Software engineered for clinics, dental practices, and healthcare offices. Automate routine patient enquiries, share practice info, and streamline appointment requests.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(232, 75, 44, 0.1)',
              border: '1px solid rgba(232, 75, 44, 0.25)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-amber)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)' }} />
            B2B SaaS • Made for Indian Healthcare Practices
          </div>
        </div>

        {/* Column 2: Software & Product */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
            }}
          >
            Software Capabilities
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <Link href="/#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                WhatsApp AI Receptionist
              </Link>
            </li>
            <li>
              <Link href="/#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Enquiry Management
              </Link>
            </li>
            <li>
              <Link href="/#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Appointment Request Assistance
              </Link>
            </li>
            <li>
              <Link href="/#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Google Calendar 2-Way Sync
              </Link>
            </li>
            <li>
              <Link href="/#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Human Staff Takeover Inbox
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                How It Works
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Subscription & Support */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
            }}
          >
            Subscription &amp; Support
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <Link href="/pricing" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Pricing Plans (INR)
              </Link>
            </li>
            <li>
              <Link href="/contact" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Contact Support
              </Link>
            </li>
            <li>
              <Link href="/login" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Clinic Sign In
              </Link>
            </li>
            <li>
              <Link href="/register" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Start Free Trial
              </Link>
            </li>
            <li>
              <a
                href="mailto:support@arenova.in"
                style={{ color: 'var(--color-amber)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
              >
                support@arenova.in
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Compliance & Legal */}
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-primary)',
              marginBottom: '1rem',
            }}
          >
            Trust &amp; Legal Policies
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <li>
              <Link href="/terms-of-service" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Refund &amp; Cancellation Policy
              </Link>
            </li>
            <li>
              <Link href="/contact" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                Grievance Officer
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Critical Statutory & Business Model Disclaimer Banner */}
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 clamp(1.25rem, 5vw, 3rem) 2rem',
        }}
      >
        <div
          style={{
            padding: '1.15rem 1.35rem',
            borderRadius: '12px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'var(--color-text-muted)',
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.35rem' }}>
            Important Business Model &amp; Healthcare Software Disclaimer:
          </strong>
          Arenova is an independent B2B Software-as-a-Service (SaaS) provider. Our platform equips subscribing healthcare practices, dental clinics, and medical practitioners with an automated AI receptionist for patient communication and administrative workflow assistance via WhatsApp. Arenova is <strong>not</strong> a clinic, hospital, diagnostic center, or licensed medical provider. Arenova does <strong>not</strong> employ doctors, provide medical consultations, provide medical diagnoses, prescribe treatments, or operate an open doctor-booking marketplace. All medical advice, patient consultations, and clinical services are rendered independently by the licensed clinics subscribing to our software. Subscription fees paid to Arenova cover software licensing, onboarding, and AI receptionist platform access only; they do not include payments for medical consultations or doctor services.
        </div>
      </div>

      {/* Bottom Copyright & Badges */}
      <div
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          padding: '1.5rem clamp(1.25rem, 5vw, 3rem)',
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
        }}
      >
        <div>
          &copy; {currentYear} Arenova (Arenova Technologies). All rights reserved.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span>Indian DPDP Act (2023) Aligned</span>
          <span>&bull;</span>
          <span>Google Calendar API Limited Use Compliant</span>
          <span>&bull;</span>
          <span>B2B SaaS Subscription Model</span>
        </div>
      </div>
    </footer>
  );
}
