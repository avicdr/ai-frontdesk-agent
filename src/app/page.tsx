import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFooter } from '@/components/navigation/LandingFooter';
import { InteractiveBotComparison } from '@/components/landing/InteractiveBotComparison';
import { HeroInteractivePreview } from '@/components/landing/HeroInteractivePreview';

export const metadata: Metadata = {
  title: 'Arenova | AI WhatsApp Receptionist Software for Clinics',
  description:
    "Arenova helps clinics automate patient enquiries, share clinic information, and manage appointment requests through WhatsApp — so your team can spend less time answering repetitive questions and more time caring for patients.",
  openGraph: {
    title: 'Arenova | AI WhatsApp Receptionist Software for Clinics',
    description:
      'Automate clinic enquiries, share practice information, and manage appointment requests with Arenova’s AI-powered WhatsApp receptionist software.',
    url: '/',
    siteName: 'Arenova',
    images: [
      {
        url: '/metadata.png',
        width: 2912,
        height: 1440,
        alt: 'Arenova — AI WhatsApp Receptionist Software for Clinics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arenova | AI WhatsApp Receptionist Software for Clinics',
    description:
      'Automate clinic enquiries, share practice information, and manage appointment requests with Arenova’s AI-powered WhatsApp receptionist software.',
    images: ['/metadata.png'],
  },
};

const featureBento = [
  {
    icon: '💬',
    tag: 'CLINIC COMMUNICATION',
    title: '24/7 WhatsApp AI Receptionist for Clinics',
    description: 'Empathetic, context-aware AI assistant that answers routine patient enquiries, explains clinic procedures, operating hours, and location details on behalf of your practice.',
    highlight: 'Instant 1.2s response time',
  },
  {
    icon: '📅',
    tag: 'ADMINISTRATIVE WORKFLOW',
    title: 'Appointment Request Assistance & Calendar Coordination',
    description: 'Assists patients with appointment booking requests according to your clinic schedule rules. Connects directly with your clinic Google Calendar to eliminate scheduling collisions.',
    highlight: 'Zero double bookings',
  },
  {
    icon: '🏷️',
    tag: 'PRACTICE INFORMATION',
    title: 'Custom Procedure FAQ & Standard Fee Guidance',
    description: 'Configure standard consultation fees, procedure durations, and preparation guidelines. The AI accurately shares clinic guidelines according to your practice rules.',
    highlight: 'Accurate clinic quoting',
  },
  {
    icon: '🚨',
    tag: 'PATIENT SAFETY',
    title: 'Emergency Red-Flag Detection & Referral',
    description: 'Equipped with safety rails to recognize acute symptoms. Immediately instructs patients to contact emergency services (112 / 911) or visit the nearest emergency hospital.',
    highlight: 'Patient safety protocols',
  },
  {
    icon: '👥',
    tag: 'HUMAN OVERSIGHT',
    title: '1-Click Clinic Staff Takeover',
    description: 'Your clinic reception team can pause the AI and chat directly with any patient from the inbox canvas at any moment. Seamless handover with zero disruption.',
    highlight: '1-click manual override',
  },
  {
    icon: '💳',
    tag: 'TRANSPARENT BILLING',
    title: 'Predictable Indian Rupee (INR) SaaS Subscriptions',
    description: 'Subscribe your clinic with simple monthly or annual software tiers. Instant activation via UPI or Netbanking with GST invoices and no long-term lock-in.',
    highlight: 'Standard B2B SaaS pricing',
  },
];

const specialties = [
  {
    name: 'Dental & Orthodontics',
    icon: '🦷',
    commonQueries: 'Root canals, teeth cleaning, aligner pricing, toothache emergencies',
    metric: '+38% bookings',
  },
  {
    name: 'Dermatology & Aesthetics',
    icon: '✨',
    commonQueries: 'Acne triage, chemical peels, hydrafacial sessions, laser consultation',
    metric: '+45% new patients',
  },
  {
    name: 'General Medicine & Paediatrics',
    icon: '🩺',
    commonQueries: 'Viral fevers, routine vaccination schedules, doctor OPD timing',
    metric: '-80% phone hold time',
  },
  {
    name: 'Physiotherapy & Sports Rehab',
    icon: '🏃',
    commonQueries: 'Back pain assessment, post-surgery rehabilitation, session packages',
    metric: '94% slot occupancy',
  },
  {
    name: 'Psychiatry & Therapy',
    icon: '🧠',
    commonQueries: 'Confidential 1-on-1 sessions, anxiety management, weekend slots',
    metric: '100% private triage',
  },
  {
    name: 'Speciality Surgery & Consultations',
    icon: '🏥',
    commonQueries: 'Second opinions, pre-operative instructions, doctor roster inquiry',
    metric: '0 missed inquiries',
  },
];

const steps = [
  {
    number: '01',
    tag: 'CLINIC ONBOARDING',
    title: 'Register & Calibrate AI Persona',
    description: 'Enter your clinic name, operating hours, procedure catalog, and tone of voice in our guided console.',
  },
  {
    number: '02',
    tag: 'CHANNELS',
    title: 'Connect WhatsApp & Google Calendar',
    description: 'Pair your clinic WhatsApp number directly via QR code, and authorize Google Calendar with 1-click OAuth sync.',
  },
  {
    number: '03',
    tag: 'SANDBOX TESTING',
    title: 'Verify in Live Testing Playground',
    description: 'Simulate patient inquiries in the built-in sandbox. Verify clinic procedure details, emergency escalations, and appointment coordination.',
  },
  {
    number: '04',
    tag: 'AUTONOMOUS RECEPTION',
    title: 'Go Live with 24/7 Coverage',
    description: 'Activate your software subscription. Your AI receptionist immediately answers routine patient chats on behalf of your clinic.',
  },
];

const faqs = [
  {
    q: 'Does Arenova replace my clinic’s human receptionist?',
    a: 'No. Arenova operates as an administrative co-pilot that handles high-volume routine patient enquiries, clinic information, opening hours, and appointment requests on WhatsApp. Your staff is freed from answering repetitive phone calls all day and can focus entirely on in-person patient hospitality.',
  },
  {
    q: 'How does clinic WhatsApp connection work? Do I need Meta developer credentials?',
    a: 'No Meta developer account or API approval is required. Clinics connect their dedicated clinic phone number directly using WhatsApp Linked Devices (scanning a QR code or entering a linking code), exactly like WhatsApp Web. It takes less than 60 seconds.',
  },
  {
    q: 'How does appointment request assistance work with our clinic calendar?',
    a: 'Arenova acts strictly as an administrative coordination assistant for your individual clinic. When a patient requests an appointment, the assistant queries your clinic’s Google Calendar for open slots and writes the confirmed request into your calendar, preventing double-bookings.',
  },
  {
    q: 'Does Arenova operate a doctor-booking marketplace or provide medical consultations?',
    a: 'No. Arenova is strictly a B2B SaaS software provider. Arenova is NOT a doctor-booking marketplace, aggregator, or healthcare provider. We do NOT employ doctors, provide medical consultations, diagnose medical conditions, or prescribe treatments. Each subscribing clinic uses Arenova software independently for its own front-desk administrative communication.',
  },
  {
    q: 'Can the AI speak in Hindi or regional languages?',
    a: 'Yes. Powered by Google Gemini AI, the receptionist fluently understands and responds in English, Hindi, Hinglish, and over 10 other languages, adapting naturally to patient phrasing.',
  },
  {
    q: 'What happens if a patient mentions a medical emergency?',
    a: 'Arenova is strictly an administrative communication platform. Built-in clinical safety rails immediately recognize acute red-flag symptoms (chest pain, severe breathlessness, heavy trauma) and instruct the patient to contact national emergency services (112 / 911) or proceed immediately to the nearest hospital emergency room.',
  },
  {
    q: 'What payment methods are supported for clinic software subscriptions?',
    a: 'We support secure Indian Rupee (INR) subscriptions via UPI (Google Pay, PhonePe, Paytm, BHIM) and Netbanking / Cards for subscribing clinics. All subscriptions include GST tax invoices and renewal receipts.',
  },
];

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--color-obsidian)', color: 'var(--color-text-primary)' }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1000px',
        height: '750px',
        background: 'radial-gradient(ellipse, rgba(232, 75, 44, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ============ NAVBAR ============ */}
      <LandingNavbar />

      {/* ============ HERO SECTION ============ */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(6.5rem, 11vw, 8.5rem) clamp(1rem, 5vw, 3rem) clamp(2.5rem, 5vw, 4rem)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Intelligence Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 1rem',
          borderRadius: '9999px',
          background: 'rgba(232, 75, 44, 0.12)',
          border: '1px solid rgba(232, 75, 44, 0.3)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: 'var(--color-amber)',
          marginBottom: '1.5rem',
          letterSpacing: '0.04em',
          boxShadow: '0 0 20px rgba(232, 75, 44, 0.18)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-flame)', boxShadow: '0 0 8px var(--color-flame)' }} />
          B2B SaaS Software for Healthcare Practices &bull; Powered by Google Gemini
        </div>

        {/* Editorial Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 6vw, 4.75rem)',
          fontWeight: 600,
          lineHeight: 1.08,
          maxWidth: '960px',
          marginBottom: '1.25rem',
          letterSpacing: '-0.03em',
          color: 'var(--color-text-primary)',
        }}>
          Your Clinic&apos;s AI Receptionist,{' '}
          <br />
          <span className="text-gradient-flame">Available 24/7.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.18rem)',
          color: 'var(--color-text-secondary)',
          maxWidth: '740px',
          marginBottom: '1.75rem',
          lineHeight: 1.65,
          fontWeight: 400,
        }}>
          Arenova helps clinics automate patient enquiries, share clinic information, and manage appointment requests through WhatsApp — so your team can spend less time answering repetitive questions and more time caring for patients.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '520px', marginBottom: '1.75rem' }}>
          <Link href="/register" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px', textAlign: 'center', height: '52px', fontSize: '1rem', fontWeight: 600 }}>
            Get Started →
          </Link>
          <Link href="/pricing" className="btn btn-secondary btn-lg" style={{ flex: '1 1 180px', textAlign: 'center', height: '52px', fontSize: '0.95rem' }}>
            View Pricing
          </Link>
        </div>

        {/* Clear Business-Model Statement Callout */}
        <div style={{
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto 1.5rem auto',
          padding: '1rem 1.35rem',
          borderRadius: '14px',
          background: 'rgba(232, 75, 44, 0.08)',
          border: '1px solid rgba(232, 75, 44, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            Built for clinics and healthcare practices. Subscription-based software for patient communication and administrative workflows.
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.55,
          }}>
            Subscribe to Arenova to access AI-powered WhatsApp receptionist software, configure your clinic&apos;s assistant, and automate routine patient communications.
          </div>
        </div>

        {/* 4 Core Visible SaaS Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
          width: '100%',
          maxWidth: '920px',
          margin: '0 auto 2rem auto',
          textAlign: 'left',
        }}>
          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
          }}>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
              01 &bull; Who It Serves
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Healthcare Practices
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Clinics, dental clinics, physiotherapy centers, and medical offices.
            </div>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
          }}>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
              02 &bull; What It Provides
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Reception Automation
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              AI-powered WhatsApp communication and virtual receptionist software.
            </div>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
          }}>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
              03 &bull; What It Automates
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Routine Enquiries
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Frequently asked questions, clinic hours, location details, and appointment requests.
            </div>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-standard)',
          }}>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
              04 &bull; What You Pay For
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Software Access
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Software access, onboarding/setup, and ongoing AI receptionist usage according to plan.
            </div>
          </div>
        </div>

        {/* Medical & Healthcare Software Notice Banner */}
        <div style={{
          width: '100%',
          maxWidth: '920px',
          margin: '0 auto 2.25rem auto',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          background: 'var(--color-surface-secondary)',
          border: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          fontSize: '0.76rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          <span style={{ color: 'var(--color-amber)', fontSize: '1rem' }}>🛡️</span>
          <span>
            <strong style={{ color: 'var(--color-text-primary)' }}>Important Notice:</strong> Arenova provides front-desk administrative software. Arenova does not employ doctors, provide medical consultations, diagnoses, or prescriptions, or operate an open doctor-booking marketplace. All consultations and medical services are provided independently by subscribing clinics.
          </span>
        </div>

        {/* Micro Trust Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          flexWrap: 'wrap',
          fontSize: '0.78rem',
          color: 'var(--color-text-muted)',
          marginBottom: '2.75rem',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            ✓ No Meta API required
          </span>
          <span>&bull;</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            ✓ 60-second QR setup
          </span>
          <span>&bull;</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            ✓ Free 3-day full operational trial
          </span>
        </div>

        {/* Cinematic Live WhatsApp Demonstration Widget */}
        <HeroInteractivePreview />

        {/* Live Operational Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          width: '100%',
          maxWidth: '860px',
          padding: '1.25rem 1.75rem',
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-standard)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2.5rem',
        }}>
          {[
            { value: '24/7', label: 'Always Available', note: 'Zero night dropoff' },
            { value: '1.2s', label: 'Response Latency', note: 'Instant WhatsApp reply' },
            { value: '100%', label: 'Calendar Accuracy', note: '2-way Google sync' },
            { value: '₹45k+', label: 'Monthly ROI', note: 'Recaptured lost leads' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--color-amber)',
                fontFamily: 'var(--font-mono)',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-primary)', marginTop: '0.15rem', fontWeight: 600 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                {stat.note}
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Specialty Logos Ticker */}
        <div style={{
          width: '100%',
          maxWidth: '860px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
          }}>
            Specially Calibrated For Medical & Dental Practices
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            color: 'var(--color-text-secondary)',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}>
            <span>🦷 Dental & Orthodontics</span>
            <span>✨ Dermatology & Aesthetics</span>
            <span>🩺 General Practice OPD</span>
            <span>🏃 Physio & Sports Rehab</span>
            <span>🧠 Psychiatry & Therapy</span>
          </div>
        </div>
      </section>

      {/* ============ INTERACTIVE BOT COMPARISON (WITH VS WITHOUT AI) ============ */}
      <section id="bot-comparison" style={{
        padding: 'clamp(4.5rem, 9vw, 7rem) clamp(1rem, 5vw, 3rem)',
        background: 'linear-gradient(180deg, transparent 0%, rgba(232, 75, 44, 0.04) 50%, transparent 100%)',
        position: 'relative',
        zIndex: 2,
      }}>
        <InteractiveBotComparison />
      </section>

      {/* ============ WHY CLINICS ARE SWITCHING (4 PAIN POINT CONTRAST CARDS) ============ */}
      <section style={{
        padding: 'clamp(4rem, 8vw, 6.5rem) clamp(1rem, 5vw, 3rem)',
        maxWidth: '1240px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.28rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.25)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-amber)',
            marginBottom: '0.85rem',
          }}>
            Front Desk Economics
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 500,
            marginBottom: '0.65rem',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em',
          }}>
            The real cost of missed clinic inquiries
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            Modern patients expect instant answers on WhatsApp. When your front desk phone is busy or closed, patients book the next clinic on Google.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {[
            {
              stat: '42%',
              badge: 'AFTER-HOURS LOSS',
              title: 'Searches Happen Late at Night',
              desc: 'Toothaches, acute rashes, and pediatric fevers peak between 8 PM and 7 AM when clinics are shut. Unanswered texts go straight to 24/7 hospitals.',
            },
            {
              stat: '3.5 hrs',
              badge: 'STAFF DRAIN',
              title: 'Daily Telephone Hold Overhead',
              desc: 'Front desk staff spend hours repeating driving directions, consultation fees, and doctor timings instead of comforting in-clinic patients.',
            },
            {
              stat: '14%',
              badge: 'ROSTER CHAOS',
              title: 'Manual Double-Booked Chairs',
              desc: 'Paper registers and disconnected WhatsApp notes cause schedule collisions. Doctor time is wasted while overlapping patients sit frustrated.',
            },
            {
              stat: '₹60,000+',
              badge: 'REVENUE LEAK',
              title: 'Lost Patient Lifetime Value',
              desc: 'Every lost routine cleaning or skin consultation inquiry represents missed follow-on procedures, treatments, and family referrals.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-amber)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  marginBottom: '0.45rem',
                }}>
                  {card.badge}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-flame)',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.65rem',
                }}>
                  {card.stat}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURE BENTO GRID (6 RICH CARDS) ============ */}
      <section id="features" style={{
        padding: 'clamp(4.5rem, 9vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
        maxWidth: '1240px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.28rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.25)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-amber)',
            marginBottom: '0.85rem',
          }}>
            Engineered Capabilities
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
            fontWeight: 500,
            marginBottom: '0.65rem',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em',
          }}>
            Everything modern clinics need to scale
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>
            A complete AI operations platform engineered for patient trust, scheduling speed, and medical front-desk clarity.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {featureBento.map((item, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '2rem',
                borderRadius: '18px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'var(--color-surface-secondary)',
                    border: '1px solid var(--color-border-standard)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-amber)',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                  }}>
                    {item.tag}
                  </span>
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.65rem',
                  letterSpacing: '-0.015em',
                }}>
                  {item.title}
                </h3>

                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {item.description}
                </p>
              </div>

              <div style={{
                marginTop: '1.5rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-success)',
                fontWeight: 600,
              }}>
                <span>✓</span>
                <span>{item.highlight}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PRACTICE SPECIALTIES (6 CLINIC TYPES) ============ */}
      <section style={{
        padding: 'clamp(4.5rem, 8vw, 6.5rem) clamp(1rem, 5vw, 3rem)',
        background: 'var(--color-surface-secondary)',
        borderTop: '1px solid var(--color-border-subtle)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.28rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(232, 75, 44, 0.12)',
              border: '1px solid rgba(232, 75, 44, 0.25)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-amber)',
              marginBottom: '0.85rem',
            }}>
              Practice Specialization
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: '0.65rem',
            }}>
              Calibrated for your clinical domain
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.95rem, 1.8vw, 1.05rem)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
              Whether you manage an orthodontic clinic, medical dermatology suite, or multi-doctor polyclinic, the AI adopts your specialized clinical language.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.25rem',
          }}>
            {specialties.map((spec, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '1.75rem',
                  borderRadius: '16px',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border-standard)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>{spec.icon}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {spec.metric}
                    </span>
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '0.45rem',
                  }}>
                    {spec.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Trained Patient Inquiries:
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {spec.commonQueries}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 4-STEP ONBOARDING & DEPLOYMENT FLOW ============ */}
      <section id="how-it-works" style={{
        padding: 'clamp(4.5rem, 9vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
        maxWidth: '1240px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.28rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.25)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-amber)',
            marginBottom: '0.85rem',
          }}>
            Zero Engineering Overhead
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 500,
            marginBottom: '0.65rem',
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em',
          }}>
            From zero to live receptionist in 4 minutes
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
            No coding, no server maintenance, and no Meta developer verification needed.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}>
          {steps.map((step) => (
            <div
              key={step.number}
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '1.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--color-flame)',
                    letterSpacing: '-0.03em',
                  }}>
                    {step.number}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-amber)',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                  }}>
                    {step.tag}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.5rem',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PRICING SECTION ============ */}
      <LandingPricing />

      {/* ============ FAQ ACCORDION ============ */}
      <section style={{
        padding: 'clamp(4.5rem, 9vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
        maxWidth: '860px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.28rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.25)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-amber)',
            marginBottom: '0.85rem',
          }}>
            Got Questions?
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.025em',
          }}>
            Frequently asked questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '1.5rem',
                borderRadius: '14px',
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-standard)',
              }}
            >
              <h3 style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ color: 'var(--color-amber)', fontSize: '0.85rem' }}>✦</span>
                {faq.q}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0, paddingLeft: '1.35rem' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FINAL CALL TO ACTION ============ */}
      <section style={{
        padding: 'clamp(4.5rem, 8vw, 7rem) clamp(1rem, 5vw, 3rem)',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, rgba(232, 75, 44, 0.08) 100%)',
        borderTop: '1px solid var(--color-border-subtle)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.3)',
            color: 'var(--color-amber)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)' }} />
            Start in 4 Minutes &bull; 3-Day Operational Trial
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            marginBottom: '1.25rem',
            color: 'var(--color-text-primary)',
          }}>
            Ready to give your clinic a 24/7 AI front desk?
          </h2>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--color-text-secondary)',
            marginBottom: '2.5rem',
            lineHeight: 1.6,
          }}>
            Join modern clinics capturing appointments while they sleep. No credit card required.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              className="btn btn-primary btn-lg"
              style={{ padding: '0.85rem 2.25rem', fontSize: '1rem', fontWeight: 600 }}
            >
              Deploy Your Receptionist Now →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <LandingFooter />
    </div>
  );
}
