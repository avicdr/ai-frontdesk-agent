import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingFooter } from '@/components/navigation/LandingFooter';
import { createPageMetadata } from '@/lib/seo/metadata';
import { JsonLd, getBreadcrumbSchema } from '@/lib/seo/json-ld';

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy | Arenova Frontdesk',
  description:
    'Privacy Policy and Data Protection disclosures for Arenova Frontdesk AI WhatsApp Receptionist software for clinics, aligned with Indian DPDP Act 2023.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 27, 2026';

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-obsidian)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
      <JsonLd
        schema={getBreadcrumbSchema([{ name: 'Privacy Policy', path: '/privacy-policy' }])}
      />
      <LandingNavbar />

      <main style={{ maxWidth: '920px', margin: '0 auto', padding: 'clamp(6.5rem, 11vw, 8.5rem) clamp(1.25rem, 5vw, 2.5rem) 4rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(232, 75, 44, 0.12)',
              border: '1px solid rgba(232, 75, 44, 0.3)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-amber)',
              marginBottom: '0.85rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)' }} />
            Data Protection &amp; Privacy Documentation
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.25rem)',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              marginBottom: '0.5rem',
              color: 'var(--color-text-primary)',
            }}
          >
            Privacy Policy
          </h1>

          <p style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', margin: 0 }}>
            Effective Date: October 20, 2024 &bull; Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Google API Limited Use Highlight Box */}
        <div
          style={{
            padding: '1.35rem 1.5rem',
            borderRadius: '16px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid rgba(232, 75, 44, 0.35)',
            marginBottom: '2.5rem',
            boxShadow: '0 4px 20px rgba(232, 75, 44, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-amber)', margin: 0 }}>
              Google API Services User Data Policy Compliance
            </h2>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Arenova&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-amber)', textDecoration: 'underline' }}
            >
              Google API Services User Data Policy
            </a>
            , including the <strong style={{ color: 'var(--color-text-primary)' }}>Limited Use</strong> requirements. Calendar data accessed via Google Calendar integration is used strictly to prevent double-bookings and coordinate appointment slots for the subscribing clinic; it is never sold, shared with data brokers, or used to train general machine learning models.
          </p>
        </div>

        {/* Privacy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {/* Section 1 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              1. Overview and Scope
            </h2>
            <p>
              Welcome to <strong>Arenova</strong> (&ldquo;Arenova&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). Arenova provides a cloud-based software platform that helps clinics, dental practices, and healthcare offices automate patient communication and reception workflows on WhatsApp.
            </p>
            <p>
              This Privacy Policy explains how we collect, process, store, and safeguard data when clinic administrators use our SaaS console, connect communication channels (such as WhatsApp), authorize calendar synchronization (such as Google Calendar), and deploy an automated front-desk assistant for their practice.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              2. Information We Process
            </h2>
            <p>
              We process data across two distinct categories: (a) Information collected directly from our clinic customers, and (b) Patient communication data processed on behalf of the subscribing clinic.
            </p>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.85rem', marginBottom: '0.35rem' }}>
              A. Clinic Account &amp; Billing Information
            </h3>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Clinic Profile:</strong> Clinic name, healthcare specialty (e.g., dental, dermatology, general practice), physical address, phone numbers, website, timezone, and operating hours.</li>
              <li><strong>Practitioner Data:</strong> Doctor and practitioner names, consultation designations, and schedule availability.</li>
              <li><strong>Procedure Catalog:</strong> Clinical procedures, standard consultation fees, duration estimates, and preparation instructions configured by the clinic.</li>
              <li><strong>Billing &amp; Payment Data:</strong> Clinic billing name, GSTIN (where provided), contact email, and transaction identifiers. Payment gateway processing is conducted securely by our payment partners (Razorpay); Arenova does not store full credit card numbers or banking passwords.</li>
            </ul>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.85rem', marginBottom: '0.35rem' }}>
              B. Patient Information Processed via WhatsApp Front Desk
            </h3>
            <p>
              When a patient initiates a chat with a clinic&apos;s paired WhatsApp number, the automated assistant processes the communication strictly on behalf of that subscribing clinic:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Patient Phone Number &amp; WhatsApp Name:</strong> Provided by WhatsApp to enable conversation routing.</li>
              <li><strong>Appointment Requests:</strong> Requested date, preferred time slot, practitioner requested, and patient full name provided during the booking dialogue.</li>
              <li><strong>Enquiry Content &amp; Conversation Transcripts:</strong> Messages sent by the patient regarding clinic procedures, fees, operational hours, or directions.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              3. Why We Process Information
            </h2>
            <p>
              We process clinic and patient data strictly for legitimate operational purposes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>To provide the AI virtual receptionist service, answer routine patient questions, and quote standard clinic procedure fees.</li>
              <li>To coordinate appointment booking requests and check open slots in the clinic&apos;s connected Google Calendar.</li>
              <li>To synchronize confirmed appointments into the clinic&apos;s calendar, eliminating double-bookings and manual front-desk errors.</li>
              <li>To provide clinic staff with a centralized web inbox to view transcripts and take over patient conversations when manual attention is required.</li>
              <li>To administer clinic subscriptions, process renewals, generate GST tax invoices, and provide customer support.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              4. Third-Party Infrastructure and Sub-Processors
            </h2>
            <p>
              To deliver our cloud SaaS application securely, Arenova integrates with trusted enterprise technology providers:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Supabase / PostgreSQL:</strong> Encrypted database hosting, user authentication, and data storage with Row-Level Security (RLS).</li>
              <li><strong>Google Gemini / OpenAI:</strong> Enterprise natural language processing models used to understand patient inquiries and generate natural receptionist replies according to clinic guidelines.</li>
              <li><strong>Meta / WhatsApp:</strong> Message transmission to deliver automated responses to patient WhatsApp chats.</li>
              <li><strong>Google Calendar API:</strong> Doctor schedule availability synchronization (adhering to Google API Limited Use Policy).</li>
              <li><strong>Razorpay:</strong> Secure payment gateway partner for processing domestic clinic SaaS subscription payments, renewals, and GST receipts.</li>
              <li><strong>Vercel:</strong> Web application hosting, edge infrastructure, and SSL/TLS termination.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              5. How We Protect Your Data
            </h2>
            <p>
              We implement comprehensive technical and organizational security measures:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Encryption in Transit:</strong> All data transmitted between browsers, WhatsApp webhooks, our servers, and third-party APIs is encrypted using TLS 1.3 / HTTPS.</li>
              <li><strong>Encryption at Rest:</strong> Sensitive integration credentials, including OAuth tokens and WhatsApp session credentials, are encrypted at rest using AES-256-GCM.</li>
              <li><strong>Multi-Tenant Isolation:</strong> Strict database Row-Level Security (RLS) ensures that no clinic can access another clinic&apos;s patient data, conversation transcripts, or settings.</li>
              <li><strong>Access Control:</strong> Administrative access to production databases is strictly restricted to authorized engineering personnel using multi-factor authentication (MFA).</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              6. Data Retention and Deletion Procedures
            </h2>
            <p>
              We retain clinic and patient communication records only for as long as necessary to provide the software service to the clinic:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Active Subscription:</strong> Clinic conversation histories and appointment request logs remain accessible to the clinic throughout their active subscription term.</li>
              <li><strong>Integration Disconnection:</strong> When a clinic disconnects Google Calendar or WhatsApp from the dashboard, stored authentication tokens are permanently purged from our database immediately.</li>
              <li><strong>Account Deletion:</strong> Clinic administrators can request complete deletion of their account, knowledge bases, and conversation archives at any time by contacting <a href="mailto:privacy@arenova.in" style={{ color: 'var(--color-amber)' }}>privacy@arenova.in</a>. Data deletion is fulfilled within thirty (30) days, except where retention is mandated by applicable tax or legal reporting obligations.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              7. Roles and Responsibilities under Indian DPDP Act (2023)
            </h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) and applicable Indian data protection laws:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Subscribing Clinic as Data Fiduciary:</strong> The subscribing clinic determines the purpose of patient communication, maintains the primary doctor-patient relationship, and is responsible for providing lawful notices and obtaining necessary patient consent for electronic communications.</li>
              <li><strong>Arenova as Data Processor:</strong> Arenova acts as a Data Processor, processing patient WhatsApp communications solely on the instructions of the subscribing clinic to deliver the automated receptionist software.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              8. Clinic Rights and Data Requests
            </h2>
            <p>
              Subscribing clinics have the right to access, rectify, export, or request the deletion of their personal and practice information. You can update clinic details directly from the dashboard or submit an export request by emailing <a href="mailto:privacy@arenova.in" style={{ color: 'var(--color-amber)' }}>privacy@arenova.in</a>.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              9. Grievance Redressal and Privacy Contact
            </h2>
            <p>
              For any questions, requests, or grievances concerning this Privacy Policy, our data protection practices, or our compliance with data protection laws, please contact our Grievance Officer:
            </p>
            <div
              style={{
                marginTop: '0.75rem',
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div><strong>Brand:</strong> Arenova (Arenova Technologies)</div>
              <div><strong>Privacy &amp; Data Protection:</strong> <a href="mailto:privacy@arenova.in" style={{ color: 'var(--color-amber)' }}>privacy@arenova.in</a></div>
              <div><strong>Grievance Redressal Officer:</strong> <a href="mailto:grievance@arenova.in" style={{ color: 'var(--color-amber)' }}>grievance@arenova.in</a></div>
              <div><strong>General Support:</strong> <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a></div>
              <div><strong>Operating Location:</strong> Bengaluru, Karnataka, India</div>
              <div><strong>Response Window:</strong> Acknowledged within 24–48 business hours</div>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            marginTop: '3.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.825rem',
          }}
        >
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/terms-of-service" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Terms of Service →
            </Link>
            <Link href="/refund-policy" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Refund &amp; Cancellation Policy →
            </Link>
            <Link href="/contact" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Contact Support →
            </Link>
          </div>
          <Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Back to Homepage
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
