'use client';

// src/app/onboarding/page.tsx
// 8-step onboarding wizard for dental clinic owners to activate their AI front desk

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DentalService {
  name: string;
  duration: number;
  price: string;
  isBookable: boolean;
}

const DEFAULT_SERVICES: DentalService[] = [
  { name: 'Routine Dental Consultation & Checkup', duration: 30, price: '500', isBookable: true },
  { name: 'Professional Teeth Cleaning (Scaling & Polishing)', duration: 45, price: '1200', isBookable: true },
  { name: 'Root Canal Treatment (RCT)', duration: 60, price: '4500', isBookable: true },
  { name: 'Teeth Whitening (Laser Bleaching)', duration: 45, price: '3000', isBookable: true },
  { name: 'Dental Extraction (Simple)', duration: 30, price: '1500', isBookable: true },
  { name: 'Emergency Dental Pain Relief', duration: 30, price: '800', isBookable: true },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Clinic Info
  const [clinicName, setClinicName] = useState('Apex Dental & Orthodontics');
  const [ownerName, setOwnerName] = useState('Dr. Sarah Verma');
  const [phone, setPhone] = useState('+919876543210');
  const [address, setAddress] = useState('42 Park Avenue, Koramangala');
  const [city, setCity] = useState('Bengaluru');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Step 2: AI Receptionist Persona
  const [assistantName, setAssistantName] = useState('Aria');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'concise'>('friendly');
  const [language, setLanguage] = useState('English & Hindi (Hinglish)');
  const [greeting, setGreeting] = useState(
    "Hello! Welcome to Apex Dental & Orthodontics. I'm Aria, your AI receptionist. How can I assist you with your dental care today?"
  );

  // Step 3: Services
  const [services, setServices] = useState<DentalService[]>(DEFAULT_SERVICES);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  // Step 4: Working Hours
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      isOpen: idx >= 1 && idx <= 6, // Mon-Sat open, Sun closed
      openTime: '09:00',
      closeTime: '19:00',
    }))
  );

  // Step 5: Booking Policies
  const [minAdvanceHours, setMinAdvanceHours] = useState('2');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('30');
  const [cancellationHours, setCancellationHours] = useState('12');
  const [bufferMinutes, setBufferMinutes] = useState('10');

  // Step 6: WhatsApp Integration
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');

  // Step 7: Calendar
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Step 8: Plan & UPI
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'growth'>('pro');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Add a service
  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setServices([
      ...services,
      {
        name: newServiceName.trim(),
        duration: parseInt(newServiceDuration, 10) || 30,
        price: newServicePrice.trim() || '0',
        isBookable: true,
      },
    ]);
    setNewServiceName('');
    setNewServicePrice('');
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, idx) => idx !== index));
  };

  // Next step handler
  const handleNext = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // If at step 1, initiate organization if not exists
      if (currentStep === 1) {
        await fetch('/api/v1/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: ownerName,
            phone,
            organizationName: clinicName,
            timezone,
          }),
        });
      }

      // Persist step data
      await fetch('/api/v1/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep + 1,
          clinicInfo: { clinicName, phone, address, city, timezone },
          agentConfig: { assistantName, tone, greetingMessage: greeting },
          services,
          workingHours,
          bookingPolicy: {
            minAdvanceHours: parseInt(minAdvanceHours, 10),
            maxAdvanceDays: parseInt(maxAdvanceDays, 10),
            cancellationHours: parseInt(cancellationHours, 10),
            bufferMinutes: parseInt(bufferMinutes, 10),
          },
        }),
      });

      if (currentStep < 8) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Complete
  const handleCompleteActivation = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // If UTR entered, create order & submit UTR
      await fetch('/api/v1/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 8,
          complete: true,
        }),
      });

      router.push('/dashboard?activated=true');
    } catch (err) {
      setErrorMsg('Could not complete activation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--color-background))', color: 'hsl(var(--color-text))', padding: '2rem 1rem' }}>
      <div className="animated-bg" />

      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: 'hsl(var(--color-surface))',
            border: '1px solid hsl(var(--color-border))',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'hsl(var(--color-primary))',
            marginBottom: '1rem',
          }}>
            ✨ AI Receptionist Setup Wizard
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Set Up Your 24/7 Dental Front Desk
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.95rem' }}>
            Configure your AI receptionist in minutes. No coding or developer setup required.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          background: 'hsl(var(--color-surface))',
          padding: '0.875rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid hsl(var(--color-border))',
          overflowX: 'auto',
          gap: '0.5rem',
        }}>
          {[
            { step: 1, label: 'Clinic' },
            { step: 2, label: 'AI Persona' },
            { step: 3, label: 'Services' },
            { step: 4, label: 'Hours' },
            { step: 5, label: 'Policies' },
            { step: 6, label: 'WhatsApp' },
            { step: 7, label: 'Calendar' },
            { step: 8, label: 'Activate' },
          ].map(({ step, label }) => {
            const isDone = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isCurrent ? 1 : isDone ? 0.8 : 0.4 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isCurrent ? 'var(--gradient-brand)' : isDone ? 'hsl(142 71% 45%)' : 'hsl(var(--color-surface-hover))',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {isDone ? '✓' : step}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                {step < 8 && <div style={{ width: 16, height: 1, background: 'hsl(var(--color-border))' }} />}
              </div>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="card" style={{ padding: '2rem', border: '1px solid hsl(var(--color-border))', borderRadius: '20px' }}>
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'hsl(0 84% 60% / 0.1)',
              border: '1px solid hsl(0 84% 60% / 0.3)',
              color: 'hsl(0 84% 60%)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}>
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Clinic Profile */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 1: Clinic Essentials</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Tell us about your dental practice. The AI will use this info when answering patient inquiries.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Clinic Name</label>
                  <input className="input" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. Apex Dental Clinic" />
                </div>
                <div>
                  <label className="label">Doctor / Owner Full Name</label>
                  <input className="input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Dr. Sarah Verma" />
                </div>
                <div>
                  <label className="label">Contact / Reception Phone</label>
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Clinic Address</label>
                  <input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street address" />
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST - India)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST - UAE)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI Persona */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 2: AI Receptionist Persona</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Customize your AI assistant's name, conversational tone, and welcome greeting.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">AI Receptionist Name</label>
                    <input className="input" value={assistantName} onChange={e => setAssistantName(e.target.value)} placeholder="Aria" />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Conversational Tone</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[
                        { id: 'friendly', label: 'Warm & Friendly' },
                        { id: 'professional', label: 'Professional' },
                        { id: 'concise', label: 'Concise & Fast' },
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTone(t.id as any)}
                          style={{
                            flex: 1,
                            padding: '0.625rem 0.5rem',
                            borderRadius: '8px',
                            border: `1px solid ${tone === t.id ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                            background: tone === t.id ? 'hsl(var(--color-primary) / 0.15)' : 'hsl(var(--color-surface))',
                            color: tone === t.id ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-muted))',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Greeting Message</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={greeting}
                      onChange={e => setGreeting(e.target.value)}
                      placeholder="Welcome message sent when patient says Hi"
                    />
                  </div>
                </div>

                {/* WhatsApp Chat Preview Card */}
                <div style={{
                  background: 'hsl(142 30% 8%)',
                  borderRadius: '16px',
                  border: '1px solid hsl(142 30% 20%)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid hsl(142 20% 18%)', paddingBottom: '0.75rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'hsl(142 71% 45%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🤖</div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{assistantName} • {clinicName}</div>
                        <div style={{ fontSize: '0.65rem', color: 'hsl(142 60% 70%)' }}>Verified WhatsApp Business Assistant</div>
                      </div>
                    </div>

                    <div style={{
                      background: 'hsl(142 40% 14%)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px 12px 12px 0',
                      fontSize: '0.825rem',
                      color: 'hsl(142 10% 95%)',
                      lineHeight: 1.5,
                      marginBottom: '0.5rem',
                    }}>
                      {greeting}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'hsl(142 20% 60%)', textAlign: 'center' }}>
                    Live Patient Preview (WhatsApp)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Dental Services & Fees */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 3: Dental Services & Prices</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Your AI receptionist quotes these prices and computes booking duration accurately.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  className="input"
                  style={{ flex: 3 }}
                  value={newServiceName}
                  onChange={e => setNewServiceName(e.target.value)}
                  placeholder="New Service Name (e.g. Invisible Aligners Consultation)"
                />
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={newServiceDuration}
                  onChange={e => setNewServiceDuration(e.target.value)}
                  placeholder="Mins (30)"
                />
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={newServicePrice}
                  onChange={e => setNewServicePrice(e.target.value)}
                  placeholder="Price ₹"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Add
                </button>
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid hsl(var(--color-border))', borderRadius: '12px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Duration</th>
                      <th>Price</th>
                      <th>Bookable</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{svc.name}</td>
                        <td style={{ color: 'hsl(var(--color-text-muted))' }}>{svc.duration} mins</td>
                        <td style={{ color: 'hsl(142 71% 45%)', fontWeight: 700 }}>₹{svc.price}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={svc.isBookable}
                            onChange={e => {
                              const updated = [...services];
                              updated[idx].isBookable = e.target.checked;
                              setServices(updated);
                            }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            style={{ background: 'none', border: 'none', color: 'hsl(0 84% 60%)', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Working Hours */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 4: Clinic Operating Hours</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                AI Front Desk checks these opening and closing hours before offering appointment slots.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {workingHours.map((wh, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: wh.isOpen ? 'hsl(var(--color-surface))' : 'hsl(var(--color-surface-hover) / 0.5)',
                      borderRadius: '10px',
                      border: '1px solid hsl(var(--color-border))',
                    }}
                  >
                    <div style={{ width: 120, fontWeight: 600, fontSize: '0.875rem' }}>{DAYS[wh.dayOfWeek]}</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={wh.isOpen}
                        onChange={e => {
                          const updated = [...workingHours];
                          updated[idx].isOpen = e.target.checked;
                          setWorkingHours(updated);
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: wh.isOpen ? 'hsl(142 71% 45%)' : 'hsl(var(--color-text-muted))' }}>
                        {wh.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </label>

                    {wh.isOpen ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="time"
                          className="input"
                          style={{ width: 120, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          value={wh.openTime}
                          onChange={e => {
                            const updated = [...workingHours];
                            updated[idx].openTime = e.target.value;
                            setWorkingHours(updated);
                          }}
                        />
                        <span style={{ color: 'hsl(var(--color-text-muted))' }}>to</span>
                        <input
                          type="time"
                          className="input"
                          style={{ width: 120, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          value={wh.closeTime}
                          onChange={e => {
                            const updated = [...workingHours];
                            updated[idx].closeTime = e.target.value;
                            setWorkingHours(updated);
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>No appointments booked</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Booking Policies */}
          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 5: Booking Rules & Policies</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Set guardrails for how far in advance appointments can be booked, rescheduled, or cancelled.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1rem', background: 'hsl(var(--color-surface))' }}>
                  <label className="label">Minimum Advance Notice</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input className="input" type="number" value={minAdvanceHours} onChange={e => setMinAdvanceHours(e.target.value)} />
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Hours</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                    Prevents patients booking slots too close to current time.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', background: 'hsl(var(--color-surface))' }}>
                  <label className="label">Maximum Booking Window</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input className="input" type="number" value={maxAdvanceDays} onChange={e => setMaxAdvanceDays(e.target.value)} />
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Days</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                    Maximum number of days in future patient can book.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', background: 'hsl(var(--color-surface))' }}>
                  <label className="label">Cancellation Cutoff</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input className="input" type="number" value={cancellationHours} onChange={e => setCancellationHours(e.target.value)} />
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Hours</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                    Notice required before cancelling an existing booking.
                  </div>
                </div>

                <div className="card" style={{ padding: '1rem', background: 'hsl(var(--color-surface))' }}>
                  <label className="label">Buffer Between Appointments</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input className="input" type="number" value={bufferMinutes} onChange={e => setBufferMinutes(e.target.value)} />
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>Mins</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.35rem' }}>
                    Sterilization and room turnaround buffer between patients.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: WhatsApp Connection */}
          {currentStep === 6 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 6: Connect WhatsApp Business</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Connect your Meta WhatsApp Cloud API credentials so the receptionist can send and receive real WhatsApp messages.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">WhatsApp Phone Number ID</label>
                  <input
                    className="input"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 104829104810294"
                  />
                </div>
                <div>
                  <label className="label">WhatsApp Business Account ID (WABA ID)</label>
                  <input
                    className="input"
                    value={wabaId}
                    onChange={e => setWabaId(e.target.value)}
                    placeholder="e.g. 10928392019283"
                  />
                </div>
                <div>
                  <label className="label">Permanent System User Access Token</label>
                  <input
                    className="input"
                    type="password"
                    value={waAccessToken}
                    onChange={e => setWaAccessToken(e.target.value)}
                    placeholder="EAAB..."
                  />
                </div>

                {/* Webhook details display for Meta */}
                <div style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'hsl(var(--color-surface))',
                  border: '1px solid hsl(var(--color-border))',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'hsl(var(--color-primary))' }}>
                    📌 Meta Developer Portal Webhook Callback:
                  </div>
                  <div style={{ fontFamily: 'monospace', color: 'hsl(var(--color-text-muted))', wordBreak: 'break-all' }}>
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/whatsapp` : 'https://your-domain.com/api/v1/webhooks/whatsapp'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.25rem' }}>
                    Verify Token: configured in your clinic's integration settings. You can also skip this step and configure later!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Google Calendar Connection */}
          {currentStep === 7 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 7: Connect Google Calendar</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Two-way sync: Appointments booked by AI are automatically added to your Google Calendar, and your existing events block AI booking.
              </p>

              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                borderRadius: '16px',
                border: '1px dashed hsl(var(--color-border))',
                background: 'hsl(var(--color-surface))',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {calendarConnected ? '✅ Google Calendar Connected' : 'Connect Your Google Doctor Calendar'}
                </h3>
                <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem', maxWidth: 450, margin: '0 auto 1.5rem auto' }}>
                  {calendarConnected
                    ? 'Sync is active. Appointments will appear automatically in your calendar.'
                    : 'Click below to authorize AI Front Desk with your clinic Google account.'}
                </p>

                {!calendarConnected ? (
                  <a
                    href="/api/v1/integrations/calendar/auth"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                  >
                    <span>Connect Google Calendar</span>
                    <span>→</span>
                  </a>
                ) : (
                  <div style={{ color: 'hsl(142 71% 45%)', fontWeight: 600, fontSize: '0.9rem' }}>
                    Connected successfully!
                  </div>
                )}

                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setCalendarConnected(true)}
                    style={{ background: 'none', border: 'none', color: 'hsl(var(--color-text-muted))', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Simulate Calendar Connected for Testing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Plan Selection & UPI Activation */}
          {currentStep === 8 && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Step 8: Plan Selection & UPI Activation</h2>
              <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Select your monthly subscription plan. Pay instantly via UPI without Razorpay.
              </p>

              {/* Plan Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  {
                    id: 'starter',
                    name: 'Starter',
                    price: '₹2,499',
                    chats: '500 AI chats/mo',
                    features: ['WhatsApp Integration', 'Basic Working Hours', 'Gemini AI Model'],
                  },
                  {
                    id: 'pro',
                    name: 'Pro (Recommended)',
                    price: '₹4,999',
                    chats: '2,000 AI chats/mo',
                    features: ['Google Calendar 2-Way Sync', 'OpenAI Fallback', 'Unlimited Bookings', 'Human Takeover Inbox'],
                    badge: 'Popular',
                  },
                  {
                    id: 'growth',
                    name: 'Clinic Growth',
                    price: '₹8,999',
                    chats: '5,000 AI chats/mo',
                    features: ['Multi-Doctor Support', 'Custom AI Voice & Knowledge', 'Priority WhatsApp Webhook'],
                  },
                ].map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: `2px solid ${selectedPlan === p.id ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                      background: selectedPlan === p.id ? 'hsl(var(--color-primary) / 0.08)' : 'hsl(var(--color-surface))',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {p.badge && (
                      <div style={{
                        position: 'absolute',
                        top: -10,
                        right: 12,
                        background: 'var(--gradient-brand)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                      }}>
                        {p.badge}
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.name}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                      {p.price}<span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-primary))', marginBottom: '0.75rem' }}>
                      {p.chats}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                      {p.features.map((f, i) => (
                        <li key={i} style={{ marginBottom: '0.35rem' }}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* UPI Payment Box */}
              <div style={{
                background: 'hsl(var(--color-surface))',
                borderRadius: '16px',
                border: '1px solid hsl(var(--color-border))',
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '180px 1fr',
                gap: '1.5rem',
                alignItems: 'center',
              }}>
                {/* QR Display */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: 140,
                    height: 140,
                    background: 'radial-gradient(circle, #000 10%, #fff 11%, #fff 20%, #000 21%, #000 30%, #fff 31%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                  }}>
                    UPI QR CODE
                  </div>
                  <div style={{ color: '#333', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.35rem' }}>
                    Scan with GPay / PhonePe / Paytm
                  </div>
                </div>

                {/* UPI Details & UTR Input */}
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>Platform UPI VPA:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--color-primary))', fontFamily: 'monospace' }}>
                      frontdesk@icici (or clinicfront@upi)
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">12-Digit Bank UTR / Transaction Reference</label>
                    <input
                      className="input"
                      value={utrNumber}
                      onChange={e => setUtrNumber(e.target.value)}
                      placeholder="e.g. 429104928104 (from your UPI receipt)"
                    />
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                    💡 Once submitted, our automated verification activates your AI receptionist instantly.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid hsl(var(--color-border))',
          }}>
            {currentStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 8 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Next Step →'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(160 84% 39%) 100%)' }}
                onClick={handleCompleteActivation}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Activating...' : '🚀 Activate AI Receptionist'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
