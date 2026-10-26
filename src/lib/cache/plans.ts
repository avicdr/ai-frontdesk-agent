// src/lib/cache/plans.ts
// Cached reference data for subscription plans using Next.js unstable_cache

import { unstable_cache } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const getCachedSubscriptionPlans = unstable_cache(
  async () => {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('subscription_plans')
      .select('id, name, slug, price_inr, included_ai_requests, is_active')
      .eq('is_active', true)
      .order('price_inr', { ascending: true });

    if (error) {
      console.error('Error fetching cached subscription plans:', error);
      return [];
    }
    return data ?? [];
  },
  ['active-subscription-plans-ref'],
  { revalidate: 3600, tags: ['subscription-plans'] }
);
