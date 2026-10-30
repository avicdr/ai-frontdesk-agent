import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingFooter } from '@/components/navigation/LandingFooter';
import { ContactFormClient } from './ContactFormClient';
import { createPageMetadata } from '@/lib/seo/metadata';
import { JsonLd, getContactPageSchema, getBreadcrumbSchema } from '@/lib/seo/json-ld';

export const metadata: Metadata = createPageMetadata({
  title: 'Contact Support & Clinic Enquiries | Arenova Frontdesk',
  description:
    'Get in touch with Arenova Frontdesk. Contact our clinic support team for software questions, demonstrations, subscription assistance, or technical help.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-obsidian)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
      <JsonLd
        schema={[
          getContactPageSchema(),
          getBreadcrumbSchema([{ name: 'Contact Support', path: '/contact' }]),
        ]}
      />
      <LandingNavbar />

      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: 'clamp(6.5rem, 11vw, 8.5rem) clamp(1rem, 5vw, 3rem) 4rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.32rem 0.95rem',
              borderRadius: '9999px',
              background: 'rgba(232, 75, 44, 0.12)',
              border: '1px solid rgba(232, 75, 44, 0.3)',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-amber)',
              marginBottom: '1rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)' }} />
            Clinic Support &amp; Customer Care
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              marginBottom: '1rem',
              color: 'var(--color-text-primary)',
            }}
          >
            We&apos;re Here to Support <br />
            <span className="text-gradient-flame">Your Clinic&apos;s Success</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Have a question about deploying Arenova in your dental practice or clinic? Our support team is available to assist with software onboarding, subscription billing, and technical integration.
          </p>
        </div>

        {/* 2-Column Contact Section: Info Cards (Left) + Form (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Left Column: Direct Contact Methods */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Support Email Card */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'rgba(232, 75, 44, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  ✉️
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    Clinic Support Email
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Primary response channel
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: '0 0 0.75rem 0' }}>
                For technical assistance, WhatsApp reconnects, Google Calendar configuration, and general product questions.
              </p>
              <a
                href="mailto:support@arenova.in"
                style={{
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-amber)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                support@arenova.in
              </a>
            </div>

            {/* Sales & Demonstrations Card */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'rgba(232, 122, 56, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  💼
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    Sales &amp; Demonstrations
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    For multi-doctor clinics &amp; practices
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: '0 0 0.75rem 0' }}>
                Interested in evaluating Arenova for a multi-specialty polyclinic or healthcare network? Request a customized demonstration.
              </p>
              <a
                href="mailto:sales@arenova.in"
                style={{
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-amber)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                sales@arenova.in
              </a>
            </div>

            {/* Business Hours & Operational Details */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'rgba(99, 199, 162, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  🕒
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    Operating Hours &amp; Location
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Indian Standard Time (IST)
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <div><strong>Support Hours:</strong> Monday &ndash; Saturday, 9:00 AM &ndash; 6:00 PM IST</div>
                <div><strong>Standard Response:</strong> Within 24 business hours</div>
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
                  <strong>Operating Location:</strong> Bengaluru, Karnataka, India
                </div>
              </div>
            </div>

            {/* Grievance & Compliance Redressal Card */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '14px',
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Grievance Redressal &amp; Data Protection Officer
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 0.5rem 0' }}>
                Under the Information Technology Act and the Digital Personal Data Protection Act (2023), for privacy queries or payment discrepancies, contact our Grievance Officer:
              </p>
              <a
                href="mailto:grievance@arenova.in"
                style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', textDecoration: 'none' }}
              >
                grievance@arenova.in
              </a>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div>
            <ContactFormClient />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
