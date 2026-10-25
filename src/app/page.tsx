import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { InteractiveBotComparison } from '@/components/landing/InteractiveBotComparison';
import { HeroInteractivePreview } from '@/components/landing/HeroInteractivePreview';

export const metadata: Metadata = {
  title: 'AI Front Desk - Premium AI Receptionist for Clinics & Practices',
  description:
    'Transform the way your practice works. Deploy a cinematic, intelligent 24/7 AI receptionist on WhatsApp. Answers queries, coordinates doctor availability, and books appointments seamlessly.',
  openGraph: {
    title: 'Arenova AI Front Desk - Transform the Way Your Business Works',
    description:
      'Transform the way your practice works. Deploy an intelligent 24/7 AI receptionist on WhatsApp for modern clinics and appointment practices.',
    url: '/',
    siteName: 'Arenova AI Front Desk',
    images: [
      {
        url: '/metadata.png',
        width: 2912,
        height: 1440,
        alt: 'Arenova AI Front Desk — Transform the way your business works',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arenova AI Front Desk — Transform the Way Your Business Works',
    description:
      'Transform the way your practice works. Intelligent 24/7 AI receptionist for clinics and appointment practices.',
    images: ['/metadata.png'],
  },
};

const featureBento = [
  {
    icon: '💬',
    tag: 'AUTONOMOUS RECEPTION',
    title: '24/7 WhatsApp Conversational Receptionist',
    description: 'Empathetic, context-aware AI that answers patient questions, explains clinic procedures, quotes standard pricing, and confirms operational hours — day or night.',
    highlight: 'Instant 1.2s response time',
  },
  {
    icon: '📅',
    tag: 'SCHEDULE ORCHESTRATION',
    title: 'Zero-Conflict Google Calendar 2-Way Sync',
    description: 'Reads your real doctor schedule in real time. Offers open consultation slots, books confirmed appointments directly, and frees cancelled slots automatically.',
    highlight: 'Zero double bookings',
  },
  {
    icon: '🏷️',
    tag: 'CLINICAL TRIAGE',
    title: 'Custom Service Catalog & Pricing Calculator',
    description: 'Configure doctor consultation fees, procedure durations, and preparation guidelines. The AI accurately quotes treatments according to your clinic rules.',
    highlight: 'Accurate treatment quoting',
  },
  {
    icon: '🚨',
    tag: 'CLINICAL SAFETY',
    title: 'Medical Emergency Safety Sentinel',
    description: 'Trained to recognize acute red flag symptoms. Immediately provides local emergency dispatch numbers (112 / 911) and alerts clinic staff for urgent intervention.',
    highlight: 'Patient safety protocols',
  },
  {
    icon: '👥',
    tag: 'HUMAN TAKEOVER',
    title: 'Instant Human Staff Takeover',
    description: 'Your clinic team can pause the AI and chat directly with any patient from the inbox canvas at any moment. Seamless handover with zero patient disruption.',
    highlight: '1-click manual override',
  },
  {
    icon: '⚡',
    tag: 'FINANCIAL SETTLEMENT',
    title: 'Domestic UPI & Global Web3 Crypto Billing',
    description: 'Activate your clinic tier instantly via UPI QR or international cryptocurrency settlement (USDT, USDC on Polygon/TRON/Ethereum) with zero payment friction.',
    highlight: 'Automated instant activation',
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
    description: 'Enter your clinic name, doctors, operating hours, treatment catalog, and tone of voice in our guided 8-step console.',
  },
  {
    number: '02',
    tag: 'CHANNELS',
    title: 'Connect WhatsApp & Google Calendar',
    description: 'Pair your clinic WhatsApp number just like WhatsApp Web, and authorize Google Calendar with 1-click OAuth sync.',
  },
  {
    number: '03',
    tag: 'SANDBOX TESTING',
    title: 'Verify in Live Testing Playground',
    description: 'Simulate patient inquiries in the built-in test sandbox. Verify procedure quotes, emergency escalations, and schedule booking.',
  },
  {
    number: '04',
    tag: 'AUTONOMOUS RECEPTION',
    title: 'Go Live with 24/7 Coverage',
    description: 'Activate your subscription. Your AI receptionist immediately handles incoming patient chats and synchronizes doctor appointments.',
  },
];

const faqs = [
  {
    q: 'Does AI Front Desk replace my existing human receptionist?',
    a: 'No. AI Front Desk acts as an autonomous co-pilot that handles high-volume routine inquiries, pricing questions, after-hours messages, and calendar scheduling. Your staff is freed from answering the same questions all day and can focus entirely on in-person patient hospitality.',
  },
  {
    q: 'How does WhatsApp pairing work? Do I need Meta developer credentials?',
    a: 'No Meta developer account or API approval is required. You can connect any existing clinic phone number directly using WhatsApp Linked Devices (scanning a QR code or entering an 8-character code), exactly like WhatsApp Web. It takes less than 60 seconds.',
  },
  {
    q: 'How does it prevent double-bookings on Google Calendar?',
    a: 'Before offering any slot to a patient on WhatsApp, the AI makes a live real-time query to the doctor’s Google Calendar. It only suggests confirmed free openings between clinic operating hours and accounts for appointment buffer times.',
  },
  {
    q: 'Can the AI speak in Hindi or regional languages?',
    a: 'Yes. Powered by Google Gemini AI, the receptionist fluently understands and responds in English, Hindi, Hinglish, Spanish, French, and over 10 other languages, adapting naturally to the patient’s phrasing.',
  },
  {
    q: 'What happens if a patient has a medical emergency?',
    a: 'AI Front Desk is strictly an administrative coordination platform. It has built-in safety rails that immediately detect emergency red-flag symptoms (chest pain, shortness of breath, heavy trauma) and instructs the patient to call emergency services (112 / 911) or proceed to the nearest emergency room.',
  },
  {
    q: 'What payment methods do you support for clinic subscriptions?',
    a: 'We support instant domestic UPI (Google Pay, PhonePe, Paytm, BHIM) with transaction reference verification for Indian clinics, as well as multi-network Web3 cryptocurrency settlement (USDT TRC-20, USDT ERC-20, USDC Polygon, ETH, BTC) for international practices.',
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
          Autonomous Healthcare Front Desk &bull; Powered by Google Gemini
        </div>

        {/* Editorial Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6.5vw, 5rem)',
          fontWeight: 500,
          lineHeight: 1.06,
          maxWidth: '920px',
          marginBottom: '1.25rem',
          letterSpacing: '-0.03em',
          color: 'var(--color-text-primary)',
        }}>
          Your clinic&apos;s front desk.{' '}
          <br />
          <span className="text-gradient-flame">Always one step ahead.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: 'var(--color-text-secondary)',
          maxWidth: '680px',
          marginBottom: '2rem',
          lineHeight: 1.65,
          fontWeight: 400,
        }}>
          Deploy an intelligent, 24/7 AI receptionist on WhatsApp for your practice.
          Answers patient inquiries, checks real-time doctor availability, quotes procedure fees, and locks appointments directly into Google Calendar.
        </p>

        {/* Hero CTAs */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '520px', marginBottom: '1.5rem' }}>
          <Link href="/register" className="btn btn-primary btn-lg" style={{ flex: '1 1 210px', textAlign: 'center', height: '52px', fontSize: '1rem', fontWeight: 600 }}>
            Start Free Trial →
          </Link>
          <Link href="#bot-comparison" className="btn btn-secondary btn-lg" style={{ flex: '1 1 190px', textAlign: 'center', height: '52px', fontSize: '0.95rem' }}>
            Compare With / Without AI
          </Link>
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
      <footer style={{
        padding: '3rem clamp(1rem, 5vw, 3rem) 2rem',
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-charcoal)',
        color: 'var(--color-text-muted)',
        fontSize: '0.825rem',
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Image
              src="/arenova.png"
              alt="Arenova"
              width={32}
              height={32}
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
              }}
            />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              AI Front Desk
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
            <Link href="#features" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Features</Link>
            <Link href="#bot-comparison" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Comparison</Link>
            <Link href="#pricing" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/privacy" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/tos" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/login" style={{ color: 'var(--color-amber)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>

        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
        }}>
          <div>
            &copy; {new Date().getFullYear()} Arenova AI Front Desk. All rights reserved.
          </div>
          <div>
            Google Calendar API Limited Use Compliant &bull; Meta WhatsApp Multi-Device Direct
          </div>
        </div>
      </footer>
    </div>
  );
}
