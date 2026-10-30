import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingFooter } from '@/components/navigation/LandingFooter';
import { PricingTableClient } from './PricingTableClient';
import { createPageMetadata } from '@/lib/seo/metadata';
import { JsonLd, getSoftwareApplicationSchema, getBreadcrumbSchema } from '@/lib/seo/json-ld';

export const metadata: Metadata = createPageMetadata({
  title: 'Pricing & Subscription Plans (INR) | Arenova Frontdesk',
  description:
    'Transparent subscription pricing for Arenova Frontdesk AI WhatsApp Receptionist software. Monthly and annual plans for dental clinics, healthcare practices, and medical offices.',
  path: '/pricing',
});

export default function PricingPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-obsidian)', color: 'var(--color-text-primary)', minHeight: '100vh' }}>
      <JsonLd
        schema={[
          getSoftwareApplicationSchema(),
          getBreadcrumbSchema([{ name: 'Pricing Plans', path: '/pricing' }]),
        ]}
      />
      <LandingNavbar />

      {/* Main Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: 'clamp(6.5rem, 11vw, 8.5rem) clamp(1rem, 5vw, 3rem) 4rem', position: 'relative', zIndex: 1 }}>
        {/* Header Header */}
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
            Transparent B2B SaaS Subscriptions &bull; Indian Rupees (INR)
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
            Predictable Software Pricing <br />
            <span className="text-gradient-flame">for Independent Clinics</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              color: 'var(--color-text-secondary)',
              maxWidth: '680px',
              margin: '0 auto 1.5rem auto',
              lineHeight: 1.6,
            }}
          >
            Choose the subscription plan that fits your clinic enquiry volume. Every plan includes AI WhatsApp receptionist software, Google Calendar synchronization, and central web inbox management.
          </p>

          {/* Mandatory Razorpay & Statutory Compliance Statement */}
          <div
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              padding: '1rem 1.35rem',
              borderRadius: '12px',
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border-standard)',
              fontSize: '0.825rem',
              lineHeight: 1.6,
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            <strong style={{ color: 'var(--color-amber)' }}>Scope of Subscription: </strong>
            Your subscription provides access to Arenova&apos;s clinic communication software and AI receptionist services. It does not include medical consultations, medical treatment, or payments to healthcare providers.
          </div>
        </div>

        {/* Interactive Pricing Cards & Billing Cycle Switcher */}
        <PricingTableClient />

        {/* Additional Usage Charges & Overage Policy */}
        <section style={{ marginTop: '4rem', padding: '2rem', borderRadius: '18px', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border-standard)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
            Subscription Billing, Overages &amp; Setup Charges
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Setup &amp; Onboarding Charges
              </h3>
              <p style={{ margin: 0 }}>
                Standard self-serve onboarding is <strong>₹0 (Free)</strong> for all plans. We guide you through connecting WhatsApp, setting clinic hours, and adding your procedure catalog in under 4 minutes. Optional white-glove assisted setup by a dedicated specialist is available upon request.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                AI Conversation Limits &amp; Overages
              </h3>
              <p style={{ margin: 0 }}>
                Each tier includes a generous monthly quota of AI patient conversations. If your clinic approaches 80% and 100% of your quota, you receive automated dashboard alerts. Additional conversation packs can be added at <strong>₹250 per 500 conversations</strong> or by upgrading to the next tier with zero interruption to your WhatsApp receptionist.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Duration &amp; Renewal Terms
              </h3>
              <p style={{ margin: 0 }}>
                Subscriptions are billed in advance on either a monthly or annual cycle. Subscriptions renew automatically at the end of each billing period unless cancelled. All payments include detailed GST tax invoices sent to your clinic&apos;s registered email address.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                Cancellation Policy
              </h3>
              <p style={{ margin: 0 }}>
                You may cancel your subscription at any time with one click from your clinic dashboard under <em>Settings &gt; Billing</em>, or by emailing <a href="mailto:support@arenova.in" style={{ color: 'var(--color-amber)', textDecoration: 'none' }}>support@arenova.in</a>. Access remains active through the end of your current paid billing period with zero cancellation fees.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Feature Comparison Grid */}
        <section style={{ marginTop: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Compare Plan Features
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Everything your practice needs to provide responsive, 24/7 patient front-desk communication.
            </p>
          </div>

          <div style={{ overflowX: 'auto', background: 'var(--color-surface-elevated)', borderRadius: '18px', border: '1px solid var(--color-border-standard)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-standard)', background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>Feature</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--color-text-primary)', fontWeight: 600, width: '22%' }}>Starter Practice</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--color-amber)', fontWeight: 700, width: '22%' }}>Pro Clinic</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--color-text-primary)', fontWeight: 600, width: '22%' }}>Growth Multi-Doctor</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--color-text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Monthly Price (INR)</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)' }}>₹999 / mo</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', fontWeight: 700 }}>₹1,599 / mo</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)' }}>₹2,999 / mo</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Annual Price (Billed Annually)</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)' }}>₹9,590 / yr (Save 20%)</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', fontWeight: 700 }}>₹15,350 / yr (Save 20%)</td>
                  <td style={{ padding: '1rem 1.5rem', fontFamily: 'var(--font-mono)' }}>₹28,790 / yr (Save 20%)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>AI Patient Conversations Quota</td>
                  <td style={{ padding: '1rem 1.5rem' }}>500 conversations / mo</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--color-amber)', fontWeight: 600 }}>2,000 conversations / mo</td>
                  <td style={{ padding: '1rem 1.5rem' }}>5,000 conversations / mo</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>WhatsApp Number Connection</td>
                  <td style={{ padding: '1rem 1.5rem' }}>1 Clinic Number</td>
                  <td style={{ padding: '1rem 1.5rem' }}>1 Clinic Number</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Up to 2 Clinic Numbers</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Clinic Locations Supported</td>
                  <td style={{ padding: '1rem 1.5rem' }}>1 Location</td>
                  <td style={{ padding: '1rem 1.5rem' }}>1 Location</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Up to 2 Locations</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Appointment Request Coordination</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Included</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Included</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Included</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Google Calendar 2-Way Synchronization</td>
                  <td style={{ padding: '1rem 1.5rem' }}>1 Calendar</td>
                  <td style={{ padding: '1rem 1.5rem' }}>1 Calendar</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Multi-Doctor (Up to 5)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Live Human Staff Takeover Inbox</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Standard Inbox</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Priority Inbox</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Multi-User Staff Inbox</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Automated Patient Appointment Reminders</td>
                  <td style={{ padding: '1rem 1.5rem' }}>—</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Included</td>
                  <td style={{ padding: '1rem 1.5rem' }}>✓ Customizable Templates</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Custom Clinic Knowledge &amp; Pricing FAQ</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Up to 10 services</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Unlimited services</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Unlimited + Custom AI Tone</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>Support &amp; Onboarding Assistance</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Email Support</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Priority Email &amp; WhatsApp</td>
                  <td style={{ padding: '1rem 1.5rem' }}>Dedicated Account Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing FAQs */}
        <section style={{ marginTop: '4rem', maxWidth: '860px', margin: '4rem auto 0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Frequently Asked Billing Questions
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Everything you need to know about Arenova subscriptions and payment processing.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: 'What exactly am I paying for when subscribing to Arenova?',
                a: 'You are purchasing a subscription to Arenova’s clinic communication software. Your subscription grants your practice access to our cloud dashboard, WhatsApp receptionist integration, Google Calendar schedule synchronization, and automated patient enquiry handling. Arenova is strictly a SaaS provider and does not collect payments for medical treatments or doctor consultations.',
              },
              {
                q: 'How does payment collection work?',
                a: 'All subscription plans are billed in Indian Rupees (INR). We accept secure online payments via UPI (Google Pay, PhonePe, Paytm, BHIM), Netbanking, and major debit/credit cards. Once your subscription is active, you receive immediate access and automated GST tax invoices.',
              },
              {
                q: 'Can I switch between monthly and annual plans?',
                a: 'Yes. You can upgrade, downgrade, or switch between monthly and annual billing cycles at any time from your billing dashboard. When upgrading, charges are calculated on a prorated basis.',
              },
              {
                q: 'What is your refund policy if Arenova is not right for my clinic?',
                a: 'We offer a free 3-day operational trial so you can test the software with your clinic WhatsApp number before subscribing. In addition, new subscribers are covered by our 7-day initial money-back guarantee. For full terms, please review our public Refund and Cancellation Policy.',
              },
              {
                q: 'How do I cancel my subscription?',
                a: 'You can cancel your subscription at any time with a single click inside your clinic dashboard under Settings > Billing, or by reaching out to support@arenova.in. Upon cancellation, your access remains active until the end of your prepaid billing period.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                style={{
                  padding: '1.35rem 1.5rem',
                  borderRadius: '12px',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border-standard)',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.45rem' }}>
                  ✦ {faq.q}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: '1.25rem' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section
          style={{
            marginTop: '4.5rem',
            padding: '3rem 2rem',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.12), rgba(200, 105, 56, 0.05))',
            border: '1px solid rgba(232, 75, 44, 0.3)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
            Empower your clinic with a 24/7 AI front desk today
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '580px', margin: '0 auto 1.75rem auto', lineHeight: 1.6 }}>
            Set up in 4 minutes. Capture patient inquiries, answer procedure questions, and automate appointment requests on WhatsApp.
          </p>
          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg" style={{ padding: '0.85rem 2.25rem', fontWeight: 600 }}>
              Start 3-Day Free Trial →
            </Link>
            <Link href="/contact" className="btn btn-secondary btn-lg" style={{ padding: '0.85rem 2rem' }}>
              Speak to Sales
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
