import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingFooter } from '@/components/navigation/LandingFooter';

export const metadata: Metadata = {
  title: 'Terms of Service | Arenova',
  description: 'Terms of Service and Conditions of Use for Arenova AI WhatsApp Receptionist software for clinics.',
  openGraph: {
    title: 'Terms of Service | Arenova',
    description: 'B2B SaaS Terms of Service and Conditions of Use for Arenova clinic communication software.',
    url: '/terms-of-service',
    siteName: 'Arenova',
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = 'October 27, 2026';

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-obsidian)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
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
            Legal Terms &amp; Conditions
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
            Terms of Service
          </h1>

          <p style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', margin: 0 }}>
            Effective Date: October 20, 2024 &bull; Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Highlight Medical & Healthcare Software Disclaimer Box */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid rgba(232, 75, 44, 0.35)',
            marginBottom: '2.5rem',
            boxShadow: '0 4px 20px rgba(232, 75, 44, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-flame)', margin: 0 }}>
              Statutory Software Disclaimer &amp; Emergency Notice
            </h2>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Arenova is strictly an administrative and front-desk communication software platform</strong> built for healthcare practices, dental clinics, and medical practitioners. Arenova is <strong>NOT</strong> a licensed healthcare provider, diagnostic clinic, hospital, or emergency dispatch center. Arenova does <strong>NOT</strong> employ medical doctors, provide clinical consultations, diagnose medical conditions, or prescribe pharmaceuticals. In any life-threatening or acute medical emergency, patients must immediately dial national emergency medical services (112 / 911) or proceed directly to the nearest hospital emergency room.
          </p>
        </div>

        {/* 18 Mandated Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {/* Section 1 */}
          <section id="section-1">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              1. Introduction and Acceptance of Terms
            </h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;, &ldquo;Agreement&rdquo;) constitute a legally binding agreement between you (&ldquo;Customer&rdquo;, &ldquo;Clinic&rdquo;, &ldquo;You&rdquo;) and <strong>Arenova</strong> (&ldquo;Arenova&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of our cloud-based front-desk software platform, website, dashboards, APIs, and associated automated virtual receptionist applications (collectively, the &ldquo;Service&rdquo; or &ldquo;SaaS Software&rdquo;).
            </p>
            <p>
              By signing up for an account, subscribing to a software plan, pairing your clinic&apos;s WhatsApp Business communication channel, or accessing the Service, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. If you are entering into these Terms on behalf of a clinic, hospital, dental practice, or legal entity, you represent and warrant that you possess full legal authority to bind that entity to this Agreement.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              2. Description of Arenova&apos;s SaaS Services
            </h2>
            <p>
              Arenova provides clinic-facing Business-to-Business (B2B) Software-as-a-Service (SaaS). The software enables independent healthcare clinics, dental offices, physiotherapy centers, and medical practitioners to:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Connect their clinic communication channels (such as WhatsApp) to an automated artificial intelligence assistant to respond to routine patient queries regarding clinic hours, address, directions, and procedure catalogs.</li>
              <li>Assist patients with submitting appointment requests on behalf of the subscribing clinic according to rules, buffer times, and availability schedules configured by the clinic.</li>
              <li>Coordinate confirmed booking slots directly with the clinic&apos;s digital calendar (such as Google Calendar two-way synchronization).</li>
              <li>Provide clinic staff with a centralized web-based inbox to monitor patient dialogue, review conversation transcripts, and execute human staff takeover at any moment.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Sole Provider of Software:</strong> Arenova sells software licenses and digital administrative tools. Arenova does not operate an open doctor-booking marketplace, directory aggregator, or medical teleconsultation platform. Arenova does not collect or process patient fees for medical procedures or doctor consultations.
            </p>
          </section>

          {/* Section 3 */}
          <section id="section-3">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              3. Eligibility and Clinic / Customer Responsibilities
            </h2>
            <p>
              To use Arenova, you must represent a bona fide clinic, medical practice, healthcare office, or legal business entity operating in compliance with applicable local laws and healthcare regulations. You agree to:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Provide accurate, current, and complete clinic details, including operating hours, practitioner details, procedure catalogs, consultation fees, and emergency instructions.</li>
              <li>Regularly review, calibrate, and oversee the automated responses provided by the AI assistant to ensure accuracy with your clinic&apos;s real-world practices.</li>
              <li>Obtain all requisite authorizations and patient consents required under applicable healthcare communication guidelines and the Digital Personal Data Protection Act, 2023 (DPDP Act).</li>
              <li>Ensure all medical care, diagnostic decisions, treatment plans, and prescriptions provided to patients are delivered solely by qualified, licensed medical professionals.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="section-4">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              4. Account Creation and Security
            </h2>
            <p>
              You must register for an administrative account to access the Arenova console. You are responsible for maintaining the confidentiality of your login credentials, passwords, and API keys. You agree to immediately notify Arenova at <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a> of any unauthorized access, breach of security, or compromised credentials. Arenova will not be liable for any losses arising from unauthorized access resulting from your failure to safeguard credentials.
            </p>
          </section>

          {/* Section 5 */}
          <section id="section-5">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              5. Subscription Plans, Billing, and Renewal
            </h2>
            <p>
              Arenova is offered on a subscription model (e.g., Starter Practice, Pro Clinic, Growth Multi-Doctor). By selecting a subscription tier, you agree to pay the scheduled subscription fees denominated in Indian Rupees (INR) plus applicable taxes (including GST).
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Billing Cycle:</strong> Subscription fees are billed in advance on either a recurring monthly or annual basis, commencing on the date you subscribe.</li>
              <li><strong>Automatic Renewal:</strong> To ensure uninterrupted front-desk coverage for your clinic, subscriptions automatically renew at the conclusion of each billing period unless cancelled prior to the renewal date.</li>
              <li><strong>Payment Methods:</strong> We accept authorized domestic payment methods supported by our integrated payment gateway (Razorpay), including UPI, Netbanking, and major Credit/Debit Cards.</li>
              <li><strong>Tax Invoices:</strong> Official GST-compliant electronic invoices and renewal receipts are issued automatically to your registered clinic billing email address.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="section-6">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              6. Setup and Onboarding Fees, Where Applicable
            </h2>
            <p>
              Standard self-serve onboarding through the guided Arenova console is included at no additional cost (₹0 Setup Fee). If your clinic contracts for custom bespoke setup, personalized clinical knowledge-base ingestion, or dedicated on-site staff training, any agreed-upon one-time setup charges will be clearly disclosed in advance and invoiced separately. One-time onboarding fees are non-refundable once engineering or training services have been performed.
            </p>
          </section>

          {/* Section 7 */}
          <section id="section-7">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              7. AI Usage Limits and Additional Charges
            </h2>
            <p>
              Each subscription plan specifies an inclusive monthly quota of AI patient conversations (e.g., 500, 2,000, or 5,000 conversations). Usage is tracked transparently within your clinic dashboard. If your clinic approaches or exceeds your monthly quota:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Automated courtesy alerts are displayed in your billing dashboard at 80% and 100% threshold consumption.</li>
              <li>Your clinic may purchase supplemental conversation booster packs (₹250 per 500 conversations) or upgrade to a higher tier at any time.</li>
              <li>Unused conversation quotas do not roll over to subsequent billing months.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="section-8">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              8. Acceptable Use of the Software
            </h2>
            <p>
              You agree not to misuse the Arenova software or enable any third party to:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Transmit unsolicited bulk marketing messages (&ldquo;spam&rdquo;), deceptive advertising, or harassing communications in violation of WhatsApp Business policies or telecom regulations.</li>
              <li>Provide false, misleading, unproven, or dangerous medical claims or treatment promises through the automated assistant.</li>
              <li>Attempt to reverse engineer, decompile, copy, or probe the vulnerabilities of the Arenova platform, infrastructure, or underlying AI systems.</li>
              <li>Utilize the Service to harvest patient personal health data for resale, marketing brokers, or unauthorized third-party commercial exploitation.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section id="section-9">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              9. WhatsApp, Third-Party AI, and Other Integrations
            </h2>
            <p>
              Arenova interoperates with external platforms, including:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Meta / WhatsApp:</strong> Message transmission depends on Meta platforms and network connectivity. Clinics must comply with Meta&apos;s WhatsApp Business Policies. Arenova is not responsible for suspensions or interruptions resulting from Meta carrier policies or clinic policy violations.</li>
              <li><strong>Google Calendar:</strong> Authorized via OAuth 2.0 to coordinate appointment scheduling. Our use of Google user data adheres strictly to Google API Services User Data Policy, including Limited Use requirements.</li>
              <li><strong>AI Language Models:</strong> Natural language processing is facilitated by enterprise AI providers (Google Gemini, OpenAI). These models process queries strictly to generate conversational receptionist responses and are not used to make clinical medical decisions.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section id="section-10">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              10. AI Limitations and the Need for Human Oversight
            </h2>
            <p>
              Artificial intelligence algorithms, while advanced, may occasionally generate unexpected, inaccurate, or incomplete answers. <strong>Arenova requires human oversight:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>The software is an administrative receptionist aid and does not substitute for licensed clinical judgment.</li>
              <li>Subscribing clinics retain full responsibility for verifying critical patient communications and maintaining staff availability to take over conversations via the web inbox when complex questions arise.</li>
              <li>Arenova shall not be held liable for clinical misunderstandings, missed medical nuances, or administrative discrepancies resulting from automated assistant replies.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section id="section-11">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              11. Patient Information and Data Handling
            </h2>
            <p>
              In providing the SaaS service, Arenova processes patient contact details and conversation messages strictly on behalf of the subscribing clinic:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Roles:</strong> The subscribing clinic acts as the Data Fiduciary (Controller), and Arenova acts as the Data Processor under the Digital Personal Data Protection Act, 2023 (DPDP Act).</li>
              <li><strong>Data Protection:</strong> Data transmitted to our platform is encrypted in transit using TLS 1.3/HTTPS, and credentials are encrypted at rest using AES-256-GCM. Multi-tenant isolation is enforced via database Row-Level Security.</li>
              <li><strong>No Data Selling:</strong> We never sell, rent, or trade patient personal data to pharmaceutical companies, advertisers, or data brokers.</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section id="section-12">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              12. Service Availability and Maintenance
            </h2>
            <p>
              We strive to maintain 99.9% uptime for the Arenova platform. However, the Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. Scheduled maintenance, emergency security updates, internet outages, or third-party service provider failures (such as telecommunications or Meta network disruptions) may occasionally cause temporary downtime. We provide advance notification for non-urgent scheduled maintenance whenever feasible.
            </p>
          </section>

          {/* Section 13 */}
          <section id="section-13">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              13. Cancellation and Termination
            </h2>
            <p>
              You may cancel your subscription at any time directly through your clinic dashboard or by emailing <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a>. Upon cancellation:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Your software access remains active through the conclusion of your current paid billing period.</li>
              <li>No further recurring renewal charges will be applied.</li>
              <li>You may request an export of your clinic appointment logs and conversation transcripts within thirty (30) days following termination.</li>
              <li>Arenova reserves the right to suspend or terminate accounts that breach these Terms, violate acceptable use, or engage in abusive messaging practices.</li>
            </ul>
          </section>

          {/* Section 14 */}
          <section id="section-14">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              14. Intellectual Property
            </h2>
            <p>
              Arenova retains all rights, title, and interest in and to the Service, software, proprietary algorithms, user interfaces, branding, trademarks, documentation, and underlying technology. Your subscription grants you a non-exclusive, non-transferable, revocable license to access and use the software solely for your internal clinic front-desk operations during your active subscription term.
            </p>
            <p>
              The subscribing clinic retains all ownership rights to its clinic name, logos, service pricing catalogs, and proprietary clinic materials provided during setup.
            </p>
          </section>

          {/* Section 15 */}
          <section id="section-15">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              15. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable Indian law:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>In no event shall Arenova, its directors, officers, employees, or affiliates be liable for indirect, incidental, special, consequential, or punitive damages, including loss of clinic revenue, profits, patient goodwill, or data loss.</li>
              <li>Arenova is not liable for any clinical errors, medical malpractice, patient treatment outcomes, or missed diagnostic decisions resulting from medical care provided by the subscribing clinic.</li>
              <li>Our total cumulative liability arising out of or related to this Agreement or your use of the Service shall not exceed the total subscription fees actually paid by you to Arenova in the twelve (12) months preceding the claim.</li>
            </ul>
          </section>

          {/* Section 16 */}
          <section id="section-16">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              16. Grievance and Support Contact Details
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, for questions, concerns, or grievances concerning these Terms or payment transactions, please contact:
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
              <div><strong>Support Email:</strong> <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a></div>
              <div><strong>Grievance Officer:</strong> <a href="mailto:grievance@arenova.in" style={{ color: 'var(--color-amber)' }}>grievance@arenova.in</a></div>
              <div><strong>Operating Location:</strong> Bengaluru, Karnataka, India</div>
              <div><strong>Response Window:</strong> Acknowledged within 24–48 business hours</div>
            </div>
          </section>

          {/* Section 17 */}
          <section id="section-17">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              17. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by, construed, and enforced in accordance with the laws of the Republic of India, without regard to conflict of law principles. Any dispute, claim, or controversy arising out of or relating to these Terms or the breach, termination, enforcement, interpretation, or validity thereof shall be resolved through good-faith mutual negotiations. If unresolved within thirty (30) days, the dispute shall be subject to the exclusive jurisdiction of the competent courts located in Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* Section 18 */}
          <section id="section-18">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              18. Terms Update Procedure
            </h2>
            <p>
              Arenova reserves the right to modify or update these Terms periodically to reflect changes in our software features, legal requirements, or payment gateway guidelines. When material updates are made, we will revise the &ldquo;Last Updated&rdquo; date at the top of this page and notify active subscribers via an announcement in the clinic dashboard or via email. Continued access to or use of the Service after the effective date of updated Terms constitutes your acceptance of the revised Terms.
            </p>
          </section>
        </div>

        {/* Footer Navigation Box */}
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
            <Link href="/privacy-policy" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Privacy Policy →
            </Link>
            <Link href="/refund-policy" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Refund &amp; Cancellation Policy →
            </Link>
            <Link href="/pricing" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Pricing Plans →
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
