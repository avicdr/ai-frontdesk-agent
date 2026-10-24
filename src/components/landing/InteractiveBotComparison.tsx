'use client';

// src/components/landing/InteractiveBotComparison.tsx
// Cinematic Obsidian × Phoenix Ember Interactive Bot Comparison Module
// Allows prospective clinics to compare patient outcomes WITH vs WITHOUT the AI Front Desk agent.

import React, { useState } from 'react';
import Image from 'next/image';

type TabMode = 'with_ai' | 'without_ai';
type ScenarioKey = 'night_booking' | 'pricing_inquiry' | 'reschedule';

interface ScenarioData {
  title: string;
  subtitle: string;
  patientMsg: string;
  patientTime: string;
  withAi: {
    replies: { time: string; text: string; tag?: string }[];
    metrics: { label: string; value: string; note: string; positive: boolean }[];
    summary: string;
  };
  withoutAi: {
    replies: { time: string; text: string; status: 'unread' | 'read' | 'lost' }[];
    metrics: { label: string; value: string; note: string; positive: boolean }[];
    summary: string;
  };
}

const SCENARIOS: Record<ScenarioKey, ScenarioData> = {
  night_booking: {
    title: 'Late Night Acute Inquiry (11:42 PM)',
    subtitle: 'Patient searching for care while the clinic physical reception is closed',
    patientMsg: 'Hi! I have severe toothache since evening. Can I get an urgent slot with Dr. Sharma tomorrow afternoon around 4 PM?',
    patientTime: '11:42 PM',
    withAi: {
      replies: [
        {
          time: '11:42 PM (1.1s later)',
          text: "Hello! 😊 I'm Aria, virtual front desk for BrightSmile Dental. I'm sorry to hear about the toothache — let's get you seen quickly.",
        },
        {
          time: '11:42 PM (1.8s later)',
          text: "I checked Dr. Sharma's real-time Google Calendar for tomorrow afternoon. Here are the nearest available emergency openings:\n\n• 3:30 PM (30 min)\n• 4:15 PM (30 min — closest to your request)\n• 5:00 PM (30 min)\n\nWhich slot shall I lock in for you?",
          tag: '📅 Live Calendar Check',
        },
        {
          time: '11:43 PM',
          text: "Perfect, Priya! ✅ I've confirmed your Emergency Dental Triage with Dr. Sharma for Tomorrow at 4:15 PM.\n\n📍 402 Indiranagar Medical Plaza\n📅 Calendar invite & WhatsApp reminder dispatched.\n\nPlease avoid hot/cold drinks tonight. See you tomorrow!",
          tag: '🔒 Direct Booking Confirmed',
        },
      ],
      metrics: [
        { label: 'First Response Time', value: '1.2s', note: 'Instant automated triage', positive: true },
        { label: 'After-Hours Capture', value: '100%', note: 'Zero leads lost overnight', positive: true },
        { label: 'Calendar Overlaps', value: '0%', note: '2-way Google sync locked', positive: true },
        { label: 'Estimated Clinic ROI', value: '+₹4,500', note: 'Immediate patient conversion', positive: true },
      ],
      summary: 'Patient received compassionate, instantaneous confirmation at midnight. The appointment was automatically written to the doctor’s schedule without staff intervention.',
    },
    withoutAi: {
      replies: [
        {
          time: '11:42 PM',
          text: '✓ Delivered (Clinic closed. Phone on silent in drawer).',
          status: 'unread',
        },
        {
          time: '1:15 AM',
          text: 'Patient: "Is anyone here? The pain is increasing..."\n✓ Delivered',
          status: 'unread',
        },
        {
          time: 'Next Day, 10:28 AM',
          text: 'Receptionist: "Hi sorry for late reply, clinic opens at 10 AM. Dr. Sharma is booked at 4 PM, can you come Thursday?"',
          status: 'read',
        },
        {
          time: 'Next Day, 10:32 AM',
          text: 'Patient: "Never mind. I found another clinic on Practo at 12 AM who booked me immediately. Cancel my query."',
          status: 'lost',
        },
      ],
      metrics: [
        { label: 'First Response Time', value: '10h 46m', note: 'Next morning delay', positive: false },
        { label: 'After-Hours Capture', value: '0%', note: 'Patient booked competitor', positive: false },
        { label: 'Booking Dropoff', value: '72%', note: 'Lost prospective lifetime client', positive: false },
        { label: 'Lost Clinic Value', value: '-₹18,000', note: 'Lost procedure + lifetime LTV', positive: false },
      ],
      summary: 'Unanswered late-night text turned an urgent, high-intent patient toward a competitor clinic. The clinic staff spent morning time replying to an already-lost lead.',
    },
  },
  pricing_inquiry: {
    title: 'Procedure Pricing & Protocol (2:15 PM)',
    subtitle: 'Patient comparing orthodontic and invisible aligner treatments',
    patientMsg: 'Hello, what is the cost of clear aligners at your clinic and how many sessions does it take?',
    patientTime: '2:15 PM',
    withAi: {
      replies: [
        {
          time: '2:15 PM (1.2s later)',
          text: "Hello! ✨ Our Clear Aligner therapy ranges between ₹45,000 to ₹85,000 depending on complexity, and typically involves 6 to 12 months with bi-monthly digital scans.",
        },
        {
          time: '2:15 PM (2.0s later)',
          text: "We include a complimentary 3D Intraoral Scan during your initial consultation (valued at ₹1,500).\n\nWould you like to schedule an orthodontic scan this week to get your customized smile plan?",
          tag: '🏷️ Catalog Pricing & Up-Sell',
        },
      ],
      metrics: [
        { label: 'Price Quote Latency', value: '1.4s', note: 'Standardized accurate pricing', positive: true },
        { label: 'Consultation Conversion', value: '88%', note: 'Immediate scan CTA offered', positive: true },
        { label: 'Front Desk Phone Time', value: '0 min', note: 'Staff spared routine quoting', positive: true },
        { label: 'Quote Consistency', value: '100%', note: 'Zero discrepancy with doctors', positive: true },
      ],
      summary: 'Immediate, accurate quoting backed by clinic pricing rules converted a vague price shopper into an in-clinic consultation booking.',
    },
    withoutAi: {
      replies: [
        {
          time: '2:15 PM',
          text: '✓ Delivered (Receptionist busy attending in-person billing counter)',
          status: 'unread',
        },
        {
          time: '3:45 PM (90m later)',
          text: 'Receptionist: "Cost depends on case. Please come to clinic and meet doctor."',
          status: 'read',
        },
        {
          time: '3:50 PM',
          text: 'Patient: "Can you give rough idea? Other clinics told me ₹50k."',
          status: 'read',
        },
        {
          time: '5:10 PM',
          text: 'Receptionist: "Doctor will tell only in consultation."',
          status: 'lost',
        },
      ],
      metrics: [
        { label: 'Response Delay', value: '1h 30m', note: 'Interrupted by walk-in line', positive: false },
        { label: 'Vague Information', value: 'High', note: 'Frustrated patient shopper', positive: false },
        { label: 'Lead Conversion', value: '18%', note: 'Patient drops conversation', positive: false },
        { label: 'Staff Overhead', value: '15 mins', note: 'Unproductive typing back & forth', positive: false },
      ],
      summary: 'Delayed, defensive response failed to communicate value. The prospective high-ticket aligner patient left without scheduling a consultation.',
    },
  },
  reschedule: {
    title: 'Sunday Rescheduling & Cancellation',
    subtitle: 'Patient needing to move their consultation due to a work clash',
    patientMsg: 'Hi, I need to reschedule my 11 AM appointment today to Wednesday evening after 6 PM please.',
    patientTime: '8:10 AM',
    withAi: {
      replies: [
        {
          time: '8:10 AM (1.0s later)',
          text: "No problem at all! Let me update your schedule.",
        },
        {
          time: '8:10 AM (1.9s later)',
          text: "I've freed up your 11 AM slot today for waitlisted patients. On Wednesday evening, Dr. Sharma has:\n\n• 6:15 PM\n• 7:00 PM\n\nWhich of these would you prefer?",
          tag: '🔄 Auto Slot Reallocation',
        },
        {
          time: '8:11 AM',
          text: "Done! ✅ Moved to Wednesday at 6:15 PM. Your Google Calendar event has been automatically updated.",
          tag: '⚡ 2-Way Sync Complete',
        },
      ],
      metrics: [
        { label: 'Cancellation Reclaimed', value: '100%', note: '11 AM slot reopened instantly', positive: true },
        { label: 'Reschedule Time', value: '45 sec', note: 'Zero telephone hold time', positive: true },
        { label: 'Calendar Errors', value: '0', note: 'Both slots accurately updated', positive: true },
        { label: 'Doctor Schedule Gap', value: 'Prevented', note: 'Slot immediately rebookable', positive: true },
      ],
      summary: 'The old slot was freed in seconds and re-opened for other patients, preventing an empty clinician chair while smoothly rebooking the patient.',
    },
    withoutAi: {
      replies: [
        {
          time: '8:10 AM',
          text: '✓ Delivered (Reception opens at 9:30 AM)',
          status: 'unread',
        },
        {
          time: '10:05 AM',
          text: 'Receptionist: "Sorry saw this late. 11 AM doctor was already coming for you. Wednesday 6 PM is full."',
          status: 'read',
        },
        {
          time: '10:12 AM',
          text: 'Doctor arrives at clinic for 11 AM. Empty chair. ₹3,000 lost clinician hour.',
          status: 'lost',
        },
      ],
      metrics: [
        { label: 'No-Show Chair Loss', value: '1 hour', note: 'Doctor sat idle at 11 AM', positive: false },
        { label: 'Patient Friction', value: 'Severe', note: 'Guilt & frustration induced', positive: false },
        { label: 'Manual Roster Chaos', value: 'High', note: 'Diary scribbled and crossed out', positive: false },
        { label: 'Wasted Doctor Cost', value: '-₹3,000', note: 'Dead clinic chair time', positive: false },
      ],
      summary: 'Late message reading created an empty clinic chair for the doctor, wasting clinical capacity that could have been filled by emergency walk-ins.',
    },
  },
};

export function InteractiveBotComparison() {
  const [activeTab, setActiveTab] = useState<TabMode>('with_ai');
  const [scenario, setScenario] = useState<ScenarioKey>('night_booking');

  const currentScenario = SCENARIOS[scenario];
  const isWithAi = activeTab === 'with_ai';

  return (
    <div className="w-full" style={{ maxWidth: '1180px', margin: '0 auto' }}>
      {/* Module Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.3rem 0.85rem',
          borderRadius: '9999px',
          background: 'rgba(232, 75, 44, 0.12)',
          border: '1px solid rgba(232, 75, 44, 0.3)',
          color: 'var(--color-amber)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.85rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-flame)', boxShadow: '0 0 8px var(--color-flame)' }} />
          Interactive Telemetry Sandbox
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 500,
          letterSpacing: '-0.025em',
          color: 'var(--color-text-primary)',
          marginBottom: '0.65rem',
        }}>
          See the difference in patient conversion
        </h2>
        <p style={{
          fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
          color: 'var(--color-text-muted)',
          maxWidth: '640px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Toggle between an autonomous AI Front Desk deployment and standard manual staff reception to compare response latency, calendar accuracy, and lost revenue.
        </p>
      </div>

      {/* Scenario Filter Pills */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '2rem',
      }}>
        {[
          { key: 'night_booking', label: '🌙 Late Night Urgent Booking (11:42 PM)' },
          { key: 'pricing_inquiry', label: '🏷️ Procedure Pricing & Scan Quote' },
          { key: 'reschedule', label: '🔄 Rescheduling & Slot Recovery' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setScenario(item.key as ScenarioKey)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              fontWeight: scenario === item.key ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: scenario === item.key ? '1px solid var(--color-amber)' : '1px solid var(--color-border-standard)',
              background: scenario === item.key ? 'rgba(232, 122, 56, 0.15)' : 'var(--color-surface-elevated)',
              color: scenario === item.key ? 'var(--color-amber)' : 'var(--color-text-muted)',
              boxShadow: scenario === item.key ? '0 0 16px rgba(232, 122, 56, 0.15)' : 'none',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Dual Tab Switcher */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        background: 'var(--color-surface-secondary)',
        padding: '0.4rem',
        borderRadius: '16px',
        border: '1px solid var(--color-border-standard)',
        marginBottom: '1.75rem',
        maxWidth: '720px',
        margin: '0 auto 2rem auto',
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('with_ai')}
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            border: activeTab === 'with_ai' ? '1px solid var(--color-border-active)' : '1px solid transparent',
            background: activeTab === 'with_ai' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'with_ai' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            fontWeight: 600,
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            boxShadow: activeTab === 'with_ai' ? 'var(--shadow-card), 0 0 20px rgba(232, 75, 44, 0.15)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: activeTab === 'with_ai' ? 'var(--color-flame)' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'with_ai' ? '0 0 10px var(--color-flame)' : 'none',
          }} />
          <span>With AI Front Desk <span style={{ color: 'var(--color-amber)', fontSize: '0.75rem', fontWeight: 700 }}>(Autonomous)</span></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('without_ai')}
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            border: activeTab === 'without_ai' ? '1px solid rgba(232, 75, 44, 0.4)' : '1px solid transparent',
            background: activeTab === 'without_ai' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'without_ai' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            fontWeight: 600,
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            boxShadow: activeTab === 'without_ai' ? 'var(--shadow-card), 0 0 20px rgba(232, 75, 44, 0.15)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: activeTab === 'without_ai' ? '#E84B2C' : 'var(--color-text-muted)',
            boxShadow: activeTab === 'without_ai' ? '0 0 10px #E84B2C' : 'none',
          }} />
          <span>Without AI Front Desk <span style={{ color: '#E84B2C', fontSize: '0.75rem', fontWeight: 700 }}>(Manual Staff)</span></span>
        </button>
      </div>

      {/* Main Comparison Canvas (2-Column Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        gap: '1.75rem',
        alignItems: 'stretch',
      }}>
        {/* Left Column: WhatsApp Mobile Chat Simulator */}
        <div className="card" style={{
          padding: 'clamp(1.25rem, 3vw, 1.75rem)',
          borderRadius: '20px',
          background: 'var(--color-surface-elevated)',
          border: isWithAi ? '1px solid var(--color-border-active)' : '1px solid rgba(232, 75, 44, 0.35)',
          boxShadow: isWithAi ? 'var(--shadow-hero)' : 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Header Bar */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--color-border-subtle)',
              marginBottom: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Image
                  src="/arenova.png"
                  alt="Avatar"
                  width={42}
                  height={42}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: isWithAi ? '1px solid var(--color-amber)' : '1px solid var(--color-border-standard)',
                    boxShadow: isWithAi ? '0 0 12px rgba(232, 122, 56, 0.3)' : 'none',
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                    {isWithAi ? 'Aria — Virtual Clinic Receptionist' : 'Clinic Desk (Manual WhatsApp)'}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: isWithAi ? 'var(--color-success)' : '#E84B2C',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isWithAi ? 'var(--color-success)' : '#E84B2C',
                      boxShadow: isWithAi ? '0 0 6px var(--color-success)' : 'none',
                    }} />
                    {isWithAi ? 'Online • 24/7 Google Calendar Linked' : 'Offline • Closes at 8:00 PM'}
                  </div>
                </div>
              </div>

              <span className={`badge ${isWithAi ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.7rem' }}>
                {isWithAi ? '● AI ACTIVE' : '⚠ MANUAL LINE'}
              </span>
            </div>

            {/* Conversation Flow */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Patient Message */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px 16px 4px 16px',
                  background: 'var(--color-flame)',
                  color: '#FFFFFF',
                  fontSize: '0.825rem',
                  lineHeight: 1.5,
                  boxShadow: '0 2px 10px rgba(232, 75, 44, 0.3)',
                }}>
                  <div style={{ fontSize: '0.68rem', opacity: 0.85, marginBottom: '0.2rem', textAlign: 'right' }}>
                    Patient • {currentScenario.patientTime}
                  </div>
                  {currentScenario.patientMsg}
                </div>
              </div>

              {/* Bot / Receptionist Replies */}
              {isWithAi ? (
                currentScenario.withAi.replies.map((reply, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{
                      maxWidth: '90%',
                      padding: '0.8rem 1.05rem',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'var(--color-surface-secondary)',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.825rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-line',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-amber)', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Aria • {reply.time}
                      </div>
                      {reply.text}
                      {reply.tag && (
                        <div style={{
                          marginTop: '0.5rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          background: 'rgba(232, 75, 44, 0.12)',
                          color: 'var(--color-amber)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {reply.tag}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                currentScenario.withoutAi.replies.map((reply, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{
                      maxWidth: '90%',
                      padding: '0.8rem 1.05rem',
                      borderRadius: '16px 16px 16px 4px',
                      background: reply.status === 'lost' ? 'rgba(232, 75, 44, 0.12)' : 'var(--color-surface-secondary)',
                      border: reply.status === 'lost' ? '1px solid rgba(232, 75, 44, 0.35)' : '1px solid var(--color-border-subtle)',
                      color: reply.status === 'lost' ? 'var(--color-flame)' : 'var(--color-text-muted)',
                      fontSize: '0.825rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-line',
                    }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {reply.time}
                      </div>
                      {reply.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Callout */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>Scenario: {currentScenario.title}</span>
            <span style={{ color: isWithAi ? 'var(--color-success)' : '#E84B2C', fontWeight: 600 }}>
              {isWithAi ? '✓ Converted & Booked' : '✗ Dropoff / Lost'}
            </span>
          </div>
        </div>

        {/* Right Column: Comparative Operational Telemetry Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}>
          {/* Executive Summary Card */}
          <div className="card" style={{
            padding: '1.5rem',
            background: isWithAi ? 'linear-gradient(135deg, rgba(23, 22, 20, 0.95), rgba(28, 25, 22, 0.95))' : 'rgba(23, 22, 20, 0.95)',
            border: isWithAi ? '1px solid var(--color-border-amber)' : '1px solid var(--color-border-subtle)',
            borderRadius: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{isWithAi ? '💎' : '⚠️'}</span>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 600,
                color: isWithAi ? 'var(--color-amber)' : '#E84B2C',
                margin: 0,
              }}>
                {isWithAi ? 'Outcome: Immediate Conversion & Slot Locked' : 'Outcome: Unanswered Lead & Frustrated Patient'}
              </h3>
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {isWithAi ? currentScenario.withAi.summary : currentScenario.withoutAi.summary}
            </p>
          </div>

          {/* 4 Metric Telemetry Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.85rem',
          }}>
            {(isWithAi ? currentScenario.withAi.metrics : currentScenario.withoutAi.metrics).map((metric, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: '1.15rem',
                  borderRadius: '14px',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.35rem',
                }}>
                  {metric.label}
                </div>
                <div style={{
                  fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: metric.positive ? 'var(--color-success)' : '#E84B2C',
                  letterSpacing: '-0.02em',
                }}>
                  {metric.value}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '0.3rem',
                }}>
                  {metric.note}
                </div>
              </div>
            ))}
          </div>

          {/* Action CTA Box */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            background: isWithAi
              ? 'linear-gradient(135deg, rgba(232, 75, 44, 0.15), rgba(200, 105, 56, 0.08))'
              : 'rgba(232, 75, 44, 0.06)',
            border: '1px solid var(--color-border-standard)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                {isWithAi ? 'Ready to automate your clinic front desk?' : 'Stop losing high-value patient appointments.'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                Setup takes under 4 minutes. Free 3-day operational trial included.
              </div>
            </div>
            <a
              href="/register"
              className="btn btn-primary btn-sm"
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.825rem', fontWeight: 600 }}
            >
              Start Free Trial →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
