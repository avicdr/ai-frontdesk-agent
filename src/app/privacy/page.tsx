import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy and Google API Limited Use disclosure for AI Front Desk.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#111110] text-[#F3F0E8] relative overflow-hidden">
      <LandingNavbar />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 leading-relaxed relative z-10 animate-fade-in">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#F3F0E8]/08">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E84B2C]/10 border border-[#E84B2C]/30 text-[#E87A38] text-[10px] font-mono uppercase tracking-widest font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            Legal Documentation
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#F3F0E8] mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-[#9E9B93]">
            Effective Date: October 20, 2024 • Last Updated: October 2026
          </p>
        </div>

        {/* Highlight Alert Box for Google Limited Use Policy */}
        <div className="p-6 rounded-2xl bg-[#171614] border border-[#E84B2C]/30 mb-10 shadow-[0_4px_24px_rgba(232,75,44,0.08)]">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-lg">🛡️</span>
            <h3 className="font-heading text-base font-semibold text-[#E87A38] m-0">
              Google API Services User Data Policy Compliance
            </h3>
          </div>
          <p className="text-xs text-[#D0CBC1] leading-relaxed">
            AI Front Desk’s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E87A38] underline hover:text-[#E84B2C]"
            >
              Google API Services User Data Policy
            </a>
            , including the <strong className="text-[#F3F0E8]">Limited Use</strong> requirements.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            1. Introduction
          </h2>
          <p className="text-xs text-[#D0CBC1] leading-relaxed mb-3">
            Welcome to <strong className="text-[#F3F0E8]">AI Front Desk</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We provide an artificial intelligence-driven front desk and appointment coordination platform designed for clinics, medical practices, dentists, therapists, and healthcare providers.
          </p>
          <p className="text-xs text-[#D0CBC1] leading-relaxed">
            This Privacy Policy explains how we collect, use, disclose, and protect personal and clinic data when you access our software, connect third-party integrations (including Google Calendar and WhatsApp), and interact with our automated reception service.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            2. Information We Collect
          </h2>
          <p className="text-xs text-[#D0CBC1] mb-3">
            We collect the following categories of information to provide and maintain our services:
          </p>
          <ul className="space-y-2.5 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>
              <strong className="text-[#F3F0E8]">Clinic & Provider Account Information:</strong> Clinic name, healthcare specialty, doctor/clinician names, physical address, business phone number, timezone, operating hours, service catalog, and treatment pricing.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Patient & Conversation Data:</strong> WhatsApp phone numbers, patient names, requested appointment slots, and appointment inquiry messages processed by the AI receptionist.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Google Account & Calendar Data:</strong> When a clinic connects Google Calendar, we receive OAuth tokens, the clinic doctor&rsquo;s Google email address, calendar identifiers, and event busy/free schedule windows to prevent double-bookings.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Technical & Usage Data:</strong> IP addresses, browser types, session timestamps, and system performance logs to ensure system reliability and security.
            </li>
          </ul>
        </section>

        {/* Section 3 - Google Data Disclosure */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            3. How We Use Google Calendar Data (Google User Data Policy)
          </h2>
          <p className="text-xs text-[#D0CBC1] mb-3">
            When a clinic administrator authorizes the Google Calendar integration, AI Front Desk requests the following OAuth 2.0 scopes:
          </p>
          <div className="p-3.5 rounded-xl bg-[#171614] border border-[#F3F0E8]/08 font-mono text-xs text-[#E87A38] mb-3 space-y-1">
            <div>• https://www.googleapis.com/auth/calendar.events</div>
            <div>• https://www.googleapis.com/auth/calendar</div>
          </div>
          <p className="text-xs text-[#D0CBC1] mb-2">
            We strictly limit our access and use of Google Calendar data to:
          </p>
          <ul className="space-y-1.5 text-xs text-[#D0CBC1] pl-4 list-disc mb-4">
            <li>Checking real-time calendar availability and busy intervals to avoid conflicting patient appointments.</li>
            <li>Writing, rescheduling, or removing confirmed patient bookings made through the clinic&rsquo;s WhatsApp channel.</li>
          </ul>
          <p className="text-xs text-[#F3F0E8] font-semibold mb-2">
            Specific Protections for Google User Data:
          </p>
          <ul className="space-y-1.5 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>We <strong className="text-[#F3F0E8]">NEVER</strong> use Google user data for serving advertisements.</li>
            <li>We <strong className="text-[#F3F0E8]">NEVER</strong> sell or transfer Google user data to third-party data brokers or marketing platforms.</li>
            <li>We <strong className="text-[#F3F0E8]">NEVER</strong> use Google user data to train generalized AI or foundation machine learning models.</li>
            <li>Humans do not read your calendar event details, except with your express permission in specific troubleshooting situations or when legally required.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            4. Data Storage, Encryption & Security
          </h2>
          <p className="text-xs text-[#D0CBC1] mb-3">
            We implement industry-grade technical and organizational safeguards:
          </p>
          <ul className="space-y-2.5 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>
              <strong className="text-[#F3F0E8]">AES-256-GCM Encryption:</strong> Sensitive third-party credentials, including Google OAuth refresh tokens and WhatsApp session keys, are encrypted at rest using AES-256-GCM.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Encryption in Transit:</strong> All communications between patients, clinics, our servers, and third-party APIs are encrypted using TLS 1.3/HTTPS.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Multi-Tenant Isolation:</strong> Patient records and clinic configurations are protected by strict Row-Level Security (RLS) policies preventing cross-organization data access.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            5. Data Retention & Revocation of Access
          </h2>
          <p className="text-xs text-[#D0CBC1] mb-3">
            We retain information only as long as necessary to provide the service to your clinic:
          </p>
          <ul className="space-y-2.5 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li>
              <strong className="text-[#F3F0E8]">Disconnecting Google Calendar:</strong> You can disconnect Google Calendar anytime directly from the <em>Dashboard &gt; Clinic Integrations</em> tab. Upon disconnection, stored tokens are permanently deleted from our database.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Google Account Permissions:</strong> You can also revoke our app&rsquo;s access anytime by visiting your{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E87A38] underline hover:text-[#E84B2C]"
              >
                Google Account Security Settings
              </a>.
            </li>
            <li>
              <strong className="text-[#F3F0E8]">Account Deletion:</strong> Clinic administrators can request complete deletion of their account, appointments, and knowledge bases by contacting our support team.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            6. Third-Party Service Providers
          </h2>
          <p className="text-xs text-[#D0CBC1] mb-3">
            We integrate with trusted third-party cloud infrastructure to deliver our product:
          </p>
          <ul className="space-y-2 text-xs text-[#D0CBC1] pl-4 list-disc">
            <li><strong className="text-[#F3F0E8]">Supabase:</strong> Encrypted PostgreSQL database hosting and authentication.</li>
            <li><strong className="text-[#F3F0E8]">Google Gemini / OpenAI:</strong> Natural language processing for understanding appointment requests and generating receptionist responses.</li>
            <li><strong className="text-[#F3F0E8]">Meta / WhatsApp:</strong> Message delivery to patient WhatsApp chats.</li>
            <li><strong className="text-[#F3F0E8]">Google Calendar API:</strong> Doctor schedule synchronization.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="font-heading text-lg font-semibold text-[#F3F0E8] mb-3">
            7. Contact Us
          </h2>
          <p className="text-xs text-[#D0CBC1] mb-3">
            If you have questions about this Privacy Policy, your clinic&rsquo;s data, or our compliance with Google API policies, please reach out:
          </p>
          <div className="p-5 rounded-2xl bg-[#171614] border border-[#F3F0E8]/08 text-xs space-y-1.5">
            <p className="font-semibold text-sm text-[#F3F0E8]">AI Front Desk Privacy &amp; Security Team</p>
            <p className="text-[#9E9B93]">
              Email:{' '}
              <a href="mailto:privacy@aifrontdesk.com" className="text-[#E87A38] hover:underline font-mono">
                privacy@aifrontdesk.com
              </a>
            </p>
            <p className="text-[#9E9B93]">
              Support:{' '}
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
          <Link href="/privacy" className="text-[#E87A38]">Privacy Policy</Link>
          <Link href="/tos" className="text-[#9E9B93] hover:text-[#F3F0E8]">Terms of Service</Link>
          <Link href="/" className="text-[#9E9B93] hover:text-[#F3F0E8]">Home</Link>
          <Link href="/dashboard" className="text-[#9E9B93] hover:text-[#F3F0E8]">Dashboard</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Arenova AI Front Desk. All rights reserved.</p>
      </footer>
    </div>
  );
}
