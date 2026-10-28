'use client';

import React, { useState } from 'react';

export function ContactFormClient() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    clinicName: '',
    phone: '',
    enquiryType: 'general',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorText = json?.error?.message || json?.error || 'Failed to submit form. Please try again.';
        setErrorMessage(typeof errorText === 'string' ? errorText : JSON.stringify(errorText));
        setLoading(false);
        return;
      }

      setSubmittedTicket({
        id: json.data.ticketId,
        message: json.data.message,
      });
      setLoading(false);
    } catch (err) {
      console.error('Contact form submission error:', err);
      setErrorMessage('Network connection error. Please email us directly at support@arenova.in');
      setLoading(false);
    }
  };

  if (submittedTicket) {
    return (
      <div
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '18px',
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-standard)',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(99, 199, 162, 0.15)',
            border: '1px solid rgba(99, 199, 162, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 1.25rem auto',
            color: 'var(--color-success)',
          }}
        >
          ✓
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Message Received!
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            maxWidth: '520px',
            margin: '0 auto 1.5rem auto',
          }}
        >
          {submittedTicket.message}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            background: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-amber)',
            marginBottom: '1.75rem',
          }}
        >
          Reference Ticket: <strong>{submittedTicket.id}</strong>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setSubmittedTicket(null);
              setFormData({
                fullName: '',
                email: '',
                clinicName: '',
                phone: '',
                enquiryType: 'general',
                message: '',
              });
            }}
            className="btn btn-secondary btn-sm"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '2rem clamp(1.25rem, 3vw, 2.25rem)',
        borderRadius: '18px',
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border-standard)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '1rem', marginBottom: '0.25rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.25rem',
          }}
        >
          Send Arenova a Message
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Reach out for clinic software enquiries, subscription assistance, or technical support.
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: 'rgba(232, 75, 44, 0.12)',
            border: '1px solid rgba(232, 75, 44, 0.35)',
            fontSize: '0.8rem',
            color: 'var(--color-flame)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Name and Email Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div>
          <label
            htmlFor="fullName"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.35rem',
            }}
          >
            Full Name <span style={{ color: 'var(--color-flame)' }}>*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            placeholder="Dr. Arjun Mehta"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-standard)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.35rem',
            }}
          >
            Email Address <span style={{ color: 'var(--color-flame)' }}>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="doctor@clinic.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-standard)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Clinic Name and Phone Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div>
          <label
            htmlFor="clinicName"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.35rem',
            }}
          >
            Clinic / Practice Name <span style={{ color: 'var(--color-flame)' }}>*</span>
          </label>
          <input
            id="clinicName"
            name="clinicName"
            type="text"
            required
            placeholder="Apex Dental Clinic"
            value={formData.clinicName}
            onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-standard)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.35rem',
            }}
          >
            Phone / WhatsApp Number <span style={{ color: 'var(--color-text-muted)' }}>(Optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-standard)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Enquiry Type */}
      <div>
        <label
          htmlFor="enquiryType"
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.35rem',
          }}
        >
          Enquiry Purpose
        </label>
        <select
          id="enquiryType"
          name="enquiryType"
          value={formData.enquiryType}
          onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            background: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-standard)',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        >
          <option value="general">General Software Enquiry</option>
          <option value="demo">Request a Personalized Clinic WhatsApp Demo</option>
          <option value="billing">Subscription &amp; Billing Assistance</option>
          <option value="support">Technical Support for Subscribed Clinic</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.35rem',
          }}
        >
          Your Message <span style={{ color: 'var(--color-flame)' }}>*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder="Tell us about your clinic, estimated patient inquiries, or any questions about our AI receptionist..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            background: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-border-standard)',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '0.85rem',
          fontSize: '0.925rem',
          fontWeight: 600,
          justifyContent: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Submitting Enquiry...' : 'Submit Message →'}
      </button>

      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
        🔒 Your clinic information is protected under our Privacy Policy. We reply within 24 business hours.
      </p>
    </form>
  );
}
