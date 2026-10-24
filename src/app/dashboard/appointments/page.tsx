'use client';

// src/app/dashboard/appointments/page.tsx
// Claude-inspired Clinic Appointment Management with warm typography, calm status indicators, and clean data tables

import React, { useState, useEffect } from 'react';

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  source: string;
  notes?: string;
  services?: {
    name: string;
    duration_minutes: number;
    price_display: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  // New Appointment Form state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/v1/appointments' 
        : `/api/v1/appointments?status=${statusFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data?.appointments) {
        setAppointments(json.data.appointments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await fetch('/api/v1/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status: newStatus }),
      });
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientPhone || !newStartsAt) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: newPatientName,
          patientPhone: newPatientPhone,
          startsAt: new Date(newStartsAt).toISOString(),
          notes: newNotes,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewPatientName('');
        setNewPatientPhone('');
        setNewStartsAt('');
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Header (Claude Warm Serif) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 500,
            fontFamily: 'var(--font-serif)',
            color: '#262522',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Appointments & Schedule
          </h1>
          <p style={{ color: '#706C65', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            All patient appointments synced from WhatsApp AI bookings and Google Calendar.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ whiteSpace: 'nowrap' }}
        >
          + Manual Booking
        </button>
      </div>

      {/* Metrics Row (Full width) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
        width: '100%',
      }}>
        {[
          { label: 'Total Scheduled', value: total, icon: '📋' },
          { label: 'Confirmed / Upcoming', value: confirmed, icon: '⏰' },
          { label: 'Completed Care', value: completed, icon: '✓' },
          { label: 'Cancelled / Rescheduled', value: cancelled, icon: '✕' },
        ].map((m, i) => (
          <div key={i} className="stat-card" style={{ padding: '1.15rem 1.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#706C65', fontWeight: 500 }}>{m.label}</span>
              <span style={{
                width: 28,
                height: 28,
                borderRadius: '6px',
                background: '#F4F1EB',
                border: '1px solid #E7E2DA',
                color: '#262522',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}>
                {m.icon}
              </span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#262522', marginTop: '0.2rem' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', flexWrap: 'wrap', paddingBottom: '0.25rem' }}>
        {['all', 'confirmed', 'completed', 'cancelled'].map(f => {
          const isActive = statusFilter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: `1px solid ${isActive ? '#F0D5C7' : '#E7E2DA'}`,
                background: isActive ? '#F8E8DE' : '#FFFFFF',
                color: isActive ? '#C86646' : '#706C65',
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Appointments Data Table */}
      <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Service</th>
              <th>Scheduled Time</th>
              <th>Status</th>
              <th>Source</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#706C65' }}>
                  Loading appointments...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#706C65' }}>
                  No appointments found for the selected filter.
                </td>
              </tr>
            ) : (
              appointments.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#262522' }}>{appt.patient_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#706C65' }}>{appt.patient_phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#262522' }}>{appt.services?.name ?? 'General Dental Care'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#487B57' }}>{appt.services?.price_display ?? '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#262522' }}>
                      {new Date(appt.starts_at).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#706C65' }}>
                      {new Date(appt.starts_at).toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      appt.status === 'confirmed' ? 'badge-success' : appt.status === 'completed' ? 'badge-info' : 'badge-error'
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: '#706C65' }}>
                      {appt.source === 'whatsapp' ? '🤖 WhatsApp AI' : '👤 Front Desk'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                      {appt.status === 'confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#487B57',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 4px',
                            }}
                          >
                            ✓ Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#C44E45',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 4px',
                            }}
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {appt.status !== 'confirmed' && (
                        <span style={{ fontSize: '0.75rem', color: '#97938A' }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Booking Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(38, 37, 34, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#262522', margin: 0 }}>
                New Walk-In Appointment
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#706C65', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Patient Name</label>
                <input
                  className="input"
                  required
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div>
                <label className="label">Patient WhatsApp / Phone</label>
                <input
                  className="input"
                  required
                  value={newPatientPhone}
                  onChange={e => setNewPatientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="label">Appointment Date & Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  required
                  value={newStartsAt}
                  onChange={e => setNewStartsAt(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Internal Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Optional clinic notes..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Booking...' : 'Book & Sync Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
