'use client';

// src/app/dashboard/configuration/page.tsx
// Claude-inspired Clinic Configuration Page: Clinic Details, AI Persona, Services, Hours & Policies

import React, { useState, useEffect } from 'react';
import { CLINIC_TYPES, ClinicTypeId, getClinicTypeConfig } from '@/lib/constants/clinic-types';

interface Service {
  name: string;
  duration: number;
  price: string;
  isBookable: boolean;
}

interface WorkingHourDay {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, name: 'Monday', short: 'Mon' },
  { dayOfWeek: 2, name: 'Tuesday', short: 'Tue' },
  { dayOfWeek: 3, name: 'Wednesday', short: 'Wed' },
  { dayOfWeek: 4, name: 'Thursday', short: 'Thu' },
  { dayOfWeek: 5, name: 'Friday', short: 'Fri' },
  { dayOfWeek: 6, name: 'Saturday', short: 'Sat' },
  { dayOfWeek: 0, name: 'Sunday', short: 'Sun' },
];

function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minStr || '00'} ${ampm}`;
}

function calculateDurationHours(openTime: string, closeTime: string): string {
  if (!openTime || !closeTime) return '';
  const [oh, om] = openTime.split(':').map(Number);
  const [ch, cm] = closeTime.split(':').map(Number);
  const startMins = (oh || 0) * 60 + (om || 0);
  const endMins = (ch || 0) * 60 + (cm || 0);
  const diffMins = endMins - startMins;
  if (diffMins <= 0) return '0 hrs';
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hrs`;
}

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'agent' | 'services' | 'hours' | 'policies'>('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clinic Profile State
  const [businessType, setBusinessType] = useState<ClinicTypeId>('dental_clinic');
  const currentConfig = getClinicTypeConfig(businessType);

  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // AI Agent State
  const [assistantName, setAssistantName] = useState('Roma');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'concise'>('friendly');
  const [greeting, setGreeting] = useState('');

  // Services State
  const [services, setServices] = useState<Service[]>([]);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState('30');

  // Working Hours State
  const [workingHours, setWorkingHours] = useState<WorkingHourDay[]>([
    { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' },
    { dayOfWeek: 6, isOpen: false, openTime: '10:00', closeTime: '16:00' },
    { dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '14:00' },
  ]);

  // Policies State
  const [minAdvanceHours, setMinAdvanceHours] = useState('2');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('30');
  const [cancellationHours, setCancellationHours] = useState('12');
  const [bufferMinutes, setBufferMinutes] = useState('10');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/v1/clinic/config');
        const json = await res.json();
        if (json.data) {
          const { clinic, agent, services: svcList, workingHours: whList, bookingPolicy } = json.data;
          if (clinic) {
            setClinicName(clinic.name || '');
            setPhone(clinic.phone || '');
            setAddress(clinic.address || '');
            setCity(clinic.city || '');
            setTimezone(clinic.timezone || 'Asia/Kolkata');
            if (clinic.businessType && CLINIC_TYPES.some(t => t.id === clinic.businessType)) {
              setBusinessType(clinic.businessType as ClinicTypeId);
            }
          }
          if (agent) {
            setAssistantName(agent.assistantName || 'Roma');
            setTone(agent.tone || 'friendly');
            setGreeting(agent.greeting || '');
          }
          if (svcList && svcList.length > 0) {
            setServices(svcList);
          } else {
            setServices(currentConfig.defaultServices.map(s => ({ ...s, isBookable: true })));
          }
          if (whList && whList.length > 0) {
            setWorkingHours(whList.map((h: any) => ({
              dayOfWeek: h.dayOfWeek,
              isOpen: Boolean(h.isOpen),
              openTime: h.openTime || '09:00',
              closeTime: h.closeTime || '18:00',
            })));
          }
          if (bookingPolicy) {
            setMinAdvanceHours(String(bookingPolicy.minAdvanceHours || 2));
            setMaxAdvanceDays(String(bookingPolicy.maxAdvanceDays || 30));
            setCancellationHours(String(bookingPolicy.cancellationHours || 12));
            setBufferMinutes(String(bookingPolicy.bufferMinutes || 10));
          }
        }
      } catch (e) {
        console.error('Error loading clinic config:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      await fetch('/api/v1/clinic/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic: {
            name: clinicName,
            phone,
            address,
            city,
            timezone,
            businessType,
          },
          agent: {
            assistantName,
            tone,
            greeting,
          },
          services: services.map(s => ({
            name: s.name,
            duration: s.duration,
            price: s.price,
            isBookable: s.isBookable,
          })),
          workingHours: workingHours.map(h => ({
            dayOfWeek: h.dayOfWeek,
            isOpen: h.isOpen,
            openTime: h.isOpen ? h.openTime : null,
            closeTime: h.isOpen ? h.closeTime : null,
          })),
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

  const handleToggleDay = (dayOfWeek: number) => {
    setWorkingHours(prev =>
      prev.map(d => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', val: string) => {
    setWorkingHours(prev =>
      prev.map(d => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: val } : d))
    );
  };

  const handleApplyPreset = (preset: 'standard' | 'tuesday11to5' | 'allOpen' | 'copyMonday') => {
    if (preset === 'standard') {
      setWorkingHours([
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' },
        { dayOfWeek: 6, isOpen: false, openTime: '10:00', closeTime: '16:00' },
        { dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '14:00' },
      ]);
    } else if (preset === 'tuesday11to5') {
      setWorkingHours(prev =>
        prev.map(d => (d.isOpen ? { ...d, openTime: '11:00', closeTime: '17:00' } : d))
      );
    } else if (preset === 'allOpen') {
      setWorkingHours(prev => prev.map(d => ({ ...d, isOpen: true })));
    } else if (preset === 'copyMonday') {
      const mon = workingHours.find(d => d.dayOfWeek === 1);
      if (mon) {
        setWorkingHours(prev =>
          prev.map(d => (d.dayOfWeek !== 1 && d.isOpen ? { ...d, openTime: mon.openTime, closeTime: mon.closeTime } : d))
        );
      }
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

  if (loading) {
    return (
      <div style={{ width: '100%', padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#D97757' }}>✦</div>
        <div style={{ color: '#706C65', fontSize: '0.9rem', fontWeight: 500 }}>Loading clinic configuration...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 500, fontFamily: 'var(--font-serif)', color: '#262522', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Clinic Configuration
          </h1>
          <p style={{ color: '#706C65', fontSize: '0.875rem' }}>
            Manage clinic identity, AI receptionist persona, service catalog fees, and booking guardrails.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {saveSuccess && (
            <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem' }}>
              ✓ Changes saved
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Claude Pill Style) */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid #E7E2DA',
        paddingBottom: '0.75rem',
        overflowX: 'auto',
      }}>
        {[
          { id: 'profile', label: '🏥 Clinic Profile' },
          { id: 'agent', label: '🤖 AI Persona' },
          { id: 'services', label: `${currentConfig.icon} Services & Prices` },
          { id: 'hours', label: '🕒 Working Hours' },
          { id: 'policies', label: '📋 Booking Policies' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: `1px solid ${isActive ? '#F0D5C7' : 'transparent'}`,
                background: isActive ? '#F8E8DE' : 'transparent',
                color: isActive ? '#C86646' : '#706C65',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#262522', marginBottom: '0.35rem' }}>Clinic Essentials</h2>
          <p style={{ color: '#706C65', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Basic clinic contact information used when addressing patients and sending booking confirmations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Clinic Specialty Selector */}
            <div style={{
              background: '#F4F1EB',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #E7E2DA',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ fontWeight: 600, margin: 0, color: '#262522' }}>
                  <span>🩺</span> Clinic Specialty / Healthcare Type
                </label>
                <span style={{ fontSize: '0.8rem', color: '#D97757', fontWeight: 600 }}>
                  {currentConfig.icon} {currentConfig.label}
                </span>
              </div>
              <select
                className="input"
                value={businessType}
                onChange={e => setBusinessType(e.target.value as ClinicTypeId)}
                style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: '#FFFFFF',
                }}
              >
                {CLINIC_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.78rem', color: '#706C65', marginTop: '0.45rem' }}>
                ✦ {currentConfig.specialtyDescription}
              </div>
            </div>

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
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#262522', marginBottom: '0.35rem' }}>AI Receptionist Persona</h2>
          <p style={{ color: '#706C65', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Customize how your virtual receptionist introduces itself and converses with patients.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-field" style={{ maxWidth: 400 }}>
              <label className="label"><span>🤖</span> Assistant Name</label>
              <input className="input" value={assistantName} onChange={e => setAssistantName(e.target.value)} />
              <span className="form-hint">Virtual receptionist&apos;s name on WhatsApp</span>
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
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? '#D97757' : '#E7E2DA'}`,
                        background: isSelected ? '#F8E8DE' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? '#C86646' : '#262522', marginBottom: '0.2rem' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#706C65' }}>
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

      {/* Tab 3: Dental Services & Pricing */}
      {activeTab === 'services' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#262522', marginBottom: '0.35rem' }}>Services & Pricing</h2>
              <p style={{ color: '#706C65', fontSize: '0.85rem' }}>
                All prices and durations below are <strong style={{ color: '#262522' }}>directly editable inline</strong>. AI receptionist quotes these fees in WhatsApp chats.
              </p>
            </div>
            <span className="badge badge-success">
              ✏️ Click any price to edit
            </span>
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#706C65', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              + Popular {currentConfig.label.split('&')[0].trim()} Procedures:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {currentConfig.popularPresets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddPreset(p)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  <span>+</span>
                  <span>{p.name}</span>
                  <span style={{ color: '#487B57', fontWeight: 600 }}>₹{p.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Service Bar */}
          <div style={{
            background: '#F4F1EB',
            borderRadius: '12px',
            border: '1px solid #E7E2DA',
            padding: '0.85rem',
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
                placeholder="Procedure name (e.g. Teeth Whitening)..."
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
              style={{ flex: '0 0 auto' }}
            >
              + Add Service
            </button>
          </div>

          {/* Services Table */}
          <div className="table-responsive" style={{
            border: '1px solid #E7E2DA',
            borderRadius: '12px',
            overflowX: 'auto',
            background: '#FFFFFF',
          }}>
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Service Name</th>
                  <th style={{ width: 130, whiteSpace: 'nowrap' }}>Duration</th>
                  <th style={{ width: 150, whiteSpace: 'nowrap' }}>Price (₹)</th>
                  <th style={{ width: 110, textAlign: 'center', whiteSpace: 'nowrap' }}>Bookable</th>
                  <th style={{ width: 50, textAlign: 'right' }}></th>
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
                        style={{ color: '#262522' }}
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
                          style={{ color: '#262522' }}
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
                          style={{ color: '#262522' }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleBookable(idx)}
                        className={`badge ${s.isBookable ? 'badge-success' : 'badge-neutral'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
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
                          color: '#C44E45',
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

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#706C65' }}>
            <span>{services.length} services configured</span>
            <span>Remember to click &ldquo;Save Changes&rdquo; at the top right to apply updates</span>
          </div>
        </div>
      )}

      {/* Tab: Working Hours & Booking Days */}
      {activeTab === 'hours' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#262522', marginBottom: '0.35rem' }}>
                Weekly Working Hours & Booking Days
              </h2>
              <p style={{ color: '#706C65', fontSize: '0.85rem' }}>
                Set your operating hours for each day of the week, or toggle off bookings completely for any day. The AI receptionist checks these hours in real time when scheduling appointments.
              </p>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleApplyPreset('standard')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Mon-Fri (9 AM – 6 PM)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('tuesday11to5')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                11 AM – 5 PM
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('allOpen')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Open All 7 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('copyMonday')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                Copy Monday Hours
              </button>
            </div>
          </div>

          {/* Days List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DAYS_OF_WEEK.map(d => {
              const dayConfig = workingHours.find(h => h.dayOfWeek === d.dayOfWeek) || {
                dayOfWeek: d.dayOfWeek,
                isOpen: d.dayOfWeek >= 1 && d.dayOfWeek <= 5,
                openTime: '09:00',
                closeTime: '18:00',
              };

              const durationLabel = dayConfig.isOpen
                ? calculateDurationHours(dayConfig.openTime, dayConfig.closeTime)
                : '';

              return (
                <div
                  key={d.dayOfWeek}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '0.85rem 1.25rem',
                    background: dayConfig.isOpen ? '#FFFFFF' : '#F4F1EB',
                    border: `1px solid ${dayConfig.isOpen ? '#E7E2DA' : '#EDE8DF'}`,
                    borderRadius: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Day Name & Toggle Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '220px' }}>
                    <div style={{ width: '100px', fontWeight: 600, fontSize: '0.9rem', color: dayConfig.isOpen ? '#262522' : '#706C65' }}>
                      {d.name}
                    </div>

                    {/* Toggle Switch */}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={dayConfig.isOpen}
                        onChange={() => handleToggleDay(d.dayOfWeek)}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '999px',
                        background: dayConfig.isOpen ? '#487B57' : '#E7E2DA',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '3px',
                          left: dayConfig.isOpen ? '21px' : '3px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: dayConfig.isOpen ? '#487B57' : '#706C65',
                      }}>
                        {dayConfig.isOpen ? 'Open for Bookings' : 'Closed'}
                      </span>
                    </label>
                  </div>

                  {/* Right: Time Controls or Closed Notice */}
                  {dayConfig.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#706C65', fontWeight: 500 }}>Opens:</span>
                        <input
                          type="time"
                          value={dayConfig.openTime}
                          onChange={(e) => handleTimeChange(d.dayOfWeek, 'openTime', e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #E7E2DA',
                            color: '#262522',
                          }}
                        />
                      </div>

                      <span style={{ color: '#706C65', fontSize: '0.85rem' }}>to</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#706C65', fontWeight: 500 }}>Closes:</span>
                        <input
                          type="time"
                          value={dayConfig.closeTime}
                          onChange={(e) => handleTimeChange(d.dayOfWeek, 'closeTime', e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid #E7E2DA',
                            color: '#262522',
                          }}
                        />
                      </div>

                      {/* Formatted Badge */}
                      <span style={{
                        fontSize: '0.75rem',
                        background: '#F4F1EB',
                        color: '#706C65',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: '1px solid #E7E2DA',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatTime12h(dayConfig.openTime)} – {formatTime12h(dayConfig.closeTime)} ({durationLabel})
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#706C65',
                      fontStyle: 'italic',
                      padding: '0.35rem 0.75rem',
                      background: '#FFFFFF',
                      borderRadius: '6px',
                      border: '1px dashed #E7E2DA',
                    }}>
                      No bookings accepted • Clinic marked as closed
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#706C65' }}>
            <span>
              {workingHours.filter(h => h.isOpen).length} of 7 days open for patient appointments
            </span>
            <span>Remember to click &ldquo;Save Changes&rdquo; at the top right to apply updates</span>
          </div>
        </div>
      )}

      {/* Tab 4: Booking Policies */}
      {activeTab === 'policies' && (
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#262522', marginBottom: '0.35rem' }}>Booking Guardrails & Policies</h2>
          <p style={{ color: '#706C65', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Configure automatic constraints governing appointment scheduling, cancellations, and operatory turnover.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem', background: '#F4F1EB' }}>
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

            <div className="card" style={{ padding: '1.25rem', background: '#F4F1EB' }}>
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

            <div className="card" style={{ padding: '1.25rem', background: '#F4F1EB' }}>
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

            <div className="card" style={{ padding: '1.25rem', background: '#F4F1EB' }}>
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
