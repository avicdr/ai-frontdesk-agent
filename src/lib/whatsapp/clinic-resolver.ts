// src/lib/whatsapp/clinic-resolver.ts
// Helper to resolve human-readable clinic names and phone numbers for defined logging & events

import { createSupabaseAdminClient } from '@/lib/supabase/server';

export interface ResolvedClinic {
  name: string;
  phone?: string;
  label: string;
}

interface CacheEntry {
  clinic: ResolvedClinic;
  timestamp: number;
}

const clinicCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return phone;
  return `+${digits}`;
}

export function cacheClinicPhone(organizationId: string, phone: string, name?: string) {
  const existing = clinicCache.get(organizationId);
  const formattedPhone = formatPhone(phone);
  const clinicName = name || existing?.clinic.name || `Clinic ${organizationId.slice(0, 8)}`;
  const label = formattedPhone ? `"${clinicName}" (${formattedPhone})` : `"${clinicName}"`;

  clinicCache.set(organizationId, {
    clinic: {
      name: clinicName,
      phone: formattedPhone,
      label,
    },
    timestamp: Date.now(),
  });
}

export async function getClinicInfo(
  organizationId: string,
  knownPhone?: string | null
): Promise<ResolvedClinic> {
  const cached = clinicCache.get(organizationId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    if (knownPhone && !cached.clinic.phone) {
      cached.clinic.phone = formatPhone(knownPhone);
      cached.clinic.label = `"${cached.clinic.name}" (${cached.clinic.phone})`;
    }
    return cached.clinic;
  }

  let clinicName = '';
  let phone = knownPhone ? formatPhone(knownPhone) : undefined;

  try {
    const admin = createSupabaseAdminClient();

    // 1. Try clinic_profiles
    const { data: profile } = await admin
      .from('clinic_profiles')
      .select('clinic_name, phone')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (profile?.clinic_name) {
      clinicName = profile.clinic_name;
      if (!phone && profile.phone) {
        phone = formatPhone(profile.phone);
      }
    }

    // 2. Fallback to organizations table
    if (!clinicName) {
      const { data: org } = await admin
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .maybeSingle();

      if (org?.name) {
        clinicName = org.name;
      }
    }

    // 3. Fallback phone from whatsapp_integrations
    if (!phone) {
      const { data: integ } = await admin
        .from('whatsapp_integrations')
        .select('display_phone_number')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (integ?.display_phone_number) {
        phone = formatPhone(integ.display_phone_number);
      }
    }
  } catch {
    // ignore DB errors during log resolution
  }

  if (!clinicName) {
    clinicName = `Clinic ${organizationId.slice(0, 8)}`;
  }

  const label = phone ? `"${clinicName}" (${phone})` : `"${clinicName}"`;
  const resolved: ResolvedClinic = {
    name: clinicName,
    phone,
    label,
  };

  clinicCache.set(organizationId, {
    clinic: resolved,
    timestamp: now,
  });

  return resolved;
}
