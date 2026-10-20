'use client';

// src/app/dashboard/appointments/page.tsx
// Clinic Appointment Management page with filters, manual booking modal, and status updates

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

  // Update status (e.g. mark complete or cancel)
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
      // First get or pick service
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

  // Metrics calculation
  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            📅 Dental Appointments & Schedule
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem', marginTop: '0.25rem' }}>
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

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Scheduled', value: total, icon: '📋', color: 'hsl(221 83% 58%)' },
          { label: 'Confirmed / Upcoming', value: confirmed, icon: '⏰', color: 'hsl(142 71% 45%)' },
          { label: 'Completed Care', value: completed, icon: '✓', color: 'hsl(265 83% 65%)' },
          { label: 'Cancelled / Rescheduled', value: cancelled, icon: '✕', color: 'hsl(0 84% 60%)' },
        ].map((m, i) => (
          <div key={i} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: `${m.color}20`,
              color: m.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 800,
              flexShrink: 0,
            }}>
              {m.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', flexWrap: 'wrap', paddingBottom: '0.25rem' }}>
        {['all', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: `1px solid ${statusFilter === f ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
              background: statusFilter === f ? 'hsl(var(--color-primary) / 0.15)' : 'hsl(var(--color-surface))',
              color: statusFilter === f ? 'hsl(var(--color-primary))' : 'hsl(var(--color-text-muted))',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Appointments Data Table */}
      <div className="card table-responsive" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Service</th>
              <th>Scheduled Time</th>
              <th>Status</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--color-text-muted))' }}>
                  Loading appointments...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'hsl(var(--color-text-muted))' }}>
                  No appointments found for the selected filter.
                </td>
              </tr>
            ) : (
              appointments.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{appt.patient_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>{appt.patient_phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{appt.services?.name ?? 'General Dental Care'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(142 71% 45%)' }}>{appt.services?.price_display ?? '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(appt.starts_at).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      {new Date(appt.starts_at).toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${appt.status === 'confirmed' ? 'success' : appt.status === 'completed' ? 'info' : 'error'}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      {appt.source === 'whatsapp' ? '🤖 WhatsApp AI' : '👤 Front Desk'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {appt.status === 'confirmed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'hsl(142 71% 45%)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
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
                              color: 'hsl(0 84% 60%)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {appt.status !== 'confirmed' && (
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>—</span>
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
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 'clamp(1rem, 3vw, 1.75rem)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>New Manual Walk-In Appointment</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
