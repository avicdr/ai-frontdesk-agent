'use client';

// src/lib/hooks/use-geo-currency.ts
// Hook to automatically detect client country (India vs International) and provide currency/plan toggle

import { useState, useEffect } from 'react';
import { PRICING_PLANS, isInternationalClient } from '@/lib/constants/billing';

export function useGeoCurrency(initialCountry?: string | null, initialTimezone?: string | null) {
  // If explicitly provided via props/profile, use that initially
  const [isInternational, setIsInternational] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_billing_currency');
      if (stored === 'USD') return true;
      if (stored === 'INR') return false;
    }
    if (initialCountry || initialTimezone) {
      return isInternationalClient(initialCountry, initialTimezone);
    }
    // Client timezone heuristic
    if (typeof Intl !== 'undefined') {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return isInternationalClient(null, tz);
      } catch {
        // ignore
      }
    }
    return false;
  });

  const [detectedCountry, setDetectedCountry] = useState<string | null>(initialCountry || null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If user has explicitly stored a preference in localStorage, respect it
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user_billing_currency') : null;

    fetch('/api/v1/geo')
      .then(res => res.json())
      .then(json => {
        if (json?.data?.country && json.data.country !== 'UNKNOWN') {
          setDetectedCountry(json.data.country);
          if (!stored) {
            setIsInternational(json.data.isInternational);
          }
        } else if (!stored) {
          // If geo IP header was unknown, verify via browser timezone
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setIsInternational(isInternationalClient(null, tz));
        }
      })
      .catch(() => {
        if (!stored) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setIsInternational(isInternationalClient(null, tz));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setCurrencyPreference = (international: boolean) => {
    setIsInternational(international);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_billing_currency', international ? 'USD' : 'INR');
    }
  };

  const currentPlans = PRICING_PLANS.map(p => ({
    id: p.id,
    name: p.name,
    badge: p.badge,
    chatsQuota: p.chatsQuota,
    chatsDisplay: p.chatsDisplay,
    price: isInternational ? p.priceUsdDisplay : p.priceInrDisplay,
    priceVal: isInternational ? p.priceUsd : p.priceInr,
    currency: isInternational ? 'USD' : 'INR',
    description: p.description,
    features: p.features,
  }));

  return {
    isInternational,
    setIsInternational: setCurrencyPreference,
    currency: isInternational ? 'USD' : 'INR',
    currencySymbol: isInternational ? '$' : '₹',
    detectedCountry,
    plans: currentPlans,
    loading,
  };
}
