import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';
import { LandingPricing } from '@/components/landing/LandingPricing';

export const metadata: Metadata = {
  title: 'AI Front Desk — AI Receptionist for Dental Clinics & Appointment Businesses',
  description: 'Deploy an AI receptionist on WhatsApp for your clinic. Answers questions, checks availability, books appointments 24/7. No developer required.',
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
    description: 'Checks your real calendar availability, books appointments, and handles cancellations — no double bookings.',
  },
  {
    icon: '🤖',
    title: 'Powered by Gemini AI',
    description: 'State-of-the-art AI that understands context, handles complex queries, and knows when to escalate to a human.',
  },
  {
    icon: '🏥',
    title: 'Multi-Clinic Ready',
    description: 'Each clinic gets its own isolated environment, configuration, knowledge base, and conversation history.',
  },
  {
    icon: '⚡',
    title: 'Instant Automated Billing',
    description: 'Hassle-free subscription activation and seamless renewals. Get your AI receptionist running in minutes.',
  },
  {
    icon: '🛡️',
    title: 'Privacy & Security First',
    description: 'Patient data stays isolated. Full audit logs. Human takeover anytime. Medical escalation built-in.',
  },
];

const steps = [
  { number: '01', title: 'Register & Set Up', description: 'Fill in your clinic details, services, hours, and FAQs in our guided onboarding.' },
  { number: '02', title: 'Connect Integrations', description: 'Link your WhatsApp Business number and Google Calendar in a few clicks.' },
  { number: '03', title: 'Test Your AI', description: 'Chat with your AI receptionist in test mode. Adjust until it\'s perfect.' },
  { number: '04', title: 'Go Live', description: 'Subscribe and activate. Your AI receptionist starts handling patients immediately.' },
];

export default function LandingPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#FAF5EE' }}>
      <div className="animated-bg" />

      {/* ============ NAVBAR ============ */}
      <LandingNavbar />

      {/* ============ HERO ============ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(6rem, 14vw, 9rem) clamp(1rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(196, 81, 42, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(196, 81, 42, 0.06)',
          border: '1px solid rgba(196, 81, 42, 0.15)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#C4512A',
          marginBottom: '1.75rem',
          letterSpacing: '0.02em',
        }}>
          Powered by Google Gemini AI
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.25rem, 7vw, 4.5rem)',
          fontWeight: 400,
          lineHeight: 1.08,
          maxWidth: '820px',
          marginBottom: '1.5rem',
          letterSpacing: '-0.025em',
          color: '#201A17',
        }}>
          Your front desk.{' '}
          <br />
          <span style={{ color: '#C4512A' }}>Always one step ahead.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.2vw, 1.2rem)',
          color: '#756A62',
          maxWidth: '560px',
          marginBottom: '2.25rem',
          lineHeight: 1.65,
          fontWeight: 400,
        }}>
          An AI receptionist for your clinic that answers patient queries, checks real-time
          availability, and books appointments — 24/7, on WhatsApp, in any language.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '450px' }}>
          <Link href="/register" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px', textAlign: 'center' }}>
            Start Free Trial
          </Link>
          <Link href="#how-it-works" className="btn btn-secondary btn-lg" style={{ flex: '1 1 160px', textAlign: 'center' }}>
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'clamp(1rem, 3vw, 2.5rem)',
          marginTop: 'clamp(3rem, 7vw, 5rem)',
          width: '100%',
          maxWidth: '560px',
        }}>
          {[
            { value: '24/7', label: 'Always Available' },
            { value: '< 2s', label: 'Response Time' },
            { value: '10+', label: 'Languages' },
            { value: '0', label: 'Missed Queries' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#C4512A',
                fontFamily: 'var(--font-sans)',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#756A62', marginTop: '0.25rem', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Demo Chat Mockup */}
        <div id="demo" style={{
          marginTop: 'clamp(3rem, 7vw, 5rem)',
          background: '#FFFFFF',
          border: '1px solid #E9DED3',
          borderRadius: '20px',
          padding: 'clamp(1.25rem, 3vw, 1.75rem)',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'left',
          boxShadow: '0 20px 60px -12px rgba(32, 26, 23, 0.12), 0 8px 24px -8px rgba(32, 26, 23, 0.06)',
          position: 'relative',
        }}>
          {/* Warm glow behind card */}
          <div style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: '21px',
            background: 'linear-gradient(135deg, rgba(196, 81, 42, 0.12), rgba(244, 162, 97, 0.08), transparent)',
            zIndex: -1,
            filter: 'blur(1px)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid #E9DED3' }}>
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
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#201A17' }}>Aria — BrightSmile Dental</div>
              <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                Online
              </div>
            </div>
          </div>

          {[
            { role: 'patient', text: 'Hi! I need to book a tooth cleaning for tomorrow' },
            { role: 'ai', text: "Hi! I'm Aria 😊 I'd be happy to help you book a cleaning. Let me check tomorrow's availability for you..." },
            { role: 'ai', text: "I found 3 available slots tomorrow:\n• 10:00 AM (45 min)\n• 2:30 PM (45 min)\n• 4:00 PM (45 min)\n\nWhich works best for you?" },
            { role: 'patient', text: '10 AM please! My name is Priya' },
            { role: 'ai', text: "Perfect! ✅ I've booked you for Dental Cleaning on Monday at 10:00 AM. You'll receive a confirmation shortly. Is there anything else I can help you with?" },
          ].map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'patient' ? 'flex-end' : 'flex-start',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '0.55rem 0.8rem',
                borderRadius: msg.role === 'patient' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'patient' ? '#C4512A' : '#F5EFE6',
                color: msg.role === 'patient' ? '#FFFFFF' : '#201A17',
                fontSize: '0.78rem',
                lineHeight: 1.45,
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" style={{
        padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 5vw, 3rem)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#C4512A',
            marginBottom: '0.75rem',
          }}>
            Platform Capabilities
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
            fontWeight: 400,
            marginBottom: '0.75rem',
            color: '#201A17',
          }}>
            Everything your clinic needs
          </h2>
          <p style={{ color: '#756A62', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', maxWidth: '520px', margin: '0 auto' }}>
            A complete AI receptionist platform — not just a chatbot.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '1px',
          background: '#E9DED3',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid #E9DED3',
        }}>
          {features.map((feature, idx) => (
            <div key={feature.title} style={{
              padding: 'clamp(1.5rem, 3vw, 2.25rem)',
              background: '#FFFFFF',
              position: 'relative',
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: idx === 0 ? 'rgba(196, 81, 42, 0.08)' : '#F5EFE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                marginBottom: '1rem',
                border: idx === 0 ? '1px solid rgba(196, 81, 42, 0.15)' : '1px solid #E9DED3',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#201A17',
                letterSpacing: '-0.01em',
              }}>
                {feature.title}
              </h3>
              <p style={{ color: '#756A62', fontSize: '0.875rem', lineHeight: 1.65 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" style={{
        padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 5vw, 3rem)',
        background: '#FFFFFF',
        borderTop: '1px solid #E9DED3',
        borderBottom: '1px solid #E9DED3',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#C4512A',
              marginBottom: '0.75rem',
            }}>
              How It Works
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
              fontWeight: 400,
              marginBottom: '0.75rem',
              color: '#201A17',
            }}>
              Live in four simple steps
            </h2>
            <p style={{ color: '#756A62', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
              No developer required. From signup to live AI receptionist in under an hour.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
          }}>
            {steps.map((step, idx) => (
              <div key={step.number} style={{ position: 'relative' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 400,
                  color: idx === 0 ? '#C4512A' : 'rgba(196, 81, 42, 0.15)',
                  lineHeight: 1,
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.02em',
                }}>
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#201A17',
                }}>
                  {step.title}
                </h3>
                <p style={{ color: '#756A62', fontSize: '0.875rem', lineHeight: 1.6 }}>
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
        padding: 'clamp(4rem, 10vw, 7rem) clamp(1rem, 5vw, 3rem)',
        textAlign: 'center',
        background: '#251B17',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient orange glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(196, 81, 42, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
            fontWeight: 400,
            marginBottom: '1rem',
            color: '#FFFCF7',
            letterSpacing: '-0.02em',
          }}>
            Ready to transform your clinic?
          </h2>
          <p style={{
            color: 'rgba(255, 252, 247, 0.6)',
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            marginBottom: '2rem',
            maxWidth: '480px',
            margin: '0 auto 2rem',
          }}>
            Join clinics already saving hours of reception time every day.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg" style={{
            background: '#F07843',
            borderColor: '#C4512A',
            fontSize: '1rem',
            padding: '0.9rem 2.25rem',
          }}>
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{
        padding: 'clamp(2.5rem, 5vw, 3.5rem) clamp(1rem, 5vw, 3rem)',
        background: '#201A17',
        color: 'rgba(255, 252, 247, 0.5)',
        fontSize: '0.8125rem',
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
            borderBottom: '1px solid rgba(255, 252, 247, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
                fontSize: '1.1rem',
                fontWeight: 400,
                color: '#FFFCF7',
                letterSpacing: '-0.01em',
              }}>AI Front Desk</span>
            </div>
            <div style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)', flexWrap: 'wrap' }}>
              <Link href="/privacy" style={{ color: 'rgba(255, 252, 247, 0.5)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Privacy Policy</Link>
              <Link href="/tos" style={{ color: 'rgba(255, 252, 247, 0.5)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Terms of Service</Link>
              <Link href="/login" style={{ color: 'rgba(255, 252, 247, 0.5)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Sign In</Link>
              <Link href="/register" style={{ color: 'rgba(255, 252, 247, 0.5)', textDecoration: 'none', transition: 'color 0.15s ease' }}>Free Trial</Link>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} AI Front Desk. Built for clinics and appointment businesses.</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.6rem', background: 'rgba(244, 162, 97, 0.15)', color: '#F4A261', border: '1px solid rgba(244, 162, 97, 0.25)' }}>⚠️ SANDBOX</span>
              Development build
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
