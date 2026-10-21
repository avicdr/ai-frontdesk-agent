'use client';

// src/app/onboarding/page.tsx
// 8-step onboarding wizard for dental clinic owners to activate their AI front desk

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CLINIC_TYPES, ClinicTypeId, getClinicTypeConfig } from '@/lib/constants/clinic-types';

interface ClinicServiceItem {
  name: string;
  duration: number;
  price: string;
  isBookable: boolean;
}

const DEFAULT_SERVICES: ClinicServiceItem[] = getClinicTypeConfig('dental_clinic').defaultServices.map(s => ({
  name: s.name,
  duration: s.duration,
  price: s.price,
  isBookable: s.isBookable !== false,
}));

import {
  PRICING_PLANS,
  CRYPTO_NETWORKS,
  PLATFORM_UPI_VPA,
  isInternationalClient,
  CryptoNetworkOption,
} from '@/lib/constants/billing';

const POPULAR_DENTAL_PRESETS = [
  { name: 'Invisible Aligners Consultation', duration: 30, price: '1500' },
  { name: 'Dental Implant Consultation', duration: 45, price: '2000' },
  { name: 'Composite Dental Veneers', duration: 60, price: '4000' },
  { name: 'Wisdom Tooth Surgical Extraction', duration: 45, price: '3500' },
  { name: 'Zirconia Ceramic Crown', duration: 45, price: '7500' },
  { name: 'Pediatric Fluoride Treatment', duration: 30, price: '1200' },
];

const GREETING_TEMPLATES = [
  {
    label: '🌸 Warm & Welcoming',
    text: "Hello! Welcome to Apex Dental & Orthodontics. I'm Aria, your AI receptionist. How can I assist you with your dental care today?",
  },
  {
    label: '⚡ Swift Booking Focus',
    text: "Hi there! Welcome to Apex Dental. I can help you check real-time open slots, schedule an appointment, or quote service fees. Which treatment are you looking for?",
  },
  {
    label: '🚨 Emergency Friendly',
    text: "Hello! You have reached Apex Dental & Orthodontics. If you are experiencing severe toothache or urgent pain, let me know right away so I can prioritize an emergency slot.",
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Clinic Info & Specialty
  const [businessType, setBusinessType] = useState<ClinicTypeId>('dental_clinic');
  const currentClinicConfig = getClinicTypeConfig(businessType);

  const [clinicName, setClinicName] = useState('Apex Dental & Orthodontics');
  const [ownerName, setOwnerName] = useState('Dr. Sarah Verma');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('42 Park Avenue, Koramangala');
  const [city, setCity] = useState('Bengaluru');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Step 2: AI Receptionist Persona
  const [assistantName, setAssistantName] = useState('Aria');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'concise'>('friendly');
  const [greeting, setGreeting] = useState(
    "Hello! Welcome to Apex Dental & Orthodontics. I'm Aria, your AI receptionist. How can I assist you with your dental care today?"
  );

  // Step 3: Services & Fees
  const [services, setServices] = useState<ClinicServiceItem[]>(DEFAULT_SERVICES);
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

  // Step 6: WhatsApp Baileys Integration
  const [waMode, setWaMode] = useState<'qr' | 'pairing_code'>('qr');
  const [waStatus, setWaStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [waPhoneInput, setWaPhoneInput] = useState('');
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [isLoadingWA, setIsLoadingWA] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  // Step 7: Calendar
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarName, setCalendarName] = useState<string | null>(null);
  const [isLiveGoogleConfigured, setIsLiveGoogleConfigured] = useState(false);

  // Step 8: Plan & Payment (UPI for India, Crypto for International)
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'growth'>('pro');
  const [isInternational, setIsInternational] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState<CryptoNetworkOption>(CRYPTO_NETWORKS[0]);
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState(false);
  const [copiedCryptoAmount, setCopiedCryptoAmount] = useState(false);

  // Auto-detect international based on timezone selection
  useEffect(() => {
    if (timezone) {
      const isIntl = isInternationalClient(null, timezone);
      setIsInternational(isIntl);
    }
  }, [timezone]);

  // Initial load: Fetch existing onboarding state & calendar status & geo detection
  useEffect(() => {
    // Geo IP country check
    fetch('/api/v1/geo')
      .then(r => r.json())
      .then(geo => {
        if (geo?.data?.isInternational) {
          setIsInternational(true);
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPlan = params.get('plan');
      if (urlPlan && ['starter', 'pro', 'growth'].includes(urlPlan)) {
        setSelectedPlan(urlPlan as any);
      }
      if (params.get('calendar_connected') === 'true') {
        setCalendarConnected(true);
      }
      const stepParam = params.get('step');
      if (stepParam) {
        const parsed = parseInt(stepParam, 10);
        if (parsed >= 1 && parsed <= 8) setCurrentStep(parsed);
      }
    }

    // Fetch calendar integration status
    fetch('/api/v1/integrations/calendar')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCalendarConnected(json.data.status === 'connected');
          setCalendarEmail(json.data.email);
          setCalendarName(json.data.calendarName);
          setIsLiveGoogleConfigured(json.data.isLiveConfigured);
        }
      })
      .catch(() => {});

    // Fetch onboarding progress
    fetch('/api/v1/onboarding')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const { clinicProfile, agentConfig, services: loadedServices, currentStep: dbStep, userMeta } = json.data;
          if (userMeta) {
            if (userMeta.organizationName) setClinicName(userMeta.organizationName);
            if (userMeta.fullName) setOwnerName(userMeta.fullName);
            if (userMeta.phone) setPhone(userMeta.phone);
          }
          if (clinicProfile) {
            if (clinicProfile.clinic_name) setClinicName(clinicProfile.clinic_name);
            if (clinicProfile.business_type) {
              setBusinessType(clinicProfile.business_type as ClinicTypeId);
            }
            if (clinicProfile.phone) setPhone(clinicProfile.phone);
            if (clinicProfile.address_line1) setAddress(clinicProfile.address_line1);
            if (clinicProfile.city) setCity(clinicProfile.city);
            if (clinicProfile.timezone) setTimezone(clinicProfile.timezone);
          }
          if (agentConfig) {
            if (agentConfig.assistant_name) setAssistantName(agentConfig.assistant_name);
            if (agentConfig.tone) setTone(agentConfig.tone);
            if (agentConfig.greeting_message) setGreeting(agentConfig.greeting_message);
          }
          if (Array.isArray(loadedServices) && loadedServices.length > 0) {
            setServices(loadedServices.map((s: any) => ({
              name: s.name,
              duration: s.duration_minutes ?? 30,
              price: s.price_display ? String(s.price_display).replace(/[^0-9.]/g, '') : (s.price_min ? String(s.price_min) : '0'),
              isBookable: s.is_bookable !== false && s.is_active !== false,
            })));
          }
          if (dbStep && dbStep > 1 && dbStep <= 8) {
            setCurrentStep(dbStep);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectClinicType = (typeId: ClinicTypeId) => {
    setBusinessType(typeId);
    const config = getClinicTypeConfig(typeId);

    // If clinic name is blank or matches a default clinic name from presets, auto-update it
    const isDefaultName = CLINIC_TYPES.some(c => c.defaultClinicName === clinicName) || !clinicName;
    if (isDefaultName) {
      setClinicName(config.defaultClinicName);
    }

    // Auto-update greeting message to match the selected clinic specialty
    setGreeting(config.defaultGreeting);

    // Auto-update services with realistic procedure presets for the specialty
    setServices(config.defaultServices.map(s => ({
      name: s.name,
      duration: s.duration,
      price: s.price,
      isBookable: s.isBookable !== false,
    })));
  };

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
    setNewServiceDuration('30');
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, idx) => idx !== index));
  };

  const handleUpdateServicePrice = (index: number, newPrice: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], price: newPrice };
    setServices(updated);
  };

  const handleUpdateServiceDuration = (index: number, newDuration: number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], duration: newDuration };
    setServices(updated);
  };

  const handleUpdateServiceName = (index: number, newName: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], name: newName };
    setServices(updated);
  };

  const handleToggleServiceBookable = (index: number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], isBookable: !updated[index].isBookable };
    setServices(updated);
  };

  const handleAddPreset = (preset: { name: string; duration: number; price: string }) => {
    if (services.some(s => s.name.toLowerCase() === preset.name.toLowerCase())) return;
    setServices([...services, { ...preset, isBookable: true }]);
  };

  const handleCopyMondayHours = () => {
    const monday = workingHours[1];
    if (!monday) return;
    setWorkingHours(
      workingHours.map(wh => {
        if (wh.dayOfWeek >= 1 && wh.dayOfWeek <= 5) {
          return { ...wh, isOpen: monday.isOpen, openTime: monday.openTime, closeTime: monday.closeTime };
        }
        return wh;
      })
    );
  };

  const handleStartOnboardingQR = async () => {
    setIsLoadingWA(true);
    setWaError(null);
    setQrCode(null);
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'qr' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setWaStatus(json.data.status);
        if (json.data.qrCode) setQrCode(json.data.qrCode);
        pollOnboardingStatus();
      } else {
        setWaError(json.error?.message || 'Could not initiate QR code.');
      }
    } catch {
      setWaError('Network error starting WhatsApp session.');
    } finally {
      setIsLoadingWA(false);
    }
  };

  const handleRequestOnboardingPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waPhoneInput.trim()) {
      setWaError('Please enter a valid phone number with country code.');
      return;
    }
    setIsLoadingWA(true);
    setWaError(null);
    setPairingCode(null);
    try {
      const res = await fetch('/api/v1/integrations/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pairing_code', phoneNumber: waPhoneInput }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setWaStatus(json.data.status);
        if (json.data.pairingCode) setPairingCode(json.data.pairingCode);
        pollOnboardingStatus();
      } else {
        setWaError(json.error?.message || 'Could not generate pairing code.');
      }
    } catch {
      setWaError('Network error requesting pairing code.');
    } finally {
      setIsLoadingWA(false);
    }
  };

  const handleResetOnboardingPairing = async () => {
    setIsLoadingWA(true);
    try {
      await fetch('/api/v1/integrations/whatsapp/session', { method: 'DELETE' });
    } catch {}
    setQrCode(null);
    setPairingCode(null);
    setWaStatus('disconnected');
    setWaError(null);
    setIsLoadingWA(false);
  };

  const pollOnboardingStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/integrations/whatsapp/session');
        const json = await res.json();
        if (json.success && json.data) {
          const { status, qrCode: qr, pairingCode: pc, phoneNumber: pn } = json.data;
          setWaStatus(status);
          if (status === 'connected') {
            setConnectedNumber(pn ? `+${pn}` : null);
            setQrCode(null);
            setPairingCode(null);
            clearInterval(interval);
          } else if (status === 'connecting') {
            if (qr) setQrCode(qr);
            if (pc) setPairingCode(pc);
          }
        }
      } catch {
        // ignore
      }
    }, 2500);
  };

  const handleCopyVpa = () => {
    navigator.clipboard?.writeText(PLATFORM_UPI_VPA);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  // Next step handler
  const handleNext = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (currentStep === 1) {
        await fetch('/api/v1/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: ownerName || 'Dr. Sarah Verma',
            phone: phone || '+91 98765 43210',
            organizationName: clinicName || currentClinicConfig.defaultClinicName,
            businessType,
            timezone: timezone || 'Asia/Kolkata',
          }),
        });
      }

      await fetch('/api/v1/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep + 1,
          clinicInfo: { clinicName, businessType, phone, address, city, timezone },
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

  const handleCompleteActivation = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // 1. Ensure org and membership exist
      await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: ownerName || 'Dr. Sarah Verma',
          phone: phone || '+91 98765 43210',
          organizationName: clinicName || currentClinicConfig.defaultClinicName,
          businessType,
          timezone: timezone || 'Asia/Kolkata',
        }),
      });

      // 2. Mark onboarding completed
      await fetch('/api/v1/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 8,
          complete: true,
          clinicInfo: { clinicName, businessType, phone, address, city, timezone },
          agentConfig: { assistantName, tone, greetingMessage: greeting },
          services,
          workingHours,
        }),
      });

      // 3. If payment proof was provided (UTR or Crypto TxID), create order and submit verification
      const reference = isInternational ? cryptoTxHash : utrNumber;
      let orderCreated = false;

      if (reference && reference.trim()) {
        try {
          const orderRes = await fetch('/api/v1/billing/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: selectedPlan,
              currency: isInternational ? 'USD' : 'INR',
              provider: isInternational ? 'crypto' : 'manual',
              cryptoNetwork: isInternational ? selectedCryptoNetwork.id : undefined,
            }),
          });
          const orderJson = await orderRes.json();
          if (orderJson.data?.orderId) {
            await fetch('/api/v1/billing/manual-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderJson.data.orderId,
                utrNumber: reference.trim(),
                cryptoNetwork: isInternational ? selectedCryptoNetwork.id : undefined,
              }),
            });
            orderCreated = true;
          }
        } catch (payErr) {
          console.error('Failed to submit onboarding payment reference:', payErr);
        }
      }

      const redirectUrl = isInternational
        ? `/dashboard?onboarding=complete&plan=${selectedPlan}${orderCreated ? '&payment_submitted=true' : '&require_crypto=true'}`
        : `/dashboard?activated=true${orderCreated ? '&payment_submitted=true' : ''}`;

      router.push(redirectUrl);
    } catch (err) {
      console.error(err);
      // Still navigate so user is never trapped
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--color-bg))', color: 'hsl(var(--color-text-primary))', padding: '2rem 1rem 4rem 1rem' }}>
      <div className="animated-bg" />

      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Top bar with quick Dashboard jump */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'hsl(var(--color-text-muted))', textDecoration: 'none', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            ← Home
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#93c5fd',
              background: 'hsla(221, 83%, 58%, 0.12)',
              border: '1px solid hsla(221, 83%, 58%, 0.3)',
              padding: '0.4rem 0.9rem',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏠 Go to Clinic Dashboard</span>
            <span>→</span>
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            background: 'hsl(221 83% 58% / 0.12)',
            border: '1px solid hsl(221 83% 58% / 0.35)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'hsl(221 83% 70%)',
            marginBottom: '1rem',
          }}>
            ✨ AI Front Desk Setup Wizard
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
            Set Up Your 24/7 Dental AI Receptionist
          </h1>
          <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.95rem', maxWidth: 540, margin: '0 auto' }}>
            Empower your practice with an automated WhatsApp receptionist that quotes treatments, checks calendar slots, and books appointments.
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
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}>
          {[
            { step: 1, label: 'Clinic Essentials' },
            { step: 2, label: 'AI Persona' },
            { step: 3, label: 'Services & Fees' },
            { step: 4, label: 'Working Hours' },
            { step: 5, label: 'Booking Rules' },
            { step: 6, label: 'WhatsApp' },
            { step: 7, label: 'Calendar' },
            { step: 8, label: 'Activate' },
          ].map(({ step, label }) => {
            const isDone = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isCurrent ? 1 : isDone ? 0.9 : 0.45 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isCurrent ? 'var(--gradient-brand)' : isDone ? 'hsl(142 71% 45%)' : 'hsl(var(--color-surface-2))',
                  border: isCurrent ? '2px solid hsl(var(--color-primary-glow))' : '1px solid hsl(var(--color-border))',
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 12px hsla(221, 83%, 58%, 0.4)' : 'none',
                }}>
                  {isDone ? '✓' : step}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, whiteSpace: 'nowrap', color: isCurrent ? '#f8fafc' : undefined }}>
                  {label}
                </span>
                {step < 8 && <div style={{ width: 14, height: 1, background: 'hsl(var(--color-border))' }} />}
              </div>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="card" style={{ padding: '2.25rem', border: '1px solid hsl(var(--color-border))', borderRadius: '20px', background: 'hsl(var(--color-surface))', boxShadow: '0 8px 32px rgba(0,0,0,0.36)' }}>
          {errorMsg && (
            <div style={{
              padding: '0.875rem 1.25rem',
              borderRadius: '12px',
              background: 'hsla(0, 84%, 60%, 0.12)',
              border: '1px solid hsla(0, 84%, 60%, 0.35)',
              color: 'hsl(0, 84%, 70%)',
              marginBottom: '1.75rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Clinic Profile */}
          {currentStep === 1 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Step 1: Clinic Essentials</h2>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                  Tell us about your clinic practice. The AI receptionist will use this info when answering patient inquiries and scheduling appointments.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Healthcare Specialty / Clinic Type Selector */}
                <div className="form-field" style={{
                  background: 'hsla(221, 83%, 58%, 0.08)',
                  padding: '1.25rem',
                  borderRadius: '14px',
                  border: '1px solid hsla(221, 83%, 58%, 0.25)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="label" style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>
                      <span>🏥</span> Clinic Type / Healthcare Specialty <span style={{ color: 'hsl(var(--color-error))' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>
                      {currentClinicConfig.icon} {currentClinicConfig.label}
                    </span>
                  </div>

                  <select
                    className="input"
                    value={businessType}
                    onChange={e => handleSelectClinicType(e.target.value as ClinicTypeId)}
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      background: 'hsl(var(--color-surface))',
                      color: 'hsl(var(--color-text-primary))',
                      border: '1px solid hsla(221, 83%, 58%, 0.4)',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                    }}
                  >
                    {CLINIC_TYPES.map(type => (
                      <option key={type.id} value={type.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.775rem', color: '#93c5fd' }}>
                    <span>✨</span>
                    <span>
                      <strong>{currentClinicConfig.label}:</strong> {currentClinicConfig.specialtyDescription}
                    </span>
                  </div>
                  <span className="form-hint" style={{ marginTop: '0.35rem' }}>
                    Switching specialty automatically adapts your catalog, procedure presets, and AI clinical responses.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div className="form-field">
                    <label className="label">
                      <span>🏷️</span> Clinic Name <span style={{ color: 'hsl(var(--color-error))' }}>*</span>
                    </label>
                    <input
                      className="input"
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      placeholder={`e.g. ${currentClinicConfig.defaultClinicName}`}
                    />
                    <span className="form-hint">Displayed to patients in WhatsApp greetings & notifications</span>
                  </div>

                  <div className="form-field">
                    <label className="label">
                      <span>👨‍⚕️</span> Doctor / Lead Clinician Full Name <span style={{ color: 'hsl(var(--color-error))' }}>*</span>
                    </label>
                    <input
                      className="input"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Verma, BDS, MDS"
                    />
                    <span className="form-hint">Principal dentist quoted when confirming doctor availability</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div className="form-field">
                    <label className="label">
                      <span>📞</span> Reception / Emergency Phone <span style={{ color: 'hsl(var(--color-error))' }}>*</span>
                    </label>
                    <input
                      className="input"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                    <span className="form-hint">Clinic line provided if patient asks to speak to staff</span>
                  </div>

                  <div className="form-field">
                    <label className="label">
                      <span>🏙️</span> City & Area <span style={{ color: 'hsl(var(--color-error))' }}>*</span>
                    </label>
                    <input
                      className="input"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru, Koramangala"
                    />
                    <span className="form-hint">Enables AI to confirm clinic location and landmark questions</span>
                  </div>
                </div>

                <div className="form-field">
                  <label className="label">
                    <span>📍</span> Full Clinic Address
                  </label>
                  <input
                    className="input"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 42 Park Avenue, 2nd Floor, Koramangala 4th Block"
                  />
                  <span className="form-hint">AI automatically sends this location to patients upon booking confirmation</span>
                </div>

                <div style={{ maxWidth: 360 }} className="form-field">
                  <label className="label">
                    <span>🌐</span> Local Timezone
                  </label>
                  <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST — UTC+5:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST — UTC+4:00)</option>
                    <option value="America/New_York">America/New_York (EST — UTC-5:00)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT — UTC+8:00)</option>
                  </select>
                  <span className="form-hint">Aligns calendar availability slots accurately with clinic clocks</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AI Persona */}
          {currentStep === 2 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Step 2: AI Receptionist Persona</h2>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                  Define your virtual assistant's identity, conversational style, and welcoming greeting.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.75rem', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-field">
                    <label className="label">
                      <span>🤖</span> Virtual Receptionist Name
                    </label>
                    <input
                      className="input"
                      value={assistantName}
                      onChange={e => setAssistantName(e.target.value)}
                      placeholder="e.g. Aria, Maya, Dr. Frontdesk"
                    />
                    <span className="form-hint">The AI introduces itself with this name on WhatsApp</span>
                  </div>

                  <div className="form-field">
                    <label className="label">
                      <span>🎭</span> Conversational Tone
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {[
                        { id: 'friendly', title: '🌸 Warm & Friendly', desc: 'Gentle, polite & empathetic — ideal for nervous dental patients' },
                        { id: 'professional', title: '👔 Professional & Formal', desc: 'Clinical precision, structured questions, respectful etiquette' },
                        { id: 'concise', title: '⚡ Fast & Concise', desc: 'Quick quotes, direct slot booking, minimal chit-chat' },
                      ].map(t => {
                        const isSelected = tone === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setTone(t.id as any)}
                            style={{
                              padding: '0.875rem 1rem',
                              borderRadius: '12px',
                              border: `1.5px solid ${isSelected ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                              background: isSelected ? 'hsla(221, 83%, 58%, 0.12)' : 'hsl(var(--color-surface-2))',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 0 16px hsla(221, 83%, 58%, 0.2)' : 'none',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#93c5fd' : '#f8fafc', marginBottom: '0.2rem' }}>
                                {t.title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                                {t.desc}
                              </div>
                            </div>
                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `2px solid ${isSelected ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))'}`,
                              background: isSelected ? 'hsl(var(--color-primary))' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="label">
                        <span>💬</span> Welcome Greeting Message
                      </label>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>Auto-sent when patient says "Hi"</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setGreeting(`Hello! Welcome to ${clinicName || currentClinicConfig.defaultClinicName}. I'm ${assistantName || 'Aria'}, your AI receptionist. How can I assist you with your ${currentClinicConfig.label.split('&')[0].trim().toLowerCase()} care today?`)}
                        className="preset-chip"
                        style={{ fontSize: '0.7rem' }}
                      >
                        🌸 Warm & Welcoming
                      </button>
                      <button
                        type="button"
                        onClick={() => setGreeting(`Hi there! Welcome to ${clinicName || currentClinicConfig.defaultClinicName}. I can help you check open slots, schedule an appointment, or quote procedure fees. How can I assist you today?`)}
                        className="preset-chip"
                        style={{ fontSize: '0.7rem' }}
                      >
                        ⚡ Swift Booking Focus
                      </button>
                      <button
                        type="button"
                        onClick={() => setGreeting(`Hello! You have reached ${clinicName || currentClinicConfig.defaultClinicName}. If you need an urgent consultation or immediate appointment, please let me know right away so I can assist.`)}
                        className="preset-chip"
                        style={{ fontSize: '0.7rem' }}
                      >
                        🚨 Urgent Friendly
                      </button>
                    </div>

                    <textarea
                      className="input"
                      rows={3}
                      value={greeting}
                      onChange={e => setGreeting(e.target.value)}
                      placeholder="Welcome message sent when a new patient messages..."
                    />
                  </div>
                </div>

                {/* WhatsApp Chat Preview Card */}
                <div style={{
                  background: '#0b141a',
                  borderRadius: '18px',
                  border: '1px solid #1f2c34',
                  overflow: 'hidden',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                }}>
                  {/* WhatsApp App Header */}
                  <div style={{
                    background: '#202c33',
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderBottom: '1px solid #2a3942',
                  }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00a884 0%, #008069 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                      {currentClinicConfig.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e9edef' }}>
                          {assistantName || 'Aria'} • {clinicName || 'Clinic'}
                        </span>
                        <span style={{ color: '#00a884', fontSize: '0.75rem' }} title="Verified WhatsApp Business">✓</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#8696a0' }}>
                        Verified {currentClinicConfig.label.split('&')[0].trim()} Receptionist • online
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages Canvas */}
                  <div style={{
                    padding: '1.25rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                    backgroundImage: 'radial-gradient(#1f2c34 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                    minHeight: '260px',
                    justifyContent: 'flex-end',
                  }}>
                    {/* Patient Message */}
                    <div style={{
                      alignSelf: 'flex-end',
                      background: '#005c4b',
                      color: '#e9edef',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px 8px 0 8px',
                      fontSize: '0.8125rem',
                      maxWidth: '80%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}>
                      Hi! Do you have any slots available for teeth cleaning this Saturday?
                      <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '0.2rem' }}>10:42 AM ✓✓</div>
                    </div>

                    {/* AI Receptionist Response */}
                    <div style={{
                      alignSelf: 'flex-start',
                      background: '#202c33',
                      color: '#e9edef',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px 8px 8px 0',
                      fontSize: '0.8125rem',
                      maxWidth: '92%',
                      lineHeight: 1.45,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ marginBottom: '0.4rem' }}>{greeting}</div>
                      <div style={{ color: '#00a884', fontWeight: 600, fontSize: '0.775rem' }}>
                        ✨ Saturday Slots Available: 10:30 AM, 02:00 PM, 04:30 PM. Would you like me to reserve one?
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '0.35rem' }}>10:42 AM</div>
                    </div>
                  </div>

                  <div style={{
                    background: '#111b21',
                    padding: '0.5rem',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    color: '#00a884',
                    borderTop: '1px solid #202c33',
                    fontWeight: 600,
                  }}>
                    ⚡ Live WhatsApp Patient Preview
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Services & Fees */}
          {currentStep === 3 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Step 3: {currentClinicConfig.label.split('&')[0].trim()} Services & Pricing
                  </h2>
                  <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                    Configure the treatments and consultations your AI receptionist quotes to patients. <strong style={{ color: '#4ade80' }}>Prices and durations are editable inline directly in the table!</strong>
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
                  whiteSpace: 'nowrap',
                }}>
                  ✏️ Click any price to edit
                </div>
              </div>

              {/* Popular Presets Bar */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-text-muted))', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  + Quick Add Popular {currentClinicConfig.label.split('&')[0].trim()} Procedures:
                </div>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {currentClinicConfig.popularPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="preset-chip"
                    >
                      <span>+</span>
                      <span>{preset.name}</span>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{preset.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Service Bar */}
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
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    placeholder="Procedure name (e.g. Invisible Aligners Consultation)"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
                  />
                </div>

                <div style={{ flex: '1 1 120px' }} className="input-addon-group">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newServiceDuration}
                    onChange={e => setNewServiceDuration(e.target.value)}
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
                    value={newServicePrice}
                    onChange={e => setNewServicePrice(e.target.value)}
                    placeholder="Fee"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddService}
                  className="btn btn-primary"
                  style={{ flex: '0 0 auto', padding: '0.75rem 1.25rem' }}
                >
                  <span>+ Add Service</span>
                </button>
              </div>

              {/* Interactive Services Table */}
              <div className="table-responsive" style={{
                border: '1px solid hsl(var(--color-border))',
                borderRadius: '14px',
                overflowX: 'auto',
                background: 'hsl(var(--color-surface))',
              }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '42%' }}>Service / Procedure Name</th>
                      <th style={{ width: '20%' }}>Duration</th>
                      <th style={{ width: '22%' }}>Price (₹) <span style={{ color: '#4ade80' }}>• Editable</span></th>
                      <th style={{ width: '12%', textAlign: 'center' }}>Bookable</th>
                      <th style={{ width: '4%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            className="service-name-input"
                            value={svc.name}
                            onChange={e => handleUpdateServiceName(idx, e.target.value)}
                            title="Click to rename service"
                          />
                        </td>
                        <td>
                          <div className="duration-editable-cell">
                            <input
                              type="number"
                              min="5"
                              step="5"
                              value={svc.duration}
                              onChange={e => handleUpdateServiceDuration(idx, parseInt(e.target.value, 10) || 15)}
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
                              value={svc.price}
                              onChange={e => handleUpdateServicePrice(idx, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleServiceBookable(idx)}
                            className={`switch-pill ${svc.isBookable ? 'active' : 'inactive'}`}
                            title={svc.isBookable ? 'Click to hide from patients' : 'Click to enable booking'}
                          >
                            <span>{svc.isBookable ? '✓ Active' : '✕ Paused'}</span>
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              transition: 'all 0.15s ease',
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

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                <span>Total catalog items: {services.length} active treatments / procedures</span>
                <span>💡 Changes to prices update instantly for AI quotes</span>
              </div>
            </div>
          )}

          {/* STEP 4: Working Hours */}
          {currentStep === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Step 4: Clinic Operating Hours</h2>
                  <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                    The AI Front Desk checks these operating windows before suggesting available appointment slots.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMondayHours}
                  className="btn btn-secondary btn-sm"
                  title="Copy Monday hours to Tuesday through Friday"
                >
                  ⚡ Copy Mon Hours to Weekdays
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {workingHours.map((wh, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      padding: '0.875rem clamp(0.75rem, 3vw, 1.25rem)',
                      background: wh.isOpen ? 'hsl(var(--color-surface-2))' : 'hsl(var(--color-surface) / 0.5)',
                      borderRadius: '12px',
                      border: `1px solid ${wh.isOpen ? 'hsl(var(--color-border))' : 'hsl(var(--color-border-subtle))'}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        width: 30,
                        height: 30,
                        borderRadius: '8px',
                        background: wh.isOpen ? 'hsla(142, 71%, 45%, 0.15)' : 'hsl(var(--color-surface-3))',
                        color: wh.isOpen ? '#4ade80' : 'hsl(var(--color-text-muted))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        flexShrink: 0,
                      }}>
                        {DAYS[wh.dayOfWeek].substring(0, 3)}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: wh.isOpen ? '#f8fafc' : 'hsl(var(--color-text-muted))' }}>
                        {DAYS[wh.dayOfWeek]}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...workingHours];
                          updated[idx].isOpen = !updated[idx].isOpen;
                          setWorkingHours(updated);
                        }}
                        className={`switch-pill ${wh.isOpen ? 'active' : 'inactive'}`}
                      >
                        <span>{wh.isOpen ? '● Open' : '○ Closed'}</span>
                      </button>

                      {wh.isOpen ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="time"
                            className="input"
                            style={{ width: 130, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                            value={wh.openTime}
                            onChange={e => {
                              const updated = [...workingHours];
                              updated[idx].openTime = e.target.value;
                              setWorkingHours(updated);
                            }}
                          />
                          <span style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>to</span>
                          <input
                            type="time"
                            className="input"
                            style={{ width: 130, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                            value={wh.closeTime}
                            onChange={e => {
                              const updated = [...workingHours];
                              updated[idx].closeTime = e.target.value;
                              setWorkingHours(updated);
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: 285, fontSize: '0.825rem', color: 'hsl(var(--color-text-muted))', fontStyle: 'italic', textAlign: 'center' }}>
                          Closed for appointments
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Booking Policies */}
          {currentStep === 5 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Step 5: Booking Rules & Policies</h2>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                  Set intelligent guardrails for how far in advance patients can book, reschedule, or cancel appointments.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
                  <label className="label">
                    <span>⏱️</span> Minimum Advance Notice
                  </label>
                  <div className="input-addon-group" style={{ marginBottom: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      value={minAdvanceHours}
                      onChange={e => setMinAdvanceHours(e.target.value)}
                    />
                    <div className="input-addon-suffix">Hours</div>
                  </div>
                  <span className="form-hint">
                    Prevents patients booking slots too close to current time so clinic staff isn't caught off guard.
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
                  <label className="label">
                    <span>📅</span> Maximum Booking Window
                  </label>
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
                  <span className="form-hint">
                    Furthest number of days in the future a patient is allowed to reserve a slot.
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
                  <label className="label">
                    <span>🚫</span> Cancellation Cutoff Window
                  </label>
                  <div className="input-addon-group" style={{ marginBottom: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      value={cancellationHours}
                      onChange={e => setCancellationHours(e.target.value)}
                    />
                    <div className="input-addon-suffix">Hours</div>
                  </div>
                  <span className="form-hint">
                    Minimum notice required before a patient can cancel or reschedule an existing booking.
                  </span>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'hsl(var(--color-surface-2))' }}>
                  <label className="label">
                    <span>🧼</span> Buffer Between Appointments
                  </label>
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
                  <span className="form-hint">
                    Operatory sterilization, instrument prep, and room turnaround buffer inserted between patients.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: WhatsApp Connection */}
          {currentStep === 6 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Step 6: Connect Clinic WhatsApp</h2>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                  Link your number just like WhatsApp Web. Scan a QR code or enter an 8-digit pairing code on your mobile app.
                </p>
              </div>

              {waStatus === 'connected' ? (
                <div style={{
                  background: 'hsla(142, 71%, 45%, 0.1)',
                  border: '1px solid hsla(142, 71%, 45%, 0.3)',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ fontSize: '2.5rem' }}>✅</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#4ade80' }}>
                      WhatsApp Connected as {connectedNumber || 'Clinic Phone'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-secondary))', marginTop: '0.25rem' }}>
                      Your AI receptionist is active and ready to handle incoming patient queries!
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Mode Selector */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    background: 'hsl(var(--color-surface-2))',
                    padding: '0.25rem',
                    borderRadius: '10px',
                    marginBottom: '1.25rem',
                  }}>
                    <button
                      type="button"
                      onClick={() => setWaMode('qr')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        background: waMode === 'qr' ? 'hsl(var(--color-surface))' : 'transparent',
                        color: waMode === 'qr' ? 'hsl(var(--color-text-primary))' : 'hsl(var(--color-text-muted))',
                      }}
                    >
                      📷 Scan QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaMode('pairing_code')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        background: waMode === 'pairing_code' ? 'hsl(var(--color-surface))' : 'transparent',
                        color: waMode === 'pairing_code' ? 'hsl(var(--color-text-primary))' : 'hsl(var(--color-text-muted))',
                      }}
                    >
                      🔢 Link with Phone Code
                    </button>
                  </div>

                  {waError && (
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'hsla(0, 84%, 60%, 0.1)',
                      color: '#f87171',
                      border: '1px solid hsla(0, 84%, 60%, 0.3)',
                      fontSize: '0.8rem',
                      marginBottom: '1rem',
                    }}>
                      ⚠️ {waError}
                    </div>
                  )}

                  {waMode === 'qr' ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'hsl(var(--color-surface-2))', borderRadius: '14px' }}>
                      {qrCode ? (
                        <div>
                          <div style={{
                            display: 'inline-block',
                            padding: '12px',
                            background: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            marginBottom: '1rem',
                          }}>
                            <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 200, height: 200, display: 'block', borderRadius: '8px' }} />
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.5rem' }}>
                            Point camera from WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                            Instant Linked Device QR Code
                          </div>
                          <button
                            type="button"
                            onClick={handleStartOnboardingQR}
                            disabled={isLoadingWA}
                            className="btn btn-primary"
                            style={{ padding: '0.6rem 1.5rem' }}
                          >
                            {isLoadingWA ? 'Generating QR...' : 'Show QR Code'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '1.5rem', background: 'hsl(var(--color-surface-2))', borderRadius: '14px' }}>
                      <form onSubmit={handleRequestOnboardingPairingCode} style={{ marginBottom: '1rem' }}>
                        <label className="label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                          Clinic WhatsApp Phone Number (with country code)
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            className="input"
                            value={waPhoneInput}
                            onChange={e => setWaPhoneInput(e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            style={{ flex: 1 }}
                          />
                          <button type="submit" disabled={isLoadingWA || Boolean(pairingCode)} className="btn btn-primary">
                            {isLoadingWA ? 'Requesting...' : pairingCode ? 'Code Active' : 'Get Code'}
                          </button>
                        </div>
                      </form>

                      {pairingCode && (
                        <div style={{
                          background: 'hsla(142, 71%, 45%, 0.1)',
                          border: '1px solid hsla(142, 71%, 45%, 0.3)',
                          borderRadius: '10px',
                          padding: '1rem',
                          textAlign: 'center',
                          marginBottom: '0.75rem',
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>YOUR 8-DIGIT PAIRING CODE</div>
                          <div style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'monospace', color: '#4ade80', letterSpacing: '0.15em', margin: '0.35rem 0' }}>
                            {pairingCode}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(pairingCode.replace('-', ''));
                                setCodeCopied(true);
                                setTimeout(() => setCodeCopied(false), 2000);
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              {codeCopied ? '✓ Copied' : 'Copy Code'}
                            </button>
                            <button
                              type="button"
                              onClick={handleResetOnboardingPairing}
                              disabled={isLoadingWA}
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'hsl(var(--color-text-muted))' }}
                            >
                              Reset
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.4rem' }}>
                            In WhatsApp: Settings &gt; Linked Devices &gt; Link a Device &gt; Tap &quot;Link with phone number instead&quot;. Keep WhatsApp open while linking (takes 5–10s).
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                      (You can also skip this and connect anytime later from Clinic Integrations)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Google Calendar Connection */}
          {currentStep === 7 && (
            <div>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>Step 7: Connect Google Doctor Calendar</h2>
                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                  Two-way sync: Appointments booked by AI are automatically placed on your Google Calendar, and your existing personal events block AI booking.
                </p>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                borderRadius: '18px',
                border: '1px dashed hsl(var(--color-border))',
                background: 'hsl(var(--color-surface-2))',
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem auto',
                  fontSize: '2rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}>
                  📅
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {calendarConnected ? '✅ Google Calendar Connected & Active' : 'Authorize Google Doctor Calendar'}
                </h3>

                <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem', maxWidth: 480, margin: '0 auto 1.25rem auto' }}>
                  {calendarConnected
                    ? '2-Way Calendar Sync is online. Patient bookings will appear with patient contact info, procedure duration, and notes.'
                    : 'Click below to connect your clinic’s Google Workspace or Gmail calendar.'}
                </p>

                {/* OAuth status badge */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {isLiveGoogleConfigured ? (
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'hsla(142, 71%, 45%, 0.12)', border: '1px solid hsla(142, 71%, 45%, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}>
                      🟢 Live Google Account OAuth Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'hsla(38, 92%, 50%, 0.12)', border: '1px solid hsla(38, 92%, 50%, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }} title="Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env for production Google OAuth">
                      ⚡ Sandbox Simulation Mode (Set GOOGLE_CLIENT_ID & SECRET in .env for Live Account)
                    </span>
                  )}
                </div>

                {!calendarConnected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <a
                      href="/api/v1/integrations/calendar/auth"
                      className="btn btn-primary btn-lg"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>Connect Clinic Google Calendar</span>
                    </a>

                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      Redirects to Google Cloud OAuth consent screen.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.25rem',
                      borderRadius: '12px',
                      background: 'hsla(142, 71%, 45%, 0.15)',
                      border: '1px solid hsla(142, 71%, 45%, 0.3)',
                      color: '#4ade80',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}>
                      ✓ {calendarEmail ? `Connected: ${calendarEmail}` : 'Google Calendar 2-Way Sync Active'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <a
                        href="/api/v1/integrations/calendar/auth"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', textDecoration: 'none' }}
                      >
                        🔄 Re-authenticate
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch('/api/v1/integrations/calendar', { method: 'DELETE' });
                          } catch {}
                          setCalendarConnected(false);
                          setCalendarEmail(null);
                        }}
                        className="btn"
                        style={{ fontSize: '0.8rem', background: 'hsla(0, 84%, 60%, 0.1)', color: '#f87171', border: '1px solid hsla(0, 84%, 60%, 0.3)' }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 8: Plan Selection & Payment Activation (UPI for India, Crypto for International) */}
          {currentStep === 8 && (
            <div>
              <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {isInternational ? 'Step 8: Plan Selection & Crypto Activation' : 'Step 8: Plan Selection & Instant UPI Activation'}
                  </h2>
                  <p style={{ color: 'hsl(var(--color-text-secondary))', fontSize: '0.875rem' }}>
                    {isInternational
                      ? 'Select your clinic’s subscription tier. Pay via Web3 Crypto (USDT, USDC, BTC, ETH) with instant hash confirmation.'
                      : 'Select your clinic’s subscription tier. Pay directly via UPI for instant activation.'}
                  </p>
                </div>

                {/* Currency & Region Switcher */}
                <div style={{
                  display: 'inline-flex',
                  background: 'hsl(var(--color-surface-2))',
                  padding: '0.25rem',
                  borderRadius: '9999px',
                  border: '1px solid hsl(var(--color-border))',
                }}>
                  <button
                    type="button"
                    onClick={() => setIsInternational(false)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: !isInternational ? 700 : 500,
                      background: !isInternational ? 'hsla(221, 83%, 58%, 0.2)' : 'transparent',
                      color: !isInternational ? '#93c5fd' : 'hsl(var(--color-text-muted))',
                      border: !isInternational ? '1px solid hsla(221, 83%, 58%, 0.4)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🇮🇳 India (INR • UPI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternational(true)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: isInternational ? 700 : 500,
                      background: isInternational ? 'linear-gradient(135deg, hsla(263, 70%, 50%, 0.25), hsla(221, 83%, 58%, 0.25))' : 'transparent',
                      color: isInternational ? '#c084fc' : 'hsl(var(--color-text-muted))',
                      border: isInternational ? '1px solid rgba(192, 132, 252, 0.4)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🌐 International (USD • Crypto)
                  </button>
                </div>
              </div>

              {/* Plan Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {PRICING_PLANS.map(p => {
                  const isSelected = selectedPlan === p.id;
                  const priceDisplay = isInternational ? p.priceUsdDisplay : p.priceInrDisplay;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id as any)}
                      style={{
                        padding: '1.75rem 1.5rem 1.5rem',
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? (isInternational ? '#c084fc' : 'hsl(var(--color-primary))') : 'hsl(var(--color-border))'}`,
                        background: isSelected
                          ? (isInternational ? 'hsla(263, 70%, 50%, 0.12)' : 'hsla(221, 83%, 58%, 0.1)')
                          : 'hsl(var(--color-surface-2))',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'visible',
                        marginTop: '0.75rem',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected
                          ? (isInternational ? '0 0 24px hsla(263, 70%, 50%, 0.25)' : '0 0 24px hsla(221, 83%, 58%, 0.25)')
                          : 'none',
                      }}
                    >
                      {p.badge && (
                        <div style={{
                          position: 'absolute',
                          top: -11,
                          right: 16,
                          background: isInternational
                            ? 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(221 83% 58%) 100%)'
                            : 'var(--gradient-brand)',
                          color: 'white',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                          zIndex: 10,
                          letterSpacing: '0.02em',
                        }}>
                          {p.badge}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>{p.name}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.35rem' }}>
                        {priceDisplay}<span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', fontWeight: 500 }}>/mo</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isInternational ? '#c084fc' : 'hsl(221 83% 70%)', marginBottom: '1rem' }}>
                        {p.chatsDisplay}
                      </div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                        {p.features.map((f, i) => (
                          <li key={i} style={{ marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: '#4ade80' }}>✓</span> {f}
                          </li>
                        ))}
                        {isInternational && (
                          <li style={{ marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc' }}>
                            <span>🪙</span> Pay via Crypto (USDT / USDC / BTC)
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* PAYMENT CARD: Either Crypto (International) or UPI (Domestic India) */}
              {isInternational ? (
                /* International Crypto Gateway Card */
                <div style={{
                  background: 'hsl(var(--color-surface-2))',
                  borderRadius: '16px',
                  border: '1px solid hsla(263, 70%, 50%, 0.3)',
                  padding: 'clamp(1rem, 3vw, 1.75rem)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🪙</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>
                          International Crypto Payment Gateway
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-secondary))' }}>
                          Selected Tier: <strong style={{ color: '#c084fc' }}>{PRICING_PLANS.find(p => p.id === selectedPlan)?.name}</strong> — <strong style={{ color: '#4ade80' }}>{PRICING_PLANS.find(p => p.id === selectedPlan)?.priceUsdDisplay} USD</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      background: 'hsla(142, 71%, 45%, 0.12)',
                      border: '1px solid hsla(142, 71%, 45%, 0.3)',
                      color: '#4ade80',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}>
                      Amount: {PRICING_PLANS.find(p => p.id === selectedPlan)?.priceUsd} {selectedCryptoNetwork.symbol}
                    </div>
                  </div>

                  {/* Network Tabs */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Select Network:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                      {CRYPTO_NETWORKS.map(net => {
                        const isNetActive = selectedCryptoNetwork.id === net.id;
                        return (
                          <button
                            key={net.id}
                            type="button"
                            onClick={() => setSelectedCryptoNetwork(net)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '8px',
                              background: isNetActive ? 'hsla(263, 70%, 50%, 0.25)' : 'hsl(var(--color-surface))',
                              border: `1.5px solid ${isNetActive ? '#c084fc' : 'hsl(var(--color-border))'}`,
                              color: isNetActive ? '#ffffff' : 'hsl(var(--color-text-secondary))',
                              fontSize: '0.75rem',
                              fontWeight: isNetActive ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'center',
                            }}
                          >
                            <div>{net.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* QR & Deposit Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                    gap: '1.25rem',
                    alignItems: 'center',
                    background: 'hsl(var(--color-surface))',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--color-border))',
                  }}>
                    {/* SVG QR */}
                    <div style={{
                      background: 'white',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      textAlign: 'center',
                      width: 130,
                      margin: '0 auto',
                    }}>
                      <div style={{ width: 110, height: 110, background: '#f8fafc', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 100 100" width="100" height="100" fill="#0f172a">
                          <rect x="0" y="0" width="28" height="28" rx="3" fill="#0f172a"/>
                          <rect x="4" y="4" width="20" height="20" rx="2" fill="#ffffff"/>
                          <rect x="8" y="8" width="12" height="12" rx="1" fill="#0f172a"/>
                          <rect x="72" y="0" width="28" height="28" rx="3" fill="#0f172a"/>
                          <rect x="76" y="4" width="20" height="20" rx="2" fill="#ffffff"/>
                          <rect x="80" y="8" width="12" height="12" rx="1" fill="#0f172a"/>
                          <rect x="0" y="72" width="28" height="28" rx="3" fill="#0f172a"/>
                          <rect x="4" y="76" width="20" height="20" rx="2" fill="#ffffff"/>
                          <rect x="8" y="80" width="12" height="12" rx="1" fill="#0f172a"/>
                          <rect x="38" y="8" width="10" height="20" fill="#0f172a"/>
                          <rect x="8" y="38" width="20" height="10" fill="#0f172a"/>
                          <rect x="36" y="36" width="28" height="28" rx="2" fill="#0f172a"/>
                          <rect x="70" y="42" width="22" height="10" fill="#0f172a"/>
                          <rect x="42" y="72" width="12" height="22" fill="#0f172a"/>
                          <rect x="72" y="72" width="22" height="22" rx="2" fill="#0f172a"/>
                        </svg>
                      </div>
                      <div style={{ color: '#0f172a', fontSize: '0.68rem', fontWeight: 700, marginTop: '0.25rem' }}>
                        {selectedCryptoNetwork.symbol} Deposit
                      </div>
                    </div>

                    {/* Deposit Address Box & TxID input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Official {selectedCryptoNetwork.name} Address:
                        </div>
                        <div style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          background: 'hsl(var(--color-surface-2))',
                          border: '1px solid hsl(var(--color-border))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginTop: '0.25rem',
                        }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {selectedCryptoNetwork.address}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedCryptoNetwork.address);
                              setCopiedCryptoAddress(true);
                              setTimeout(() => setCopiedCryptoAddress(false), 2000);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ flexShrink: 0, fontSize: '0.72rem', padding: '0.35rem 0.6rem' }}
                          >
                            {copiedCryptoAddress ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="form-field" style={{ margin: 0 }}>
                        <label className="label" style={{ fontSize: '0.8rem' }}>
                          <span>🧾</span> Transaction Hash (TxID)
                        </label>
                        <input
                          className="input"
                          value={cryptoTxHash}
                          onChange={e => setCryptoTxHash(e.target.value)}
                          placeholder="e.g. 0x8f... or Tron TxID from your withdrawal receipt"
                          style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}
                        />
                        <span className="form-hint" style={{ fontSize: '0.7rem' }}>
                          💡 Send {PRICING_PLANS.find(p => p.id === selectedPlan)?.priceUsd} {selectedCryptoNetwork.symbol} on {selectedCryptoNetwork.networkName} and paste your TxID here.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Domestic UPI Instant Payment Card */
                <div style={{
                  background: 'hsl(var(--color-surface-2))',
                  borderRadius: '16px',
                  border: '1px solid hsl(var(--color-border))',
                  padding: 'clamp(1rem, 3vw, 1.75rem)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: '1.5rem',
                  alignItems: 'center',
                }}>
                  {/* Visual UPI QR Card */}
                  <div style={{
                    background: 'white',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}>
                    <div style={{ width: 140, height: 140, background: '#f8fafc', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 100 100" width="124" height="124" fill="#0f172a">
                        <rect x="0" y="0" width="30" height="30" rx="3" fill="#0f172a"/>
                        <rect x="5" y="5" width="20" height="20" rx="2" fill="#ffffff"/>
                        <rect x="9" y="9" width="12" height="12" rx="1" fill="#0f172a"/>
                        <rect x="70" y="0" width="30" height="30" rx="3" fill="#0f172a"/>
                        <rect x="75" y="5" width="20" height="20" rx="2" fill="#ffffff"/>
                        <rect x="79" y="9" width="12" height="12" rx="1" fill="#0f172a"/>
                        <rect x="0" y="70" width="30" height="30" rx="3" fill="#0f172a"/>
                        <rect x="5" y="75" width="20" height="20" rx="2" fill="#ffffff"/>
                        <rect x="9" y="79" width="12" height="12" rx="1" fill="#0f172a"/>
                        <rect x="40" y="10" width="8" height="20" fill="#0f172a"/>
                        <rect x="10" y="40" width="20" height="8" fill="#0f172a"/>
                        <rect x="40" y="40" width="20" height="20" rx="2" fill="#0f172a"/>
                        <rect x="65" y="45" width="25" height="8" fill="#0f172a"/>
                        <rect x="45" y="70" width="10" height="25" fill="#0f172a"/>
                        <rect x="70" y="70" width="25" height="25" rx="2" fill="#0f172a"/>
                      </svg>
                    </div>
                    <div style={{ color: '#0f172a', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.5rem' }}>
                      UPI Instant Payment
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.65rem' }}>
                      GPay • PhonePe • Paytm • BHIM
                    </div>
                  </div>

                  {/* VPA Details & UTR Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      padding: '0.875rem 1rem',
                      borderRadius: '10px',
                      background: 'hsl(var(--color-surface))',
                      border: '1px solid hsl(var(--color-border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Official Clinic UPI VPA:
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#93c5fd', fontFamily: 'monospace' }}>
                          {PLATFORM_UPI_VPA}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyVpa}
                        className="btn btn-secondary btn-sm"
                      >
                        {copiedVpa ? '✓ Copied' : '📋 Copy VPA'}
                      </button>
                    </div>

                    <div className="form-field">
                      <label className="label">
                        <span>🧾</span> 12-Digit Bank UTR / UPI Transaction Reference
                      </label>
                      <input
                        className="input"
                        value={utrNumber}
                        onChange={e => setUtrNumber(e.target.value)}
                        placeholder="e.g. 429104928104 (from your UPI receipt)"
                      />
                      <span className="form-hint">
                        💡 Automated verification activates your AI receptionist within seconds of UTR submission.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wizard Footer Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid hsl(var(--color-border))',
          }}>
            {currentStep > 1 ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
                style={{ padding: '0.75rem 1.5rem' }}
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
                style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
              >
                {isSubmitting ? 'Saving Progress...' : 'Next Step →'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(160 84% 39%) 100%)',
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 20px hsla(142, 71%, 45%, 0.4)',
                }}
                onClick={handleCompleteActivation}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Activating...' : '🚀 Complete Activation & Launch'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
