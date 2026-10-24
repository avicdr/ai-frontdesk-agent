import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingPricing } from '@/components/landing/LandingPricing';

export const metadata: Metadata = {
  title: 'AI Front Desk — Premium AI Receptionist for Clinics & Practices',
  description: 'Deploy a cinematic, intelligent AI receptionist on WhatsApp for your practice. Answers queries, coordinates availability, and books appointments 24/7.',
};

const features = [
  {
    icon: '💬',
    title: '24/7 WhatsApp Receptionist',
    description: 'Answer patient queries, share clinic info, and book appointments automatically via WhatsApp — even while you sleep.',
  },
  {
    icon: '📅',
    title: 'Google Calendar Integration',
    description: 'Checks your real calendar availability, books appointments, and handles cancellations with zero double bookings.',
  },
  {
    icon: '🤖',
    title: 'Powered by Gemini AI',
    description: 'State-of-the-art AI that understands context, handles complex multilingual queries, and knows when to escalate to a human.',
  },
  {
    icon: '🏥',
    title: 'Multi-Clinic Isolated Tenancy',
    description: 'Each clinic gets its own isolated environment, configuration, knowledge base, and full conversation telemetry.',
  },
  {
    icon: '⚡',
    title: 'Instant Automated Billing',
    description: 'Hassle-free subscription activation and seamless renewals via Instant UPI or Crypto (USDT, USDC, BTC, ETH).',
  },
  {
    icon: '🛡️',
    title: 'Privacy & Security First',
    description: 'Patient data stays strictly isolated. Full audit logs. Instant human takeover anytime with medical safety rails.',
  },
];

const steps = [
  { number: '01', title: 'Register & Configure', description: 'Enter clinic details, services, hours, and customized AI persona in our guided onboarding.' },
  { number: '02', title: 'Connect Integrations', description: 'Pair your WhatsApp Business number and sync Google Calendar in a single click.' },
  { number: '03', title: 'Test in Playground', description: 'Chat with your AI receptionist in the live test sandbox. Verify tool calls and schedules.' },
  { number: '04', title: 'Activate & Go Live', description: 'Subscribe and activate. Your AI receptionist immediately starts managing real patients.' },
];

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#111110', color: '#F3F0E8' }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '700px',
        background: 'radial-gradient(ellipse, rgba(232, 75, 44, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ============ NAVBAR ============ */}
      <LandingNavbar />

      {/* ============ HERO ============ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(7rem, 15vw, 10rem) clamp(1rem, 5vw, 3rem) clamp(4rem, 7vw, 6rem)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Intelligence Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.95rem',
          borderRadius: '9999px',
          background: 'rgba(232, 75, 44, 0.1)',
          border: '1px solid rgba(232, 75, 44, 0.25)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#E87A38',
          marginBottom: '2rem',
          letterSpacing: '0.04em',
          boxShadow: '0 0 20px rgba(232, 75, 44, 0.15)',
        }}>
          <span style={{ fontSize: '0.9rem' }}>✦</span> Powered by Google Gemini AI
        </div>

        {/* Editorial Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 7.5vw, 5rem)',
          fontWeight: 500,
          lineHeight: 1.06,
          maxWidth: '860px',
          marginBottom: '1.75rem',
          letterSpacing: '-0.03em',
          color: '#F3F0E8',
        }}>
          Your front desk.{' '}
          <br />
          <span className="text-gradient-flame">Always one step ahead.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
          color: '#D0CBC1',
          maxWidth: '620px',
          marginBottom: '2.5rem',
          lineHeight: 1.65,
          fontWeight: 400,
        }}>
          A cinematic AI receptionist for your clinic that answers patient queries, checks real-time
          calendar availability, and books appointments 24/7 on WhatsApp.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '480px' }}>
          <Link href="/register" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px', textAlign: 'center' }}>
            Start Free Trial →
          </Link>
          <Link href="#how-it-works" className="btn btn-secondary btn-lg" style={{ flex: '1 1 170px', textAlign: 'center' }}>
            See How It Works
          </Link>
        </div>

        {/* Operational Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'clamp(1rem, 3vw, 2.5rem)',
          marginTop: 'clamp(3.5rem, 8vw, 5.5rem)',
          width: '100%',
          maxWidth: '640px',
          padding: '1.5rem',
          background: 'rgba(23, 22, 20, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(243, 240, 232, 0.08)',
          borderRadius: '16px',
        }}>
          {[
            { value: '24/7', label: 'Always Available' },
            { value: '< 2s', label: 'Response Time' },
            { value: '10+', label: 'Languages' },
            { value: '0', label: 'Missed Queries' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2.1rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#E87A38',
                fontFamily: 'var(--font-sans)',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9E9B93', marginTop: '0.25rem', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Demo Chat Mockup Canvas */}
        <div id="demo" style={{
          marginTop: 'clamp(3.5rem, 8vw, 5.5rem)',
          background: '#171614',
          border: '1px solid rgba(243, 240, 232, 0.1)',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 3vw, 1.75rem)',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'left',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(232, 75, 44, 0.1)',
          position: 'relative',
        }}>
          {/* Warm ember accent border glow */}
          <div style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: '21px',
            background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.25), rgba(200, 105, 56, 0.08), transparent)',
            zIndex: -1,
            pointerEvents: 'none',
          }} />

          {/* Chat Window Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid rgba(243, 240, 232, 0.08)' }}>
            <Image
              src="/arenova.png"
              alt="Aria"
              width={40}
              height={40}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid rgba(232, 75, 44, 0.4)',
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#F3F0E8' }}>Aria — BrightSmile Dental</div>
              <div style={{ fontSize: '0.72rem', color: '#63C7A2', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#63C7A2', display: 'inline-block', boxShadow: '0 0 8px rgba(99, 199, 162, 0.6)' }} />
                Online &bull; WhatsApp Verified
              </div>
            </div>
          </div>

          {[
            { role: 'patient', text: 'Hi! I need to book a tooth cleaning for tomorrow' },
            { role: 'ai', text: "Hi! I'm Aria 😊 I'd be happy to help you book a cleaning. Let me check tomorrow's availability for you..." },
            { role: 'ai', text: "I found 3 available slots tomorrow:\n• 10:00 AM (45 min)\n• 2:30 PM (45 min)\n• 4:00 PM (45 min)\n\nWhich works best for you?" },
            { role: 'patient', text: '10 AM please! My name is Priya' },
            { role: 'ai', text: "Perfect! ✅ I've reserved Dental Cleaning on Monday at 10:00 AM. A calendar invitation & confirmation is sent to your phone. Can I help with anything else?" },
          ].map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'patient' ? 'flex-end' : 'flex-start',
              marginBottom: '0.65rem',
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '0.65rem 0.95rem',
                borderRadius: msg.role === 'patient' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'patient' ? '#E84B2C' : '#1C1916',
                border: msg.role === 'patient' ? '1px solid rgba(243, 240, 232, 0.15)' : '1px solid rgba(243, 240, 232, 0.08)',
                color: '#F3F0E8',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
                boxShadow: msg.role === 'patient' ? '0 2px 10px rgba(232, 75, 44, 0.3)' : '0 1px 4px rgba(0, 0, 0, 0.4)',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" style={{
        padding: 'clamp(4.5rem, 10vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
        maxWidth: '1240px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.28rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(232, 75, 44, 0.1)',
            border: '1px solid rgba(232, 75, 44, 0.25)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#E87A38',
            marginBottom: '1rem',
          }}>
            Platform Capabilities
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
            fontWeight: 500,
            marginBottom: '0.85rem',
            color: '#F3F0E8',
            letterSpacing: '-0.025em',
          }}>
            Everything your clinic needs
          </h2>
          <p style={{ color: '#9E9B93', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
            A complete AI operations platform engineered for patient trust, scheduling speed, and medical front-desk clarity.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '1px',
          background: 'rgba(243, 240, 232, 0.08)',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(243, 240, 232, 0.08)',
        }}>
          {features.map((feature, idx) => (
            <div key={feature.title} style={{
              padding: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              background: '#171614',
              position: 'relative',
              transition: 'background 0.2s ease',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: idx === 0 ? 'rgba(232, 75, 44, 0.15)' : '#1C1916',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                marginBottom: '1.25rem',
                border: idx === 0 ? '1px solid rgba(232, 75, 44, 0.35)' : '1px solid rgba(243, 240, 232, 0.08)',
                boxShadow: idx === 0 ? '0 0 20px rgba(232, 75, 44, 0.2)' : 'none',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#F3F0E8',
                letterSpacing: '-0.01em',
              }}>
                {feature.title}
              </h3>
              <p style={{ color: '#9E9B93', fontSize: '0.875rem', lineHeight: 1.65 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" style={{
        padding: 'clamp(4.5rem, 10vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
        background: '#0D0D0C',
        borderTop: '1px solid rgba(243, 240, 232, 0.08)',
        borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.28rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(232, 75, 44, 0.1)',
              border: '1px solid rgba(232, 75, 44, 0.25)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#E87A38',
              marginBottom: '1rem',
            }}>
              Seamless Deployment
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
              fontWeight: 500,
              marginBottom: '0.85rem',
              color: '#F3F0E8',
              letterSpacing: '-0.025em',
            }}>
              Live in four simple steps
            </h2>
            <p style={{ color: '#9E9B93', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
              No complex setup. From sign-up to automated WhatsApp receptionist in under 15 minutes.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 'clamp(1.75rem, 3.5vw, 2.75rem)',
          }}>
            {steps.map((step, idx) => (
              <div key={step.number} style={{ position: 'relative' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.75rem, 5vw, 3.75rem)',
                  fontWeight: 500,
                  color: idx === 0 ? '#E84B2C' : 'rgba(232, 75, 44, 0.25)',
                  lineHeight: 1,
                  marginBottom: '1rem',
                  letterSpacing: '-0.02em',
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#F3F0E8',
                }}>
                  {step.title}
                </h3>
                <p style={{ color: '#9E9B93', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <LandingPricing />

      {/* ============ CTA ============ */}
      <section style={{
        padding: 'clamp(4.5rem, 10vw, 7.5rem) clamp(1rem, 5vw, 3rem)',
        textAlign: 'center',
        background: '#080505',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(243, 240, 232, 0.08)',
      }}>
        {/* Ambient Phoenix glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(ellipse, rgba(232, 75, 44, 0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
            fontWeight: 500,
            marginBottom: '1.25rem',
            color: '#F3F0E8',
            letterSpacing: '-0.025em',
          }}>
            Ready to transform your clinic?
          </h2>
          <p style={{
            color: '#D0CBC1',
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            marginBottom: '2.25rem',
            lineHeight: 1.6,
          }}>
            Join forward-thinking practices already saving hours of reception overhead every single day.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg" style={{
            fontSize: '1rem',
            padding: '0.95rem 2.5rem',
          }}>
            Start Your Free Trial →
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{
        padding: 'clamp(2.5rem, 5vw, 3.5rem) clamp(1rem, 5vw, 3rem)',
        background: '#080505',
        color: '#9E9B93',
        fontSize: '0.8125rem',
        borderTop: '1px solid rgba(243, 240, 232, 0.08)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(243, 240, 232, 0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Image
                src="/arenova.png"
                alt="Arenova"
                width={28}
                height={28}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 500,
                color: '#F3F0E8',
                letterSpacing: '-0.01em',
              }}>AI Front Desk</span>
            </div>
            <div style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)', flexWrap: 'wrap' }}>
              <Link href="/privacy" style={{ color: '#9E9B93', textDecoration: 'none', transition: 'color 0.15s ease' }}>Privacy Policy</Link>
              <Link href="/tos" style={{ color: '#9E9B93', textDecoration: 'none', transition: 'color 0.15s ease' }}>Terms of Service</Link>
              <Link href="/login" style={{ color: '#9E9B93', textDecoration: 'none', transition: 'color 0.15s ease' }}>Sign In</Link>
              <Link href="/register" style={{ color: '#9E9B93', textDecoration: 'none', transition: 'color 0.15s ease' }}>Free Trial</Link>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} AI Front Desk. Inspired by Arenova Design System.</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>SANDBOX</span>
              Active Production Architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
