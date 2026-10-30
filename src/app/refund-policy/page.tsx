import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingFooter } from '@/components/navigation/LandingFooter';
import { createPageMetadata } from '@/lib/seo/metadata';
import { JsonLd, getBreadcrumbSchema } from '@/lib/seo/json-ld';

export const metadata: Metadata = createPageMetadata({
  title: 'Refund & Cancellation Policy | Arenova Frontdesk',
  description:
    'Refund and Cancellation Policy for Arenova Frontdesk AI WhatsApp Receptionist software subscriptions. Clear terms for monthly, annual plans, and billing resolutions.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  const lastUpdated = 'October 27, 2026';

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-obsidian)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
      <JsonLd
        schema={getBreadcrumbSchema([{ name: 'Refund Policy', path: '/refund-policy' }])}
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
            Billing &amp; Subscription Terms
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
            Refund and Cancellation Policy
          </h1>

          <p style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', margin: 0 }}>
            Effective Date: October 20, 2024 &bull; Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Policy Summary Box */}
        <div
          style={{
            padding: '1.35rem 1.5rem',
            borderRadius: '16px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
            marginBottom: '2.5rem',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>
            At a Glance
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
              <span><strong>Free Operational Trial:</strong> 3-day full operational trial before payment is required.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
              <span><strong>Cancel Anytime:</strong> 1-click cancellation directly from your clinic billing dashboard.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
              <span><strong>Full Access Until Period Ends:</strong> Your receptionist remains active through your paid period.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
              <span><strong>Billing Error Protection:</strong> 100% immediate refund for duplicate or accidental charges.</span>
            </li>
          </ul>
        </div>

        {/* Policy Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          {/* Section 1 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              1. Overview
            </h2>
            <p>
              At <strong>Arenova</strong>, we are committed to transparent, fair, and reliable software subscription services for independent clinics, dental practices, and healthcare offices. This Refund and Cancellation Policy governs software subscription purchases, plan renewals, and cancellation procedures for the Arenova SaaS platform.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              2. Free Operational Trial Period
            </h2>
            <p>
              We provide a <strong>3-day free operational trial</strong> for every new clinic account. During this trial, your clinic can pair your WhatsApp number, synchronize your Google Calendar, calibrate your service catalog, and test live AI conversations without entering credit card information or making any payment. We encourage all clinic owners to evaluate the software during this period.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              3. Subscription Cancellation Procedure
            </h2>
            <p>
              You may cancel your subscription at any time without penalty or cancellation fees:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Self-Serve Dashboard Cancellation:</strong> Log in to your clinic console at <Link href="/dashboard/billing" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>Dashboard &gt; Settings &gt; Billing</Link> and select &ldquo;Cancel Subscription&rdquo;.</li>
              <li><strong>Email Cancellation:</strong> Alternatively, send an email from your registered clinic email address to <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a> requesting cancellation.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Continued Access:</strong> Upon cancellation, your software subscription remains fully active and operational until the expiration date of your current prepaid billing cycle. At the end of the billing period, your subscription will not renew, and no further charges will occur.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              4. Monthly Subscription Refund Policy
            </h2>
            <p>
              <strong>Initial Purchase:</strong> For first-time subscribers, if you are dissatisfied with the software within the first <strong>7 days</strong> of your initial paid subscription, you may request a full 100% refund by contacting support.
            </p>
            <p>
              <strong>Recurring Monthly Renewals:</strong> Because software access and conversational AI processing capacity are provisioned immediately upon renewal, subsequent recurring monthly subscription renewals are non-refundable once the billing period has commenced. If you do not wish to renew for the following month, simply cancel before your renewal date.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              5. Annual Subscription Refund Policy
            </h2>
            <p>
              Annual subscriptions offer significant savings (up to 20% discount compared to monthly billing) in exchange for an annual commitment:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Within 14 Days:</strong> If you cancel an annual subscription within fourteen (14) days of the initial purchase or renewal, you may request a refund. The refund will be calculated by deducting the standard single-month non-discounted rate for the elapsed month, and refunding the remaining eleven months.</li>
              <li><strong>After 14 Days:</strong> Cancellations requested after 14 days of an annual billing cycle are non-refundable; your access will remain active through the end of the paid 12-month annual term.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              6. Setup &amp; Onboarding Charges
            </h2>
            <p>
              Standard self-serve onboarding is included free (₹0) with all plans. Where a clinic explicitly contracts for custom bespoke engineering setup, on-site personnel training, or extensive historical knowledge-base ingestion, any agreed-upon one-time setup charges are non-refundable once engineering or onboarding services have been delivered.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              7. Resolution of Duplicate Charges &amp; Billing Errors
            </h2>
            <p>
              We maintain a zero-tolerance policy for billing discrepancies:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Duplicate Payments:</strong> In the event of a technical glitch, double-click, or gateway timeout that results in duplicate debits for the same billing cycle, we will issue a full 100% refund for the duplicate transaction immediately upon verification.</li>
              <li><strong>Overcharges:</strong> Any verified billing calculation discrepancy or incorrect tier charge will be rectified within forty-eight (48) hours with an immediate adjustment or refund.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              8. How to Report a Payment Discrepancy or Request a Refund
            </h2>
            <p>
              To submit a refund request or report a failed/disputed payment, please email us with the following details:
            </p>
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'var(--color-surface-secondary)',
                border: '1px solid var(--color-border-subtle)',
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>To: <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a></div>
              <div>Subject: Refund Request / Payment Discrepancy - [Your Clinic Name]</div>
              <div style={{ marginTop: '0.5rem' }}>Please include:</div>
              <div>1. Registered Clinic Name &amp; Account Email</div>
              <div>2. Transaction Reference Number (Order ID, Payment ID, or Bank UTR)</div>
              <div>3. Date of Transaction &amp; Amount Charged (INR)</div>
              <div>4. Brief reason for the refund request</div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              9. Expected Response &amp; Settlement Timeframes
            </h2>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Acknowledgement:</strong> All refund requests are acknowledged via email within <strong>24 to 48 business hours</strong>.</li>
              <li><strong>Investigation:</strong> Legitimate refund requests are verified and approved within <strong>2 to 3 business days</strong>.</li>
              <li><strong>Credit to Original Source:</strong> Once approved, refunds are initiated immediately through our payment gateway (Razorpay). The credited amount will reflect in your original payment method (bank account, UPI handle, or credit/debit card) within <strong>5 to 7 business working days</strong>, subject to your issuing bank&apos;s standard clearing cycle.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
              10. Contact Information for Billing Inquiries
            </h2>
            <p>
              For questions regarding invoices, renewals, cancellations, or payment verification:
            </p>
            <div
              style={{
                marginTop: '0.5rem',
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
              <div><strong>Billing Support:</strong> <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)' }}>support@arenova.in</a></div>
              <div><strong>Operating Location:</strong> Bengaluru, Karnataka, India</div>
              <div><strong>Business Hours:</strong> Monday &ndash; Saturday, 9:00 AM &ndash; 6:00 PM IST</div>
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
            <Link href="/privacy-policy" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              Privacy Policy →
            </Link>
            <Link href="/pricing" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>
              View Pricing Plans →
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
