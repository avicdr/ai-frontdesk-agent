'use client';

// src/app/dashboard/configuration/page.tsx
// Cinematic Obsidian × Phoenix Ember Clinic Configuration Page: Clinic Details, AI Persona, Services, Hours & Policies

import React, { useState, useEffect } from 'react';
import { CLINIC_TYPES, ClinicTypeId, getClinicTypeConfig } from '@/lib/constants/clinic-types';
import { GoogleMapsLocationPicker } from '@/components/clinic/GoogleMapsLocationPicker';
import { DEFAULT_REVIEW_TEMPLATE, formatReviewMessage } from '@/lib/reviews/constants';

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
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Google Reviews & Post-Appointment Automation State
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [autoReviewRequest, setAutoReviewRequest] = useState(true);
  const [reviewRequestDelayMinutes, setReviewRequestDelayMinutes] = useState(60);
  const [reviewRequestTemplate, setReviewRequestTemplate] = useState('');

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
            setGoogleMapsUrl(clinic.googleMapsUrl || '');
            setLatitude(clinic.latitude ?? null);
            setLongitude(clinic.longitude ?? null);
            setGoogleReviewLink(clinic.googleReviewLink || '');
            setAutoReviewRequest(clinic.autoReviewRequest ?? true);
            setReviewRequestDelayMinutes(clinic.reviewRequestDelayMinutes ?? 60);
            setReviewRequestTemplate(clinic.reviewRequestTemplate || '');
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
            googleMapsUrl,
            latitude,
            longitude,
            googleReviewLink,
            autoReviewRequest,
            reviewRequestDelayMinutes,
            reviewRequestTemplate,
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
        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#E87A38' }}>✦</div>
        <div style={{ color: '#9E9B93', fontSize: '0.9rem', fontWeight: 500 }}>Loading clinic configuration...</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 500, fontFamily: 'var(--font-display)', color: '#F3F0E8', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
            Clinic Configuration
          </h1>
          <p style={{ color: '#9E9B93', fontSize: '0.875rem' }}>
            Manage practice identity, AI receptionist tone, service catalog fees, and booking guardrails.
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

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid rgba(243, 240, 232, 0.08)',
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
                border: `1px solid ${isActive ? 'rgba(232, 75, 44, 0.35)' : 'transparent'}`,
                background: isActive ? 'rgba(232, 75, 44, 0.12)' : 'transparent',
                color: isActive ? '#E87A38' : '#9E9B93',
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
        <>
          <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.35rem' }}>Clinic Essentials</h2>
          <p style={{ color: '#9E9B93', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Basic clinic contact information used when addressing patients and sending booking confirmations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Clinic Specialty Selector */}
            <div style={{
              background: '#1C1916',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(243, 240, 232, 0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ fontWeight: 600, margin: 0, color: '#F3F0E8' }}>
                  <span>🩺</span> Clinic Specialty / Healthcare Type
                </label>
                <span style={{ fontSize: '0.8rem', color: '#E87A38', fontWeight: 600 }}>
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
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {CLINIC_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.78rem', color: '#9E9B93', marginTop: '0.45rem' }}>
                ✦ {currentConfig.specialtyDescription}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="label"><span>🏥</span> Clinic Name</label>
                <input className="input" value={clinicName} onChange={e => setClinicName(e.target.value)} />
                <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>Official practice name displayed to patients</span>
              </div>
              <div>
                <label className="label"><span>📞</span> Contact Phone</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>Direct line for emergencies & manual staff transfers</span>
              </div>
            </div>

            {/* Google Maps Exact Location Auto-Detector */}
            <div>
              <GoogleMapsLocationPicker
                address={address}
                city={city}
                googleMapsUrl={googleMapsUrl}
                latitude={latitude}
                longitude={longitude}
                onLocationSelected={loc => {
                  setAddress(loc.address);
                  setCity(loc.city);
                  setGoogleMapsUrl(loc.googleMapsUrl);
                  setLatitude(loc.latitude ?? null);
                  setLongitude(loc.longitude ?? null);
                }}
              />
            </div>

            <div>
              <label className="label"><span>📍</span> Address</label>
              <input className="input" value={address} onChange={e => setAddress(e.target.value)} />
              <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>Physical clinic address provided upon appointment booking (auto-filled from Google Maps)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="label"><span>🏙️</span> City / Area</label>
                <input className="input" value={city} onChange={e => setCity(e.target.value)} />
                <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>Detected locality for patient travel estimation</span>
              </div>
              <div>
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

        {/* Section: Google Reviews & Post-Appointment Automation */}
        <div className="card" style={{ marginTop: '1.5rem', border: '1px solid rgba(232, 122, 56, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F3F0E8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⭐</span> Google Reviews & Post-Appointment Automation
              </h2>
              <p style={{ color: '#9E9B93', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Automatically invite patients to rate your clinic on Google Maps after their scheduled appointment ends.
              </p>
            </div>
            {googleReviewLink && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#63C7A2',
                background: 'rgba(99, 199, 162, 0.12)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(99, 199, 162, 0.25)',
              }}>
                ✓ Review Automation Active
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
            {/* Google Business Review Link */}
            <div>
              <label className="label" style={{ fontWeight: 600, color: '#F3F0E8' }}>
                <span>🔗</span> Google Business / Review Link <span style={{ color: '#E87A38' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: '260px' }}
                  value={googleReviewLink}
                  onChange={e => setGoogleReviewLink(e.target.value)}
                  placeholder="e.g. https://g.page/r/.../review or https://search.google.com/local/writereview?placeid=..."
                />
                {googleReviewLink && (
                  <a
                    href={googleReviewLink.startsWith('http') ? googleReviewLink : `https://${googleReviewLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      background: 'rgba(232, 122, 56, 0.15)',
                      border: '1px solid rgba(232, 122, 56, 0.35)',
                      color: '#E87A38',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      textDecoration: 'none',
                    }}
                  >
                    Test Link ↗
                  </a>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9E9B93', marginTop: '0.35rem', lineHeight: 1.4 }}>
                ✦ <strong>How to find this:</strong> Open your <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#E87A38' }}>Google Business Profile</a> → Click <strong>&quot;Ask for reviews&quot;</strong> → Copy your direct review link and paste it here.
              </div>
            </div>

            {/* Toggle & Delay Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{
                background: '#1C1916',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid rgba(243, 240, 232, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <input
                  type="checkbox"
                  id="autoReviewToggle"
                  checked={autoReviewRequest}
                  onChange={e => setAutoReviewRequest(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#E87A38', cursor: 'pointer' }}
                />
                <label htmlFor="autoReviewToggle" style={{ cursor: 'pointer', margin: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F3F0E8' }}>
                    Auto-Send WhatsApp Review Request
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9E9B93' }}>
                    Triggered after patient visit ends or when marked completed
                  </div>
                </label>
              </div>

              <div>
                <label className="label"><span>⏱️</span> Send Review Request</label>
                <select
                  className="input"
                  value={reviewRequestDelayMinutes}
                  onChange={e => setReviewRequestDelayMinutes(Number(e.target.value))}
                  disabled={!autoReviewRequest}
                >
                  <option value={15}>15 minutes after appointment</option>
                  <option value={30}>30 minutes after appointment</option>
                  <option value={60}>1 hour after appointment (Recommended)</option>
                  <option value={120}>2 hours after appointment</option>
                  <option value={1440}>Next morning (24 hours later)</option>
                </select>
                <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>
                  Gives the patient time to finish consultation and head home before reviewing
                </span>
              </div>
            </div>

            {/* WhatsApp Message Template & Live Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* Template Editor */}
              <div>
                <label className="label"><span>📝</span> Review Request WhatsApp Message</label>
                <textarea
                  className="input"
                  rows={6}
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: 1.4 }}
                  value={reviewRequestTemplate}
                  onChange={e => setReviewRequestTemplate(e.target.value)}
                  placeholder={DEFAULT_REVIEW_TEMPLATE}
                />
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#9E9B93' }}>Available tags:</span>
                  {['{patient_name}', '{clinic_name}', '{service_name}', '{review_link}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setReviewRequestTemplate(prev => (prev ? `${prev} ${tag}` : `${DEFAULT_REVIEW_TEMPLATE} ${tag}`))}
                      style={{
                        fontSize: '0.7rem',
                        background: 'rgba(243, 240, 232, 0.06)',
                        border: '1px solid rgba(243, 240, 232, 0.1)',
                        color: '#E87A38',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Realistic Live WhatsApp Bubble Preview */}
              <div>
                <label className="label"><span>📱</span> Patient WhatsApp Preview</label>
                <div style={{
                  background: '#0B141A',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(243, 240, 232, 0.08)',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    background: '#005C4B',
                    color: '#E9EDEF',
                    borderRadius: '8px 8px 0 8px',
                    padding: '0.75rem 0.85rem',
                    fontSize: '0.825rem',
                    lineHeight: 1.45,
                    whiteSpace: 'pre-line',
                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                    maxWidth: '92%',
                    alignSelf: 'flex-end',
                  }}>
                    {formatReviewMessage(reviewRequestTemplate, {
                      patientName: 'Priya',
                      clinicName: clinicName || 'Your Clinic',
                      reviewLink: googleReviewLink || 'https://g.page/r/your-clinic/review',
                      serviceName: 'Dental Checkup',
                    })}
                    <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'rgba(233, 237, 239, 0.6)', marginTop: '4px' }}>
                      Just now ✓✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Tab 2: AI Agent Persona */}
      {activeTab === 'agent' && (
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.35rem' }}>AI Receptionist Persona</h2>
          <p style={{ color: '#9E9B93', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Customize how your virtual receptionist introduces itself and converses with patients on WhatsApp.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ maxWidth: 400 }}>
              <label className="label"><span>🤖</span> Assistant Name</label>
              <input className="input" value={assistantName} onChange={e => setAssistantName(e.target.value)} />
              <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>Virtual receptionist name displayed in conversations</span>
            </div>

            <div>
              <label className="label"><span>🎭</span> Conversational Tone</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {[
                  { id: 'friendly', title: '🌸 Warm & Empathetic', desc: 'Gentle, polite & patient' },
                  { id: 'professional', title: '👔 Professional', desc: 'Formal, clinical precision' },
                  { id: 'concise', title: '⚡ Fast & Concise', desc: 'Direct, speedy slot quotes' },
                ].map(t => {
                  const isSelected = tone === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTone(t.id as any)}
                      style={{
                        padding: '1.15rem',
                        borderRadius: '12px',
                        border: `1.5px solid ${isSelected ? '#E84B2C' : 'rgba(243, 240, 232, 0.08)'}`,
                        background: isSelected ? 'rgba(232, 75, 44, 0.12)' : '#1C1916',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#E87A38' : '#F3F0E8', marginBottom: '0.25rem' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#9E9B93' }}>
                        {t.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label"><span>💬</span> Welcome Greeting Message</label>
              <textarea
                className="input"
                rows={3}
                value={greeting}
                onChange={e => setGreeting(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: '#9E9B93', marginTop: '0.25rem', display: 'block' }}>Sent automatically whenever a new patient sends an initial greeting</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Services & Pricing */}
      {activeTab === 'services' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.35rem' }}>Services & Pricing</h2>
              <p style={{ color: '#9E9B93', fontSize: '0.85rem' }}>
                All prices and durations below are <strong style={{ color: '#F3F0E8' }}>directly editable inline</strong>. AI receptionist quotes these fees in WhatsApp chats.
              </p>
            </div>
            <span className="badge badge-success">
              ✏️ Click any price to edit
            </span>
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9E9B93', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                  <span style={{ color: '#63C7A2', fontWeight: 600 }}>₹{p.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Service Bar */}
          <div style={{
            background: '#1C1916',
            borderRadius: '12px',
            border: '1px solid rgba(243, 240, 232, 0.08)',
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
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '12px',
            overflowX: 'auto',
            background: 'var(--color-surface-elevated)',
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
                          color: '#E84B2C',
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

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9E9B93' }}>
            <span>{services.length} services configured</span>
            <span>Remember to click &ldquo;Save Changes&rdquo; at the top right to apply updates</span>
          </div>
        </div>
      )}

      {/* Tab 4: Working Hours & Booking Days */}
      {activeTab === 'hours' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.35rem' }}>
                Weekly Working Hours & Booking Days
              </h2>
              <p style={{ color: '#9E9B93', fontSize: '0.85rem' }}>
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
                    background: dayConfig.isOpen ? '#1C1916' : '#141311',
                    border: `1px solid ${dayConfig.isOpen ? 'rgba(243, 240, 232, 0.08)' : 'rgba(243, 240, 232, 0.04)'}`,
                    borderRadius: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Left: Day Name & Toggle Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '220px' }}>
                    <div style={{ width: '100px', fontWeight: 600, fontSize: '0.9rem', color: dayConfig.isOpen ? '#F3F0E8' : '#9E9B93' }}>
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
                        background: dayConfig.isOpen ? '#63C7A2' : 'rgba(243, 240, 232, 0.15)',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#F3F0E8',
                          position: 'absolute',
                          top: '3px',
                          left: dayConfig.isOpen ? '21px' : '3px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: dayConfig.isOpen ? '#63C7A2' : '#9E9B93',
                      }}>
                        {dayConfig.isOpen ? 'Open for Bookings' : 'Closed'}
                      </span>
                    </label>
                  </div>

                  {/* Right: Time Controls or Closed Notice */}
                  {dayConfig.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#9E9B93', fontWeight: 500 }}>Opens:</span>
                        <input
                          type="time"
                          value={dayConfig.openTime}
                          onChange={(e) => handleTimeChange(d.dayOfWeek, 'openTime', e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--color-surface-secondary)',
                            border: '1px solid var(--color-border-standard)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      </div>

                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>to</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Closes:</span>
                        <input
                          type="time"
                          value={dayConfig.closeTime}
                          onChange={(e) => handleTimeChange(d.dayOfWeek, 'closeTime', e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--color-surface-secondary)',
                            border: '1px solid var(--color-border-standard)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      </div>

                      {/* Formatted Badge */}
                      <span style={{
                        fontSize: '0.75rem',
                        background: 'var(--color-surface-raised)',
                        color: 'var(--color-text-secondary)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        border: '1px solid var(--color-border-subtle)',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatTime12h(dayConfig.openTime)} – {formatTime12h(dayConfig.closeTime)} ({durationLabel})
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                      padding: '0.35rem 0.75rem',
                      background: 'var(--color-surface-secondary)',
                      borderRadius: '6px',
                      border: '1px dashed var(--color-border-standard)',
                    }}>
                      No bookings accepted • Clinic marked as closed
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#9E9B93' }}>
            <span>
              {workingHours.filter(h => h.isOpen).length} of 7 days open for patient appointments
            </span>
            <span>Remember to click &ldquo;Save Changes&rdquo; at the top right to apply updates</span>
          </div>
        </div>
      )}

      {/* Tab 5: Booking Policies */}
      {activeTab === 'policies' && (
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F3F0E8', marginBottom: '0.35rem' }}>Booking Guardrails & Policies</h2>
          <p style={{ color: '#9E9B93', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Configure automatic constraints governing appointment scheduling, cancellations, and operatory turnover.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card-elevated" style={{ padding: '1.25rem' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#9E9B93' }}>Prevents patients booking slots too close to current time</span>
            </div>

            <div className="card-elevated" style={{ padding: '1.25rem' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#9E9B93' }}>Furthest days in advance a patient is allowed to book</span>
            </div>

            <div className="card-elevated" style={{ padding: '1.25rem' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#9E9B93' }}>Notice required before patient can cancel/reschedule</span>
            </div>

            <div className="card-elevated" style={{ padding: '1.25rem' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#9E9B93' }}>Operatory sterilization and room turnaround gap</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
