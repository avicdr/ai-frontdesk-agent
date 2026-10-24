import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service and Conditions of Use for AI Front Desk.',
};

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF5EE', color: '#201A17' }}>
      <LandingNavbar />

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '0 auto', padding: '6.5rem 1.5rem 5rem 1.5rem', lineHeight: 1.75 }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid #E9DED3', paddingBottom: '1.75rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
            Legal Terms & Conditions
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            marginBottom: '0.5rem',
            color: '#201A17',
          }}>
            Terms of Service
          </h1>
          <p style={{ color: '#756A62', fontSize: '0.9rem' }}>
            Effective Date: October 20, 2024 &bull; Last Updated: October 2026
          </p>
        </div>

        {/* Medical & Emergency Disclaimer Alert Box */}
        <div style={{
          background: '#FDF2F2',
          border: '1px solid #F8D7D5',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#9E3D23', margin: 0 }}>
              Medical & Emergency Disclaimer
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#756A62', margin: 0, lineHeight: 1.6 }}>
            AI Front Desk is an <strong style={{ color: '#201A17' }}>administrative and scheduling automation software</strong>. It is <strong style={{ color: '#201A17' }}>NOT</strong> a medical diagnostic device, emergency dispatch system, or licensed healthcare provider. The automated assistant does not provide medical diagnoses or prescribe medications. In any life-threatening emergency, patients must immediately contact emergency services (112 / 911) or proceed to the nearest emergency room.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            By creating an account, connecting your clinic communication channels, or using the <strong>AI Front Desk</strong> platform (&ldquo;Service&rdquo;), you (&ldquo;Customer&rdquo;, &ldquo;Clinic&rdquo;, or &ldquo;You&rdquo;) agree to be legally bound by these Terms of Service. If you represent a clinic or organization, you confirm that you have the authority to bind that entity to these terms.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            2. Description of Service
          </h2>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            AI Front Desk provides a cloud-based multi-tenant software platform that enables healthcare clinics, dentists, therapists, and appointment-based practices to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Deploy an automated AI assistant on WhatsApp to answer patient inquiries, quote catalog procedures, and confirm operating hours.</li>
            <li>Coordinate patient appointment bookings, reschedules, and cancellations in real time.</li>
            <li>Synchronize confirmed patient bookings with the clinic&rsquo;s calendar (including Google Calendar 2-way sync).</li>
            <li>Facilitate human takeover when a patient or clinic staff requires manual intervention.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            3. Clinic Responsibilities & Acceptable Use
          </h2>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            As a subscribing clinic, you agree to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Maintain accurate and current pricing, clinician availability, operating hours, and emergency instructions in your dashboard.</li>
            <li>Comply with all applicable patient privacy laws, healthcare regulations, and electronic communication guidelines.</li>
            <li>Obtain appropriate consent from patients prior to sending business messages via WhatsApp or third-party messaging networks.</li>
            <li>Not use the service to broadcast unauthorized bulk spam, fraudulent claims, deceptive medical promises, or harassing communications.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            4. Third-Party Services & Integrations
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            Our Service integrates with external platforms, including:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <li>
              <strong style={{ color: '#201A17' }}>Google Calendar:</strong> You authorize AI Front Desk to read busy/free slots and write confirmed events. Your use of Google integrations is governed by Google&rsquo;s Terms of Service and Privacy Policy. You can disconnect calendar access anytime.
            </li>
            <li>
              <strong style={{ color: '#201A17' }}>Meta / WhatsApp:</strong> Message transmission depends on Meta WhatsApp policies and network connectivity. We are not liable for outages or carrier delivery failures outside our control.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            5. Subscriptions, Fees & Payment
          </h2>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            <strong style={{ color: '#201A17' }}>Billing Cycles:</strong> Subscription tiers (Starter, Pro, Growth) are billed on a recurring monthly or annual basis. Fees are non-refundable once the billing period has commenced, except where mandated by local law.
          </p>
          <p style={{ color: '#756A62', marginBottom: '0.75rem' }}>
            <strong style={{ color: '#201A17' }}>UPI & Direct Payments:</strong> For instant platform activation, payments processed via UPI or direct gateway must be accompanied by valid transaction reference records (UTR) for verification.
          </p>
          <p style={{ color: '#756A62' }}>
            <strong style={{ color: '#201A17' }}>Plan Cancellation:</strong> You may cancel your subscription at any time via your dashboard. Access remains active through the end of the paid billing period.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            6. Limitation of Liability
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            To the maximum extent permitted by applicable law:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: '#756A62', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>AI Front Desk is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied.</li>
            <li>In no event shall AI Front Desk, its directors, employees, or partners be liable for indirect, incidental, consequential, special, or punitive damages, including loss of profits, loss of data, or clinic downtime.</li>
            <li>Our total cumulative liability arising out of or related to these terms shall not exceed the total fees paid by you to AI Front Desk in the twelve (12) months preceding the incident.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            7. Termination
          </h2>
          <p style={{ color: '#756A62' }}>
            We reserve the right to suspend or terminate accounts that violate these Terms, breach security protocols, or engage in abusive messaging practices. Upon termination, your right to use the Service immediately ceases, and you may request an export of your appointment data within 30 days.
          </p>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.75rem', color: '#201A17' }}>
            8. Governing Law & Contact
          </h2>
          <p style={{ color: '#756A62', marginBottom: '1rem' }}>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '1.5rem',
            border: '1px solid #E9DED3',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#201A17' }}>Questions regarding these Terms of Service?</p>
            <p style={{ margin: 0, color: '#756A62' }}>
              Contact legal:{' '}
              <a href="mailto:legal@aifrontdesk.com" style={{ color: '#C4512A', textDecoration: 'none', fontWeight: 500 }}>
                legal@aifrontdesk.com
              </a>
              {' '}&bull;{' '}
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
          <Link href="/privacy" style={{ color: 'rgba(255, 252, 247, 0.7)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/tos" style={{ color: '#F07843', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/" style={{ color: 'rgba(255, 252, 247, 0.7)', textDecoration: 'none' }}>Home</Link>
          <Link href="/dashboard" style={{ color: 'rgba(255, 252, 247, 0.7)', textDecoration: 'none' }}>Dashboard</Link>
        </div>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} AI Front Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
