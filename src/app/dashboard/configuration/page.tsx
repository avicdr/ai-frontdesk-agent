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

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'agent' | 'services' | 'hours' | 'policies'>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Clinic Profile State
  const [clinicName, setClinicName] = useState('Apex Dental & Orthodontics');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('42 Park Avenue, Koramangala');
  const [city, setCity] = useState('Bengaluru');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // AI Agent State
  const [assistantName, setAssistantName] = useState('Aria');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'concise'>('friendly');
  const [greeting, setGreeting] = useState(
    "Hello! Welcome to Apex Dental & Orthodontics. I'm Aria, your AI receptionist. How can I assist you with your dental care today?"
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
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            ⚙️ Clinic Configuration
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.875rem' }}>
            Manage clinic details, AI personality, service catalog, and booking constraints.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saveSuccess && (
            <span style={{ color: 'hsl(142 71% 45%)', fontSize: '0.85rem', fontWeight: 600 }}>
              ✓ Changes saved successfully!
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '0.5rem' }}>
        {[
          { id: 'profile', label: '🏥 Clinic Profile' },
          { id: 'agent', label: '🤖 AI Receptionist Persona' },
          { id: 'services', label: '🦷 Dental Services & Pricing' },
          { id: 'policies', label: '📋 Booking Policies' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'hsl(var(--color-primary) / 0.15)' : 'transparent',
              color: activeTab === tab.id ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-muted))',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: 700, padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Clinic Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Clinic Name</label>
              <input className="input" value={clinicName} onChange={e => setClinicName(e.target.value)} />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="label">Address</label>
              <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <label className="label">Timezone</label>
              <input className="input" value={timezone} onChange={e => setTimezone(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Agent Persona */}
      {activeTab === 'agent' && (
        <div className="card" style={{ maxWidth: 700, padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>AI Receptionist Persona</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Assistant Name</label>
              <input className="input" value={assistantName} onChange={e => setAssistantName(e.target.value)} />
            </div>
            <div>
              <label className="label">Conversational Tone</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['friendly', 'professional', 'concise'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t as any)}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      borderRadius: '8px',
                      border: `1px solid ${tone === t ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                      background: tone === t ? 'hsl(var(--color-primary) / 0.15)' : 'hsl(var(--color-surface))',
                      color: tone === t ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-muted))',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dental Services */}
      {activeTab === 'services' && (
        <div className="card" style={{ maxWidth: 800, padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Dental Services & Pricing</h2>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input
              className="input"
              style={{ flex: 3 }}
              value={newSvcName}
              onChange={e => setNewSvcName(e.target.value)}
              placeholder="Add Service Name..."
            />
            <input
              className="input"
              style={{ flex: 1 }}
              value={newSvcDuration}
              onChange={e => setNewSvcDuration(e.target.value)}
              placeholder="Mins (30)"
            />
            <input
              className="input"
              style={{ flex: 1 }}
              value={newSvcPrice}
              onChange={e => setNewSvcPrice(e.target.value)}
              placeholder="Fee ₹"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddService}
            >
              + Add
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Bookable</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: 'hsl(var(--color-text-muted))' }}>{s.duration} mins</td>
                  <td style={{ color: 'hsl(142 71% 45%)', fontWeight: 700 }}>₹{s.price}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={s.isBookable}
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
                      onClick={() => setServices(services.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: 'hsl(0 84% 60%)', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Booking Policies */}
      {activeTab === 'policies' && (
        <div className="card" style={{ maxWidth: 700, padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Booking Guardrails & Policies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Minimum Advance Notice (Hours)</label>
              <input className="input" type="number" value={minAdvanceHours} onChange={e => setMinAdvanceHours(e.target.value)} />
            </div>
            <div>
              <label className="label">Maximum Booking Horizon (Days)</label>
              <input className="input" type="number" value={maxAdvanceDays} onChange={e => setMaxAdvanceDays(e.target.value)} />
            </div>
            <div>
              <label className="label">Cancellation Window Cutoff (Hours)</label>
              <input className="input" type="number" value={cancellationHours} onChange={e => setCancellationHours(e.target.value)} />
            </div>
            <div>
              <label className="label">Buffer Between Appointments (Minutes)</label>
              <input className="input" type="number" value={bufferMinutes} onChange={e => setBufferMinutes(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
