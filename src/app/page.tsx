import type { Metadata } from 'next';
import Link from 'next/link';

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
      '500 inbound messages/month',
      '300 AI requests/month',
      'WhatsApp integration',
      'Operating hours logic',
      'Gemini 1.5 Flash AI',
      '10 dental services',
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
      '2,000 inbound messages/month',
      '1,200 AI requests/month',
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
      '10,000 inbound messages/month',
      '5,000 AI requests/month',
      'Multi-doctor calendar sync',
      'Custom clinical voice & knowledge',
      'Priority WhatsApp webhooks',
      'Dedicated account manager',
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
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(8, 12, 24, 0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}>🤖</div>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            AI Front Desk
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Start Free Trial</Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div className="badge badge-info" style={{ marginBottom: '1.5rem' }}>
          ✨ Powered by Google Gemini AI
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 900,
          lineHeight: 1.05,
          maxWidth: '900px',
          marginBottom: '1.5rem',
          letterSpacing: '-0.04em',
        }}>
          Your Clinic&apos;s AI Receptionist,{' '}
          <span className="text-gradient">Always On WhatsApp</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'hsl(var(--color-text-secondary))',
          maxWidth: '600px',
          marginBottom: '2.5rem',
          lineHeight: 1.6,
        }}>
          Deploy a smart AI receptionist for your dental clinic or appointment business in minutes.
          Books appointments, answers queries, and handles cancellations — 24/7, in any language.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary btn-lg">
            🚀 Start Free — No Credit Card
          </Link>
          <Link href="#how-it-works" className="btn btn-secondary btn-lg">
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '4rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { value: '24/7', label: 'Always Available' },
            { value: '< 2s', label: 'Response Time' },
            { value: '10+', label: 'Languages' },
            { value: '0', label: 'Missed Queries' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="text-gradient">
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Demo Chat Mockup */}
        <div className="float" style={{
          marginTop: '4rem',
          background: 'hsl(var(--color-surface))',
          border: '1px solid hsl(var(--color-border))',
          borderRadius: '20px',
          padding: '1.5rem',
          maxWidth: '400px',
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
                maxWidth: '80%',
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
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginBottom: '1rem' }}>
            Everything Your Clinic Needs
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '1.1rem' }}>
            A complete AI receptionist platform — not just a chatbot.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {features.map(feature => (
            <div key={feature.title} className="card" style={{ padding: '1.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" style={{ padding: '6rem 2rem', background: 'hsl(var(--color-surface))', borderTop: '1px solid hsl(var(--color-border))' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginBottom: '1rem' }}>
            Live in 4 Steps
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '1.1rem', marginBottom: '3rem' }}>
            No developer required. From signup to live AI receptionist in under an hour.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem', textAlign: 'left' }}>
            {steps.map((step, i) => (
              <div key={step.number}>
                <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {step.number}
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ padding: '6rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginBottom: '1rem' }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '1.1rem' }}>
            Monthly subscriptions via UPI. Cancel anytime.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch',
        }}>
          {plans.map(plan => (
            <div
              key={plan.name}
              className={plan.highlighted ? 'card glow-border' : 'card'}
              style={{
                padding: '2.25rem 2rem 2rem',
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
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{plan.name}</h3>
                <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.8rem', marginBottom: '1rem' }}>{plan.description}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'Plus Jakarta Sans, sans-serif' }} className={plan.highlighted ? 'text-gradient' : ''}>{plan.price}</span>
                  <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>{plan.period}</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.625rem', fontSize: '0.875rem', color: 'hsl(var(--color-text-secondary))' }}>
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

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
          All plans include a 3-day free trial. No credit card required to start.
          UPI payments accepted.
        </p>
      </section>

      {/* ============ CTA ============ */}
      <section style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, transparent 0%, hsl(var(--color-surface)) 100%)',
        borderTop: '1px solid hsl(var(--color-border))',
      }}>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', marginBottom: '1rem' }}>
          Ready to Transform Your Clinic?
        </h2>
        <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Join clinics already saving hours of reception time every day.
        </p>
        <Link href="/register" className="btn btn-primary btn-lg">
          🚀 Start Your Free Trial
        </Link>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid hsl(var(--color-border))',
        textAlign: 'center',
        color: 'hsl(var(--color-text-muted))',
        fontSize: '0.8125rem',
      }}>
        <p>© 2024 AI Front Desk. Built for dental clinics and appointment businesses.</p>
        <p style={{ marginTop: '0.5rem' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>⚠️ SANDBOX MODE</span>
          {' '}This is a development build. WhatsApp and payment integrations are not yet live.
        </p>
      </footer>
    </div>
  );
}
