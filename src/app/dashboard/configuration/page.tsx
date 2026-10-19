'use client';

// src/app/dashboard/configuration/page.tsx
// Clinic Configuration Page: Clinic Details, AI Persona, Services, Hours & Policies

import React, { useState, useEffect } from 'react';

interface Service {
  name: string;
  duration: number;
  price: string;
  isBookable: boolean;
}

const POPULAR_DENTAL_PRESETS = [
  { name: 'Invisible Aligners Consultation', duration: 30, price: '1500' },
  { name: 'Dental Implant Consultation', duration: 45, price: '2000' },
  { name: 'Composite Dental Veneers', duration: 60, price: '4000' },
  { name: 'Wisdom Tooth Surgical Extraction', duration: 45, price: '3500' },
  { name: 'Zirconia Ceramic Crown', duration: 45, price: '7500' },
];

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'agent' | 'services' | 'policies'>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clinic Profile State
  const [clinicName, setClinicName] = useState('Don\'t Go Home Clinic');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('What\'s My Location');
  const [city, setCity] = useState('Bengaluru');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // AI Agent State
  const [assistantName, setAssistantName] = useState('Roma');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'concise'>('friendly');
  const [greeting, setGreeting] = useState(
    "Hello! Welcome to Don't Go Home Clinic. I'm Roma, your AI receptionist. How can I assist you with your dental care today?"
  );

  // Services State
  const [services, setServices] = useState<Service[]>([
    { name: 'Routine Dental Consultation & Checkup', duration: 30, price: '500', isBookable: true },
    { name: 'Professional Teeth Cleaning (Scaling & Polishing)', duration: 45, price: '1200', isBookable: true },
    { name: 'Root Canal Treatment (RCT)', duration: 60, price: '4500', isBookable: true },
    { name: 'Teeth Whitening (Laser Bleaching)', duration: 45, price: '3000', isBookable: true },
    { name: 'Emergency Dental Pain Relief', duration: 30, price: '800', isBookable: true },
  ]);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState('30');

  // Policies State
  const [minAdvanceHours, setMinAdvanceHours] = useState('2');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('30');
  const [cancellationHours, setCancellationHours] = useState('12');
  const [bufferMinutes, setBufferMinutes] = useState('10');

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await fetch('/api/v1/onboarding');
        const json = await res.json();
        if (json?.success && json?.data && isMounted) {
          const { clinicProfile, agentConfig, services: loadedServices, bookingPolicy, organizationName } = json.data;
          if (clinicProfile?.clinic_name || organizationName) {
            setClinicName(clinicProfile?.clinic_name || organizationName);
          }
          if (clinicProfile?.phone) setPhone(clinicProfile.phone);
          if (clinicProfile?.address_line1) setAddress(clinicProfile.address_line1);
          if (clinicProfile?.city) setCity(clinicProfile.city);
          if (clinicProfile?.timezone) setTimezone(clinicProfile.timezone);

          if (agentConfig?.assistant_name) setAssistantName(agentConfig.assistant_name);
          if (agentConfig?.tone) setTone(agentConfig.tone);
          if (agentConfig?.greeting_message) setGreeting(agentConfig.greeting_message);

          if (Array.isArray(loadedServices) && loadedServices.length > 0) {
            setServices(loadedServices.map((s: any) => ({
              name: s.name,
              duration: s.duration_minutes ?? 30,
              price: s.price_display ?? String(s.price_minor_units ? s.price_minor_units / 100 : 0),
              isBookable: s.is_active ?? true,
            })));
          }

          if (bookingPolicy) {
            if (bookingPolicy.min_advance_hours != null) setMinAdvanceHours(String(bookingPolicy.min_advance_hours));
            if (bookingPolicy.max_advance_days != null) setMaxAdvanceDays(String(bookingPolicy.max_advance_days));
            if (bookingPolicy.cancellation_hours != null) setCancellationHours(String(bookingPolicy.cancellation_hours));
            if (bookingPolicy.buffer_minutes != null) setBufferMinutes(String(bookingPolicy.buffer_minutes));
          }
        }
      } catch (err) {
        console.error('Failed to load clinic configuration:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      await fetch('/api/v1/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicInfo: { clinicName, phone, address, city, timezone },
          agentConfig: { assistantName, tone, greetingMessage: greeting },
          services,
          bookingPolicy: {
            minAdvanceHours: parseInt(minAdvanceHours, 10),
            maxAdvanceDays: parseInt(maxAdvanceDays, 10),
            cancellationHours: parseInt(cancellationHours, 10),
            bufferMinutes: parseInt(bufferMinutes, 10),
          },
        }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    if (!newSvcName.trim()) return;
    setServices([
      ...services,
      {
        name: newSvcName.trim(),
        price: newSvcPrice.trim() || '0',
        duration: parseInt(newSvcDuration, 10) || 30,
        isBookable: true,
      },
    ]);
    setNewSvcName('');
    setNewSvcPrice('');
    setNewSvcDuration('30');
  };

  const handleUpdatePrice = (index: number, newPrice: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], price: newPrice };
    setServices(updated);
  };

  const handleUpdateDuration = (index: number, newDuration: number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], duration: newDuration };
    setServices(updated);
  };

  const handleUpdateName = (index: number, newName: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], name: newName };
    setServices(updated);
  };

  const handleToggleBookable = (index: number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], isBookable: !updated[index].isBookable };
    setServices(updated);
  };

  const handleAddPreset = (preset: { name: string; duration: number; price: string }) => {
    if (services.some(s => s.name.toLowerCase() === preset.name.toLowerCase())) return;
    setServices([...services, { ...preset, isBookable: true }]);
  };

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ⚙️ Clinic Configuration
          </h1>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.9rem' }}>
            Manage clinic identity, AI receptionist persona, service catalog prices, and booking guardrails.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {saveSuccess && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#4ade80',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'hsla(142, 71%, 45%, 0.15)',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid hsla(142, 71%, 45%, 0.3)',
            }}>
              ✓ Changes saved!
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid hsl(var(--color-border))',
        paddingBottom: '0.75rem',
      }}>
        {[
          { id: 'profile', label: '🏥 Clinic Profile' },
          { id: 'agent', label: '🤖 AI Persona' },
          { id: 'services', label: '🦷 Services & Prices' },
          { id: 'policies', label: '📋 Booking Policies' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: `1px solid ${isActive ? 'hsl(var(--color-primary))' : 'transparent'}`,
                background: isActive ? 'hsla(221, 83%, 58%, 0.15)' : 'transparent',
                color: isActive ? '#93c5fd' : 'hsl(var(--color-text-secondary))',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '2rem', background: 'hsl(var(--color-surface))' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Clinic Essentials</h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Basic clinic contact information used when addressing patients and sending booking confirmations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-field">
                <label className="label"><span>🏥</span> Clinic Name</label>
                <input className="input" value={clinicName} onChange={e => setClinicName(e.target.value)} />
                <span className="form-hint">Official practice name displayed to patients</span>
              </div>
              <div className="form-field">
                <label className="label"><span>📞</span> Contact Phone</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                <span className="form-hint">Direct line for emergencies & manual staff transfers</span>
              </div>
            </div>

            <div className="form-field">
              <label className="label"><span>📍</span> Address</label>
              <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
              <span className="form-hint">Physical clinic address provided upon appointment booking</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-field">
                <label className="label"><span>🏙️</span> City / Area</label>
                <input className="input" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="label"><span>🌐</span> Timezone</label>
                <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST — UTC+4:00)</option>
                  <option value="America/New_York">America/New_York (EST — UTC-5:00)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT — UTC+8:00)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Agent Persona */}
      {activeTab === 'agent' && (
        <div className="card" style={{ padding: '2rem', background: 'hsl(var(--color-surface))' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Receptionist Persona</h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Customize how your virtual receptionist introduces itself and converses with patients.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-field" style={{ maxWidth: 400 }}>
              <label className="label"><span>🤖</span> Assistant Name</label>
              <input className="input" value={assistantName} onChange={e => setAssistantName(e.target.value)} />
              <span className="form-hint">Virtual receptionist's name on WhatsApp</span>
            </div>

            <div className="form-field">
              <label className="label"><span>🎭</span> Conversational Tone</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {[
                  { id: 'friendly', title: '🌸 Warm & Friendly', desc: 'Gentle, polite & empathetic' },
                  { id: 'professional', title: '👔 Professional', desc: 'Formal, clinical precision' },
                  { id: 'concise', title: '⚡ Fast & Concise', desc: 'Direct, speedy slot quotes' },
                ].map(t => {
                  const isSelected = tone === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTone(t.id as any)}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: `1.5px solid ${isSelected ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                        background: isSelected ? 'hsla(221, 83%, 58%, 0.12)' : 'hsl(var(--color-surface-2))',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#93c5fd' : '#f8fafc', marginBottom: '0.25rem' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                        {t.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-field">
              <label className="label"><span>💬</span> Welcome Greeting Message</label>
              <textarea
                className="input"
                rows={3}
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
              />
              <span className="form-hint">Sent automatically whenever a new patient sends an initial greeting</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dental Services & Pricing (EDITABLE PRICES) */}
      {activeTab === 'services' && (
        <div className="card" style={{ padding: '2rem', background: 'hsl(var(--color-surface))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' }}>Dental Services & Pricing</h2>
              <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.85rem' }}>
                All prices and durations below are <strong style={{ color: '#4ade80' }}>directly editable inline</strong>. AI receptionist quotes these fees in WhatsApp chats.
              </p>
            </div>
            <div style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              background: 'hsla(142, 71%, 45%, 0.12)',
              border: '1px solid hsla(142, 71%, 45%, 0.3)',
              color: '#4ade80',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              ✏️ Click any price to edit
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-text-muted))', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              + Popular Dental Procedures:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {POPULAR_DENTAL_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddPreset(p)}
                  className="preset-chip"
                >
                  <span>+</span>
                  <span>{p.name}</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{p.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Service Bar */}
          <div style={{
            background: 'hsl(var(--color-surface-2))',
            borderRadius: '14px',
            border: '1px solid hsl(var(--color-border))',
            padding: '0.875rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '3 1 220px' }}>
              <input
                className="input"
                value={newSvcName}
                onChange={e => setNewSvcName(e.target.value)}
                placeholder="Procedure name (e.g. Invisible Aligners)..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
              />
            </div>

            <div style={{ flex: '1 1 120px' }} className="input-addon-group">
              <input
                type="number"
                min="5"
                step="5"
                value={newSvcDuration}
                onChange={e => setNewSvcDuration(e.target.value)}
                placeholder="30"
              />
              <div className="input-addon-suffix">mins</div>
            </div>

            <div style={{ flex: '1 1 130px' }} className="input-addon-group">
              <div className="input-addon-prefix">₹</div>
              <input
                type="number"
                min="0"
                step="100"
                value={newSvcPrice}
                onChange={e => setNewSvcPrice(e.target.value)}
                placeholder="Fee"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddService}
              style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem' }}
            >
              + Add Service
            </button>
          </div>

          {/* Services Table */}
          <div style={{
            border: '1px solid hsl(var(--color-border))',
            borderRadius: '14px',
            overflow: 'hidden',
            background: 'hsl(var(--color-surface))',
          }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '42%' }}>Service Name</th>
                  <th style={{ width: '20%' }}>Duration</th>
                  <th style={{ width: '22%' }}>Price (₹) <span style={{ color: '#4ade80' }}>• Editable</span></th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Bookable</th>
                  <th style={{ width: '4%' }}></th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="service-name-input"
                        value={s.name}
                        onChange={e => handleUpdateName(idx, e.target.value)}
                        title="Click to rename service"
                      />
                    </td>
                    <td>
                      <div className="duration-editable-cell">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={s.duration}
                          onChange={e => handleUpdateDuration(idx, parseInt(e.target.value, 10) || 15)}
                        />
                        <span className="unit-tag">mins</span>
                      </div>
                    </td>
                    <td>
                      <div className="price-editable-cell" title="Click to edit price directly">
                        <span className="currency-tag">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={s.price}
                          onChange={e => handleUpdatePrice(idx, e.target.value)}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBookable(idx)}
                        className={`switch-pill ${s.isBookable ? 'active' : 'inactive'}`}
                        title={s.isBookable ? 'Click to pause' : 'Click to enable booking'}
                      >
                        <span>{s.isBookable ? '✓ Active' : '✕ Paused'}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setServices(services.filter((_, i) => i !== idx))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                        }}
                        title="Remove service"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
            <span>{services.length} services configured</span>
            <span>Remember to click "Save Changes" at the top right to apply updates</span>
          </div>
        </div>
      )}

      {/* Tab 4: Booking Policies */}
      {activeTab === 'policies' && (
        <div className="card" style={{ padding: '2rem', background: 'hsl(var(--color-surface))' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Booking Guardrails & Policies</h2>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Configure automatic constraints governing appointment scheduling, cancellations, and operatory turnover.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
              <label className="label"><span>⏱️</span> Minimum Advance Notice</label>
              <div className="input-addon-group" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  value={minAdvanceHours}
                  onChange={e => setMinAdvanceHours(e.target.value)}
                />
                <div className="input-addon-suffix">Hours</div>
              </div>
              <span className="form-hint">Prevents patients booking slots too close to current time</span>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
              <label className="label"><span>📅</span> Maximum Booking Horizon</label>
              <div className="input-addon-group" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={maxAdvanceDays}
                  onChange={e => setMaxAdvanceDays(e.target.value)}
                />
                <div className="input-addon-suffix">Days</div>
              </div>
              <span className="form-hint">Furthest days in advance a patient is allowed to book</span>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
              <label className="label"><span>🚫</span> Cancellation Cutoff Window</label>
              <div className="input-addon-group" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  min="1"
                  value={cancellationHours}
                  onChange={e => setCancellationHours(e.target.value)}
                />
                <div className="input-addon-suffix">Hours</div>
              </div>
              <span className="form-hint">Notice required before patient can cancel/reschedule</span>
            </div>

            <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
              <label className="label"><span>🧼</span> Buffer Between Appointments</label>
              <div className="input-addon-group" style={{ marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={bufferMinutes}
                  onChange={e => setBufferMinutes(e.target.value)}
                />
                <div className="input-addon-suffix">Mins</div>
              </div>
              <span className="form-hint">Operatory sterilization and room turnaround gap</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
