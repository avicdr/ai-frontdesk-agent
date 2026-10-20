import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/navigation/LandingNavbar';

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
    icon: '💳',
    title: 'Simple UPI Payments',
    description: 'Monthly subscriptions via UPI. No complicated payment setup — start in minutes.',
  },
  {
    icon: '🛡️',
    title: 'Privacy & Security First',
    description: 'Patient data stays isolated. Full audit logs. Human takeover anytime. Medical escalation built-in.',
  },
];

const plans = [
  {
    name: 'Starter Practice',
    price: '₹999',
    period: 'per month',
    description: 'Perfect for small clinics getting started with AI',
    features: [
      '500 AI patient conversations/month',
      'WhatsApp integration',
      'Operating hours logic',
      'Gemini 1.5 Flash AI',
      'Up to 10 clinical services',
      'Google Calendar 2-way sync',
      '3-day grace period',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro Clinic',
    price: '₹1,599',
    period: 'per month',
    description: 'Recommended for active dental practices',
    features: [
      '2,000 AI patient conversations/month',
      'WhatsApp integration',
      'Google Calendar 2-way sync',
      'OpenAI auto-fallback',
      'Unlimited bookings',
      'Live human takeover inbox',
      'Appointment reminders',
      '7-day grace period',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Growth & Multi-Doctor',
    price: '₹2,999',
    period: 'per month',
    description: 'For growing clinics with multi-doctor rosters',
    features: [
      '5,000 AI patient conversations/month',
      'Multi-doctor calendar sync',
      'Custom clinical voice & knowledge',
      'Priority WhatsApp webhooks',
      'Dedicated account manager',
      'Advanced analytics',
      '14-day grace period',
    ],
    cta: 'Contact Sales',
    highlighted: false,
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
    <div style={{ position: 'relative', overflow: 'hidden' }}>
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
        padding: 'clamp(5.5rem, 12vw, 8rem) clamp(1rem, 4vw, 2rem) 3rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="badge badge-info" style={{ marginBottom: '1.25rem' }}>
          ✨ Powered by Google Gemini AI
        </div>

        <h1 style={{
          fontSize: 'clamp(1.9rem, 6.5vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          maxWidth: '900px',
          marginBottom: '1.25rem',
          letterSpacing: '-0.03em',
        }}>
          Your Clinic&apos;s AI Receptionist,{' '}
          <span className="text-gradient">Always On WhatsApp</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.25rem)',
          color: 'hsl(var(--color-text-secondary))',
          maxWidth: '600px',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}>
          Deploy a smart AI receptionist for your dental clinic or appointment business in minutes.
          Books appointments, answers queries, and handles cancellations — 24/7, in any language.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '450px' }}>
          <Link href="/register" className="btn btn-primary btn-lg" style={{ flex: '1 1 200px', textAlign: 'center' }}>
            🚀 Start Free — No Credit Card
          </Link>
          <Link href="#how-it-works" className="btn btn-secondary btn-lg" style={{ flex: '1 1 160px', textAlign: 'center' }}>
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(75px, 1fr))',
          gap: 'clamp(0.75rem, 3vw, 2rem)',
          marginTop: 'clamp(2.5rem, 6vw, 4rem)',
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
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.2rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Demo Chat Mockup */}
        <div id="demo" className="float" style={{
          marginTop: 'clamp(2.5rem, 6vw, 4rem)',
          background: 'hsl(var(--color-surface))',
          border: '1px solid hsl(var(--color-border))',
          borderRadius: '20px',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'left',
          boxShadow: 'var(--shadow-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid hsl(var(--color-border))' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0,
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Aria — BrightSmile Dental</div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(142, 71%, 55%)' }}>● Online</div>
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
                padding: '0.5rem 0.75rem',
                borderRadius: msg.role === 'patient' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'patient' ? 'hsl(221, 83%, 48%)' : 'hsl(var(--color-surface-3))',
                fontSize: '0.78rem',
                lineHeight: 1.4,
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" style={{ padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', marginBottom: '0.75rem' }}>
            Everything Your Clinic Needs
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
            A complete AI receptionist platform — not just a chatbot.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.25rem',
        }}>
          {features.map(feature => (
            <div key={feature.title} className="card" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" style={{ padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', background: 'hsl(var(--color-surface))', borderTop: '1px solid hsl(var(--color-border))' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', marginBottom: '0.75rem' }}>
            Live in 4 Steps
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', marginBottom: '2.5rem' }}>
            No developer required. From signup to live AI receptionist in under an hour.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.5rem', textAlign: 'left' }}>
            {steps.map(step => (
              <div key={step.number}>
                <div className="text-gradient" style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.35rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {step.number}
                </div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>{step.title}</h3>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.825rem', lineHeight: 1.5 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', marginBottom: '0.75rem' }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
            Monthly subscriptions via UPI. Cancel anytime.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}>
          {plans.map(plan => (
            <div
              key={plan.name}
              className={plan.highlighted ? 'card glow-border' : 'card'}
              style={{
                padding: 'clamp(1.5rem, 4vw, 2.25rem) clamp(1.25rem, 3vw, 2rem) 1.75rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                marginTop: '0.75rem',
              }}
            >
              {plan.highlighted && (
                <div
                  className="badge badge-info"
                  style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                    padding: '0.3rem 0.9rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{plan.name}</h3>
                <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.description}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'Plus Jakarta Sans, sans-serif' }} className={plan.highlighted ? 'text-gradient' : ''}>{plan.price}</span>
                  <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>{plan.period}</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))' }}>
                    <span style={{ color: 'hsl(142, 71%, 55%)', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={plan.highlighted ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ textAlign: 'center' }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
          All plans include a 3-day free trial. No credit card required to start.
          UPI payments accepted.
        </p>
      </section>

      {/* ============ CTA ============ */}
      <section style={{
        padding: 'clamp(3.5rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem)',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, hsl(var(--color-surface)) 100%)',
        borderTop: '1px solid hsl(var(--color-border))',
      }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', marginBottom: '0.75rem' }}>
          Ready to Transform Your Clinic?
        </h2>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', marginBottom: '1.75rem' }}>
          Join clinics already saving hours of reception time every day.
        </p>
        <Link href="/register" className="btn btn-primary btn-lg">
          🚀 Start Your Free Trial
        </Link>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{
        padding: '2.5rem clamp(1rem, 4vw, 2rem)',
        borderTop: '1px solid hsl(var(--color-border))',
        textAlign: 'center',
        color: 'hsl(var(--color-text-muted))',
        fontSize: '0.8125rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(0.75rem, 3vw, 1.5rem)', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <Link href="/privacy" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/tos" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/login" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/register" style={{ color: 'hsl(var(--color-text-secondary))', textDecoration: 'none' }}>Free Trial</Link>
        </div>
        <p>© {new Date().getFullYear()} AI Front Desk. Built for clinics and appointment businesses.</p>
        <p style={{ marginTop: '0.5rem', lineHeight: 1.5 }}>
          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>⚠️ SANDBOX MODE</span>
          {' '}This is a development build. WhatsApp and payment integrations are not yet live.
        </p>
      </footer>
    </div>
  );
}
