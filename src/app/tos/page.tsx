import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service and Conditions of Use for AI Front Desk.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#111110] text-[#F3F0E8] relative overflow-hidden">
      <LandingNavbar />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 leading-relaxed relative z-10 animate-fade-in">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#F3F0E8]/08">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E84B2C]/10 border border-[#E84B2C]/30 text-[#E87A38] text-[10px] font-mono uppercase tracking-widest font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            Legal Terms &amp; Conditions
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F3F0E8] mb-2">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-[#9E9B93]">
            Effective Date: October 20, 2024 &bull; Last Updated: October 2026
          </p>
        </div>

        {/* Medical & Emergency Disclaimer Alert Box */}
        <div className="p-6 rounded-2xl bg-[#171614] border border-[#E84B2C]/30 mb-10 shadow-[0_4px_24px_rgba(232,75,44,0.08)]">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-lg">⚠️</span>
            <h3 className="font-heading text-base font-semibold text-[#E84B2C] m-0">
              Medical &amp; Emergency Disclaimer
            </h3>
          </div>
          <p className="text-xs text-[#D0CBC1] leading-relaxed m-0">
            AI Front Desk is an <strong className="text-[#F3F0E8]">administrative and scheduling automation software</strong>. It is <strong className="text-[#F3F0E8]">NOT</strong> a medical diagnostic device, emergency dispatch system, or licensed healthcare provider. The automated assistant does not provide medical diagnoses or prescribe medications. In any life-threatening emergency, patients must immediately contact emergency services (112 / 911) or proceed to the nearest emergency room.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            1. Acceptance of Terms
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-3">
            By creating an account, connecting your clinic communication channels, or using the <strong className="text-[#F3F0E8]">AI Front Desk</strong> platform (&ldquo;Service&rdquo;), you (&ldquo;Customer&rdquo;, &ldquo;Clinic&rdquo;, or &ldquo;You&rdquo;) agree to be legally bound by these Terms of Service. If you represent a clinic or organization, you confirm that you have the authority to bind that entity to these terms.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            2. Description of Service
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-3">
            AI Front Desk provides a cloud-based multi-tenant software platform that enables healthcare clinics, dentists, therapists, and appointment-based practices to:
          </p>
          <ul className="space-y-2 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>Deploy an automated AI assistant on WhatsApp to answer patient inquiries, quote catalog procedures, and confirm operating hours.</li>
            <li>Coordinate patient appointment bookings, reschedules, and cancellations in real time.</li>
            <li>Synchronize confirmed patient bookings with the clinic&rsquo;s calendar (including Google Calendar 2-way sync).</li>
            <li>Facilitate human takeover when a patient or clinic staff requires manual intervention.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            3. Clinic Responsibilities &amp; Acceptable Use
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-3">
            As a subscribing clinic, you agree to:
          </p>
          <ul className="space-y-2 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>Maintain accurate and current pricing, clinician availability, operating hours, and emergency instructions in your dashboard.</li>
            <li>Comply with all applicable patient privacy laws, healthcare regulations, and electronic communication guidelines.</li>
            <li>Obtain appropriate consent from patients prior to sending business messages via WhatsApp or third-party messaging networks.</li>
            <li>Not use the service to broadcast unauthorized bulk spam, fraudulent claims, deceptive medical promises, or harassing communications.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            4. Third-Party Services &amp; Integrations
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-3">
            Our Service integrates with external platforms, including:
          </p>
          <ul className="space-y-3 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>
              <strong className="text-[#F3F0E8]">Google Calendar:</strong> You authorize AI Front Desk to read busy/free slots and write confirmed events. Your use of Google integrations is governed by Google&rsquo;s Terms of Service and Privacy Policy. You can disconnect calendar access anytime.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Meta / WhatsApp:</strong> Message transmission depends on Meta WhatsApp policies and network connectivity. We are not liable for outages or carrier delivery failures outside our control.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            5. Subscriptions, Fees &amp; Payment
          </h2>
          <div className="space-y-3 text-xs text-[#D0CBC1] leading-relaxed">
            <p>
              <strong className="text-[#F3F0E8]">Billing Cycles:</strong> Subscription tiers (Starter, Pro, Growth) are billed on a recurring monthly or annual basis. Fees are non-refundable once the billing period has commenced, except where mandated by local law.
            </p>
            <p>
              <strong className="text-[#F3F0E8]">UPI &amp; Crypto Payments:</strong> For instant platform activation, payments processed via UPI or direct Web3 cryptocurrency settlement must be accompanied by valid transaction reference records (UTR / txHash) for automated verification.
            </p>
            <p>
              <strong className="text-[#F3F0E8]">Plan Cancellation:</strong> You may cancel your subscription at any time via your clinic billing dashboard. Access remains active through the end of the paid billing period.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            6. Limitation of Liability
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-3">
            To the maximum extent permitted by applicable law:
          </p>
          <ul className="space-y-2 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>AI Front Desk is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied.</li>
            <li>In no event shall AI Front Desk, its directors, employees, or partners be liable for indirect, incidental, consequential, special, or punitive damages, including loss of profits, loss of data, or clinic downtime.</li>
            <li>Our total cumulative liability arising out of or related to these terms shall not exceed the total fees paid by you to AI Front Desk in the twelve (12) months preceding the incident.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            7. Termination
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these Terms, breach security protocols, or engage in abusive messaging practices. Upon termination, your right to use the Service immediately ceases, and you may request an export of your appointment data within 30 days.
          </p>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            8. Governing Law &amp; Contact
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-4">
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
          <div className="p-5 rounded-2xl bg-[#171614] border border-[#F3F0E8]/08 text-xs space-y-1.5">
            <p className="font-semibold text-sm text-[#F3F0E8]">Questions regarding these Terms of Service?</p>
            <p className="text-[#9E9B93]">
              Contact legal:{' '}
              <a href="mailto:legal@aifrontdesk.com" className="text-[#E87A38] hover:underline font-mono">
                legal@aifrontdesk.com
              </a>
              {' '}&bull;{' '}
              <a href="mailto:support@aifrontdesk.com" className="text-[#E87A38] hover:underline font-mono">
                support@aifrontdesk.com
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#F3F0E8]/08 py-10 bg-[#0D0D0C] text-center text-xs text-[#9E9B93]">
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          <Link href="/privacy" className="text-[#9E9B93] hover:text-[#F3F0E8]">Privacy Policy</Link>
          <Link href="/tos" className="text-[#E87A38]">Terms of Service</Link>
          <Link href="/" className="text-[#9E9B93] hover:text-[#F3F0E8]">Home</Link>
          <Link href="/dashboard" className="text-[#9E9B93] hover:text-[#F3F0E8]">Dashboard</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Arenova AI Front Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
