import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy and Google API Limited Use disclosure for AI Front Desk.',
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF5EE', color: '#201A17' }}>
      <LandingNavbar />

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '6.5rem 1.5rem 5rem 1.5rem', lineHeight: 1.75 }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid #E9DED3', paddingBottom: '1.75rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
            Legal Documentation
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            marginBottom: '0.5rem',
            color: '#201A17',
          }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#756A62', fontSize: '0.9rem' }}>
            Effective Date: October 20, 2024 &bull; Last Updated: October 2026
          </p>
        </div>

        {/* Highlight Alert Box for Google Limited Use Policy */}
        <div style={{
          background: 'rgba(196, 81, 42, 0.05)',
          border: '1px solid rgba(196, 81, 42, 0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#C4512A', margin: 0 }}>
              Google API Services User Data Policy Compliance
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#756A62', margin: 0, lineHeight: 1.6 }}>
            AI Front Desk’s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#C4512A', textDecoration: 'underline', fontWeight: 500 }}
            >
              Google API Services User Data Policy
            </a>
            , including the <strong>Limited Use</strong> requirements.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            1. Introduction
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            Welcome to <strong>AI Front Desk</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We provide an artificial intelligence-driven front desk and appointment coordination platform designed for clinics, medical practices, dentists, therapists, and healthcare providers.
          </p>
          <p style={{ color: '#756A62' }}>
            This Privacy Policy explains how we collect, use, disclose, and protect personal and clinic data when you access our software, connect third-party integrations (including Google Calendar and WhatsApp), and interact with our automated reception service.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            2. Information We Collect
          </h2>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            We collect the following categories of information to provide and maintain our services:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong style={{ color: '#201A17' }}>Clinic & Provider Account Information:</strong> Clinic name, healthcare specialty, doctor/clinician names, physical address, business phone number, timezone, operating hours, service catalog, and treatment pricing.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Patient & Conversation Data:</strong> WhatsApp phone numbers, patient names, requested appointment slots, and appointment inquiry messages processed by the AI receptionist.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Google Account & Calendar Data:</strong> When a clinic connects Google Calendar, we receive OAuth tokens, the clinic doctor&rsquo;s Google email address, calendar identifiers, and event busy/free schedule windows to prevent double-bookings.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Technical & Usage Data:</strong> IP addresses, browser types, session timestamps, and system performance logs to ensure system reliability and security.
            </li>
          </ul>
        </section>

        {/* Section 3 - Google Data Disclosure */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            3. How We Use Google Calendar Data (Google User Data Policy)
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            When a clinic administrator authorizes the Google Calendar integration, AI Front Desk requests the following OAuth 2.0 scopes:
          </p>
          <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #E9DED3', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#201A17' }}>
            &bull; https://www.googleapis.com/auth/calendar.events<br />
            &bull; https://www.googleapis.com/auth/calendar
          </div>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            We strictly limit our access and use of Google Calendar data to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <li>Checking real-time calendar availability and busy intervals to avoid conflicting patient appointments.</li>
            <li>Writing, rescheduling, or removing confirmed patient bookings made through the clinic&rsquo;s WhatsApp channel.</li>
          </ul>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            <strong style={{ color: '#201A17' }}>Specific Protections for Google User Data:</strong>
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>We <strong>NEVER</strong> use Google user data for serving advertisements.</li>
            <li>We <strong>NEVER</strong> sell or transfer Google user data to third-party data brokers or marketing platforms.</li>
            <li>We <strong>NEVER</strong> use Google user data to train generalized AI or foundation machine learning models.</li>
            <li>Humans do not read your calendar event details, except with your express permission in specific troubleshooting situations or when legally required.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            4. Data Storage, Encryption & Security
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            We implement industry-grade technical and organizational safeguards:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong style={{ color: '#201A17' }}>AES-256-GCM Encryption:</strong> Sensitive third-party credentials, including Google OAuth refresh tokens and WhatsApp session keys, are encrypted at rest using AES-256-GCM.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Encryption in Transit:</strong> All communications between patients, clinics, our servers, and third-party APIs are encrypted using TLS 1.3/HTTPS.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Multi-Tenant Isolation:</strong> Patient records and clinic configurations are protected by strict Row-Level Security (RLS) policies preventing cross-organization data access.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            5. Data Retention & Revocation of Access
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            We retain information only as long as necessary to provide the service to your clinic:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong style={{ color: '#201A17' }}>Disconnecting Google Calendar:</strong> You can disconnect Google Calendar anytime directly from the <em>Dashboard &gt; Clinic Integrations</em> tab. Upon disconnection, stored tokens are permanently deleted from our database.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Google Account Permissions:</strong> You can also revoke our app&rsquo;s access anytime by visiting your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#C4512A', textDecoration: 'underline' }}
              >
                Google Account Security Settings
              </a>.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Account Deletion:</strong> Clinic administrators can request complete deletion of their account, appointments, and knowledge bases by contacting our support team.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            6. Third-Party Service Providers
          </h2>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            We integrate with trusted third-party cloud infrastructure to deliver our product:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong style={{ color: '#201A17' }}>Supabase:</strong> Encrypted PostgreSQL database hosting and authentication.</li>
            <li><strong style={{ color: '#201A17' }}>Google Gemini / OpenAI:</strong> Natural language processing for understanding appointment requests and generating receptionist responses.</li>
            <li><strong style={{ color: '#201A17' }}>Meta / WhatsApp:</strong> Message delivery to patient WhatsApp chats.</li>
            <li><strong style={{ color: '#201A17' }}>Google Calendar API:</strong> Doctor schedule synchronization.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            7. Contact Us
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            If you have questions about this Privacy Policy, your clinic&rsquo;s data, or our compliance with Google API policies, please reach out:
          </p>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid #E9DED3',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#201A17' }}>AI Front Desk Privacy & Security Team</p>
            <p style={{ margin: '0 0 0.25rem 0', color: '#756A62' }}>
              Email:{' '}
              <a href="mailto:privacy@aifrontdesk.com" style={{ color: '#C4512A', textDecoration: 'none', fontWeight: 500 }}>
                privacy@aifrontdesk.com
              </a>
            </p>
            <p style={{ margin: 0, color: '#756A62' }}>
              Support:{' '}
              <a href="mailto:support@aifrontdesk.com" style={{ color: '#C4512A', textDecoration: 'none', fontWeight: 500 }}>
                support@aifrontdesk.com
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2.5rem 2rem',
        borderTop: '1px solid #E9DED3',
        background: '#201A17',
        textAlign: 'center',
        color: 'rgba(255, 252, 247, 0.5)',
        fontSize: '0.85rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: '#F07843', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/tos" style={{ color: 'rgba(255, 252, 247, 0.7)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/" style={{ color: 'rgba(255, 252, 247, 0.7)', textDecoration: 'none' }}>Home</Link>
          <Link href="/dashboard" style={{ color: 'rgba(255, 252, 247, 0.7)', textDecoration: 'none' }}>Dashboard</Link>
        </div>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} AI Front Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
