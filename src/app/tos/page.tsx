import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service and Conditions of Use for AI Front Desk.',
};

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--color-bg))', color: 'hsl(var(--color-text-primary))' }}>
      <LandingNavbar />

      {/* Main Container */}
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '6rem 1.5rem 5rem 1.5rem', lineHeight: 1.75 }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '1.5rem' }}>
          <div className="badge badge-info" style={{ marginBottom: '0.75rem' }}>
            Legal Terms & Conditions
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.9rem' }}>
            Effective Date: October 20, 2024 &bull; Last Updated: October 2026
          </p>
        </div>

        {/* Medical & Emergency Disclaimer Alert Box */}
        <div style={{
          background: 'hsla(0, 84%, 60%, 0.1)',
          border: '1px solid hsla(0, 84%, 60%, 0.3)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', margin: 0 }}>
              Medical & Emergency Disclaimer
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))', margin: 0 }}>
            AI Front Desk is an <strong>administrative and scheduling automation software</strong>. It is <strong>NOT</strong> a medical diagnostic device, emergency dispatch system, or licensed healthcare provider. The automated assistant does not provide medical diagnoses or prescribe medications. In any life-threatening emergency, patients must immediately contact emergency services (112 / 911) or proceed to the nearest emergency room.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            By creating an account, connecting your clinic communication channels, or using the <strong>AI Front Desk</strong> platform (&ldquo;Service&rdquo;), you (&ldquo;Customer&rdquo;, &ldquo;Clinic&rdquo;, or &ldquo;You&rdquo;) agree to be legally bound by these Terms of Service. If you represent a clinic or organization, you confirm that you have the authority to bind that entity to these terms.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            2. Description of Service
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            AI Front Desk provides a cloud-based multi-tenant software platform that enables healthcare clinics, dentists, therapists, and appointment-based practices to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Deploy an automated AI assistant on WhatsApp to answer patient inquiries, quote catalog procedures, and confirm operating hours.</li>
            <li>Coordinate patient appointment bookings, reschedules, and cancellations in real time.</li>
            <li>Synchronize confirmed patient bookings with the clinic&rsquo;s calendar (including Google Calendar 2-way sync).</li>
            <li>Facilitate human takeover when a patient or clinic staff requires manual intervention.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            3. Clinic Responsibilities & Acceptable Use
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            As a subscribing clinic, you agree to:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Maintain accurate and current pricing, clinician availability, operating hours, and emergency instructions in your dashboard.</li>
            <li>Comply with all applicable patient privacy laws, healthcare regulations, and electronic communication guidelines.</li>
            <li>Obtain appropriate consent from patients prior to sending business messages via WhatsApp or third-party messaging networks.</li>
            <li>Not use the service to broadcast unauthorized bulk spam, fraudulent claims, deceptive medical promises, or harassing communications.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            4. Third-Party Services & Integrations
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            Our Service integrates with external platforms, including:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <li>
              <strong>Google Calendar:</strong> You authorize AI Front Desk to read busy/free slots and write confirmed events. Your use of Google integrations is governed by Google&rsquo;s Terms of Service and Privacy Policy. You can disconnect calendar access anytime.
            </li>
            <li>
              <strong>Meta / WhatsApp:</strong> Message transmission depends on Meta WhatsApp policies and network connectivity. We are not liable for outages or carrier delivery failures outside our control.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            5. Subscriptions, Fees & Payment
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            <strong>Billing Cycles:</strong> Subscription tiers (Starter, Pro, Growth) are billed on a recurring monthly or annual basis. Fees are non-refundable once the billing period has commenced, except where mandated by local law.
          </p>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '0.75rem' }}>
            <strong>UPI & Direct Payments:</strong> For instant platform activation, payments processed via UPI or direct gateway must be accompanied by valid transaction reference records (UTR) for verification.
          </p>
          <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
            <strong>Plan Cancellation:</strong> You may cancel your subscription at any time via your dashboard. Access remains active through the end of the paid billing period.
          </p>
        </section>

        {/* Section 6 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            6. Limitation of Liability
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            To the maximum extent permitted by applicable law:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'hsl(var(--color-text-secondary))', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>AI Front Desk is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied.</li>
            <li>In no event shall AI Front Desk, its directors, employees, or partners be liable for indirect, incidental, consequential, special, or punitive damages, including loss of profits, loss of data, or clinic downtime.</li>
            <li>Our total cumulative liability arising out of or related to these terms shall not exceed the total fees paid by you to AI Front Desk in the twelve (12) months preceding the incident.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            7. Termination
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))' }}>
            We reserve the right to suspend or terminate accounts that violate these Terms, breach security protocols, or engage in abusive messaging practices. Upon termination, your right to use the Service immediately ceases, and you may request an export of your appointment data within 30 days.
          </p>
        </section>

        {/* Section 8 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>
            8. Governing Law & Contact
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', marginBottom: '1rem' }}>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
          <div style={{
            background: 'hsl(var(--color-surface))',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid hsl(var(--color-border))',
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Questions regarding these Terms of Service?</p>
            <p style={{ margin: 0, color: 'hsl(var(--color-text-secondary))' }}>
              Contact legal:{' '}
              <a href="mailto:legal@aifrontdesk.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                legal@aifrontdesk.com
              </a>
              {' '}&bull;{' '}
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
          <Link href="/privacy" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/tos" style={{ color: '#93c5fd', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Home</Link>
          <Link href="/dashboard" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Dashboard</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} AI Front Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
