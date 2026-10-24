'use client';

// src/components/landing/HeroInteractivePreview.tsx
// Rich, animated WhatsApp front desk preview widget for the landing page hero.
// Eliminates the blank void and provides an instant "WOW" factor for clinic owners.

import React, { useState } from 'react';
import Image from 'next/image';

const TIME_SLOTS = [
  { time: '3:30 PM', label: 'Indiranagar Clinic' },
  { time: '4:15 PM', label: 'Closest to request', recommended: true },
  { time: '5:00 PM', label: 'Indiranagar Clinic' },
];

export function HeroInteractivePreview() {
  const [selectedSlot, setSelectedSlot] = useState('4:15 PM');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handleSlotClick = (slot: string) => {
    setSelectedSlot(slot);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2200);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '920px',
      margin: '0 auto 3rem auto',
      position: 'relative',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -20%)',
        width: '80%',
        height: '70%',
        background: 'radial-gradient(ellipse, rgba(232, 75, 44, 0.16) 0%, rgba(200, 105, 56, 0.05) 50%, transparent 75%)',
        filter: 'blur(45px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Floating Badges (Desktop) */}
      <div
        className="hide-on-mobile"
        style={{
          position: 'absolute',
          top: '-16px',
          left: '-24px',
          zIndex: 10,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-amber)',
          borderRadius: '12px',
          padding: '0.65rem 0.95rem',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          animation: 'float 4s ease-in-out infinite',
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: 'rgba(232, 75, 44, 0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
        }}>
          ⚡
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            1.2s Instant Response
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>
            Google Gemini 1.5 Flash
          </div>
        </div>
      </div>

      <div
        className="hide-on-mobile"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '-24px',
          zIndex: 10,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-standard)',
          borderRadius: '12px',
          padding: '0.65rem 0.95rem',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          animation: 'float 4s ease-in-out infinite 2s',
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: 'rgba(99, 199, 162, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
        }}>
          📅
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Google Calendar Linked
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
            ✓ 0 Double Bookings
          </div>
        </div>
      </div>

      {/* Main Glass Console Frame */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-standard)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-hero)',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Device Top Bar */}
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'var(--color-surface-secondary)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E84B2C', opacity: 0.8 }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E87A38', opacity: 0.8 }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#63C7A2', opacity: 0.8 }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: '0.5rem' }}>
              WhatsApp Business Live &bull; Dr. Sharma Dental Clinic
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
              ● 24/7 LIVE
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Indiranagar OPD
            </span>
          </div>
        </div>

        {/* WhatsApp Chat Simulation Canvas */}
        <div style={{
          padding: 'clamp(1rem, 3vw, 1.75rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'var(--color-obsidian)',
          minHeight: '380px',
        }}>
          {/* Header Sub-bar (WhatsApp contact profile) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            background: 'var(--color-surface-elevated)',
            borderRadius: '14px',
            border: '1px solid var(--color-border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <Image
                  src="/arenova.png"
                  alt="Aria Avatar"
                  width={38}
                  height={38}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    objectFit: 'contain',
                    border: '1px solid rgba(232, 75, 44, 0.35)',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#1E8E64',
                  border: '2px solid var(--color-surface-elevated)',
                }} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Aria &bull; Apex Dental Reception
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-amber)', background: 'rgba(232, 122, 56, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    AI Sentinel
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  Replies in ~1 second &bull; 2-way Google Calendar sync active
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Today, 11:42 PM
            </div>
          </div>

          {/* Message 1: Incoming Patient Urgent Query */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '85%',
              padding: '0.85rem 1.15rem',
              borderRadius: '16px 16px 4px 16px',
              background: 'var(--color-flame)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              boxShadow: '0 3px 12px rgba(232, 75, 44, 0.35)',
            }}>
              <div style={{ fontSize: '0.68rem', opacity: 0.85, marginBottom: '0.25rem', textAlign: 'right' }}>
                Priya S. &bull; 11:42 PM
              </div>
              Hi! Severe toothache since this evening. Is Dr. Sharma available tomorrow afternoon around 4 PM for an emergency check?
            </div>
          </div>

          {/* Message 2: Aria Instant Empathetic Triage & Calendar Check */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              padding: '0.95rem 1.25rem',
              borderRadius: '16px 16px 16px 4px',
              background: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border-standard)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-amber)', fontWeight: 600, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Aria (AI)</span> &bull; <span>11:42 PM (1.1s later)</span>
                <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                  ✓ Instant Triage
                </span>
              </div>
              <p style={{ margin: '0 0 0.65rem 0' }}>
                Hello Priya! 👋 I&apos;m Aria from Apex Dental. I&apos;m so sorry about the severe toothache — let&apos;s get you seen by Dr. Sharma right away tomorrow.
              </p>
              <p style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                📅 <strong>Live Calendar Query:</strong> Dr. Sharma is booked at 4:00 PM, but I found these 3 open slots tomorrow afternoon. Tap a slot to reserve:
              </p>

              {/* Interactive Slot Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => handleSlotClick(slot.time)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--color-flame)' : '1px solid var(--color-border-standard)',
                        background: isSelected ? 'rgba(232, 75, 44, 0.14)' : 'var(--color-surface-secondary)',
                        color: isSelected ? 'var(--color-flame)' : 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🕒 {slot.time}</span>
                      {slot.recommended && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-amber)', fontWeight: 600 }}>
                          ★ Recommended
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {copiedNotification && (
                <div style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Selected {selectedSlot}! Reserving slot in doctor&apos;s Google Calendar...
                </div>
              )}
            </div>
          </div>

          {/* Message 3: Confirmed Booking Ticket */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              padding: '0.95rem 1.25rem',
              borderRadius: '16px 16px 16px 4px',
              background: 'linear-gradient(135deg, rgba(232, 75, 44, 0.12), rgba(200, 105, 56, 0.06))',
              border: '1px solid rgba(232, 75, 44, 0.3)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-amber)', fontSize: '0.85rem' }}>
                  🔒 APPOINTMENT CONFIRMED
                </span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  Ref: #APT-8492
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
                • <strong>Doctor:</strong> Dr. Sharma (BDS, MDS Orthodontics)<br />
                • <strong>Time:</strong> Tomorrow at {selectedSlot}<br />
                • <strong>Clinic:</strong> Suite 402, Indiranagar 100ft Road<br />
                • <strong>Calendar Sync:</strong> Event locked in Google Calendar
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                color: 'var(--color-success)',
                fontWeight: 600,
                background: 'rgba(99, 199, 162, 0.12)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
              }}>
                ✓ Written directly to doctor&apos;s Google Calendar with 0 collisions
              </div>
            </div>
          </div>
        </div>

        {/* Console Bottom Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'var(--color-surface-secondary)',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              ⚡ <strong>Zero Staff Overhead:</strong> Conversation fully handled at midnight while clinic was shut.
            </span>
          </div>

          <a
            href="/register"
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.42rem 0.95rem' }}
          >
            Deploy For Your Clinic →
          </a>
        </div>
      </div>
    </div>
  );
}
