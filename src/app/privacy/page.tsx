import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy and Google API Limited Use disclosure for AI Front Desk.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--color-bg))', color: 'hsl(var(--color-text-primary))' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8, 12, 24, 0.85)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>🤖</div>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            AI Front Desk
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '3.5rem 1.5rem 5rem 1.5rem', lineHeight: 1.75 }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '1.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
            Legal Documentation
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem' }}>
            Effective Date: October 20, 2024 &bull; Last Updated: October 2026
          </p>
        </div>

        {/* Highlight Alert Box for Google Limited Use Policy */}
        <div style={{
          background: 'hsla(221, 83%, 58%, 0.1)',
          border: '1px solid hsla(221, 83%, 58%, 0.3)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#93c5fd', margin: 0 }}>
              Google API Services User Data Policy Compliance
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))', margin: 0 }}>
            AI Front Desk’s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline' }}
            >
              Google API Services User Data Policy
            </a>
            , including the <strong>Limited Use</strong> requirements.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            1. Introduction
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            Welcome to <strong>AI Front Desk</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We provide an artificial intelligence-driven front desk and appointment coordination platform designed for clinics, medical practices, dentists, therapists, and healthcare providers.
          </p>
          <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
            This Privacy Policy explains how we collect, use, disclose, and protect personal and clinic data when you access our software, connect third-party integrations (including Google Calendar and WhatsApp), and interact with our automated reception service.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            2. Information We Collect
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            We collect the following categories of information to provide and maintain our services:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Clinic & Provider Account Information:</strong> Clinic name, healthcare specialty, doctor/clinician names, physical address, business phone number, timezone, operating hours, service catalog, and treatment pricing.
            </li>
            <li>
              <strong>Patient & Conversation Data:</strong> WhatsApp phone numbers, patient names, requested appointment slots, and appointment inquiry messages processed by the AI receptionist.
            </li>
            <li>
              <strong>Google Account & Calendar Data:</strong> When a clinic connects Google Calendar, we receive OAuth tokens, the clinic doctor&rsquo;s Google email address, calendar identifiers, and event busy/free schedule windows to prevent double-bookings.
            </li>
            <li>
              <strong>Technical & Usage Data:</strong> IP addresses, browser types, session timestamps, and system performance logs to ensure system reliability and security.
            </li>
          </ul>
        </section>

        {/* Section 3 - Google Data Disclosure */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            3. How We Use Google Calendar Data (Google User Data Policy)
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            When a clinic administrator authorizes the Google Calendar integration, AI Front Desk requests the following OAuth 2.0 scopes:
          </p>
          <div style={{ background: 'hsl(var(--color-surface))', padding: '1rem', borderRadius: '10px', border: '1px solid hsl(var(--color-border))', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            &bull; https://www.googleapis.com/auth/calendar.events<br />
            &bull; https://www.googleapis.com/auth/calendar
          </div>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            We strictly limit our access and use of Google Calendar data to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <li>Checking real-time calendar availability and busy intervals to avoid conflicting patient appointments.</li>
            <li>Writing, rescheduling, or removing confirmed patient bookings made through the clinic&rsquo;s WhatsApp channel.</li>
          </ul>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            <strong>Specific Protections for Google User Data:</strong>
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>We <strong>NEVER</strong> use Google user data for serving advertisements.</li>
            <li>We <strong>NEVER</strong> sell or transfer Google user data to third-party data brokers or marketing platforms.</li>
            <li>We <strong>NEVER</strong> use Google user data to train generalized AI or foundation machine learning models.</li>
            <li>Humans do not read your calendar event details, except with your express permission in specific troubleshooting situations or when legally required.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            4. Data Storage, Encryption & Security
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            We implement industry-grade technical and organizational safeguards:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>AES-256-GCM Encryption:</strong> Sensitive third-party credentials, including Google OAuth refresh tokens and WhatsApp session keys, are encrypted at rest using AES-256-GCM.
            </li>
            <li>
              <strong>Encryption in Transit:</strong> All communications between patients, clinics, our servers, and third-party APIs are encrypted using TLS 1.3/HTTPS.
            </li>
            <li>
              <strong>Multi-Tenant Isolation:</strong> Patient records and clinic configurations are protected by strict Row-Level Security (RLS) policies preventing cross-organization data access.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            5. Data Retention & Revocation of Access
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            We retain information only as long as necessary to provide the service to your clinic:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Disconnecting Google Calendar:</strong> You can disconnect Google Calendar anytime directly from the <em>Dashboard &gt; Clinic Integrations</em> tab. Upon disconnection, stored tokens are permanently deleted from our database.
            </li>
            <li>
              <strong>Google Account Permissions:</strong> You can also revoke our app&rsquo;s access anytime by visiting your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#60a5fa', textDecoration: 'underline' }}
              >
                Google Account Security Settings
              </a>.
            </li>
            <li>
              <strong>Account Deletion:</strong> Clinic administrators can request complete deletion of their account, appointments, and knowledge bases by contacting our support team.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            6. Third-Party Service Providers
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            We integrate with trusted third-party cloud infrastructure to deliver our product:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Supabase:</strong> Encrypted PostgreSQL database hosting and authentication.</li>
            <li><strong>Google Gemini / OpenAI:</strong> Natural language processing for understanding appointment requests and generating receptionist responses.</li>
            <li><strong>Meta / WhatsApp:</strong> Message delivery to patient WhatsApp chats.</li>
            <li><strong>Google Calendar API:</strong> Doctor schedule synchronization.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            7. Contact Us
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            If you have questions about this Privacy Policy, your clinic&rsquo;s data, or our compliance with Google API policies, please reach out:
          </p>
          <div style={{
            background: 'hsl(var(--color-surface))',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid hsl(var(--color-border))',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>AI Front Desk Privacy & Security Team</p>
            <p style={{ margin: '0 0 0.25rem 0', color: 'hsl(var(--color-text-secondary))' }}>
              Email:{' '}
              <a href="mailto:privacy@aifrontdesk.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                privacy@aifrontdesk.com
              </a>
            </p>
            <p style={{ margin: 0, color: 'hsl(var(--color-text-secondary))' }}>
              Support:{' '}
              <a href="mailto:support@aifrontdesk.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                support@aifrontdesk.com
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2.5rem 2rem',
        borderTop: '1px solid hsl(var(--color-border))',
        textAlign: 'center',
        color: 'hsl(var(--color-text-muted))',
        fontSize: '0.85rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <Link href="/privacy" style={{ color: '#93c5fd', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/tos" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Home</Link>
          <Link href="/dashboard" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Dashboard</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} AI Front Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
