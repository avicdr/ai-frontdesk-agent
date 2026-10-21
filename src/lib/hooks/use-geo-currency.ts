'use client';

// src/lib/hooks/use-geo-currency.ts
// Hook to automatically detect client country (India vs International) and provide currency/plan toggle

import { useState, useEffect } from 'react';
import { PRICING_PLANS, isInternationalClient } from '@/lib/constants/billing';

export function useGeoCurrency(initialCountry?: string | null, initialTimezone?: string | null) {
  // Strictly compute based on verified country/timezone
  const [isInternational, setIsInternational] = useState<boolean>(() => {
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
    if (initialCountry && initialCountry !== 'UNKNOWN') {
      setIsInternational(isInternationalClient(initialCountry, initialTimezone));
      setLoading(false);
      return;
    }

    fetch('/api/v1/geo')
      .then(res => res.json())
      .then(json => {
        if (json?.data?.country && json.data.country !== 'UNKNOWN') {
          setDetectedCountry(json.data.country);
          setIsInternational(Boolean(json.data.isInternational));
        } else {
          // If geo IP header was unknown, verify via browser timezone
          const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
          setIsInternational(isInternationalClient(null, tz));
        }
      })
      .catch(() => {
        const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
        setIsInternational(isInternationalClient(null, tz));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialCountry, initialTimezone]);

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
    currency: isInternational ? 'USD' : 'INR',
    currencySymbol: isInternational ? '$' : '₹',
    detectedCountry,
    plans: currentPlans,
    loading,
  };
}
