// src/lib/ai/usage.ts
// AI cost metering — records every request and calculates cost

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { AgentResponse } from './provider';

interface UsageRecord {
  organizationId: string;
  conversationId: string;
  requestId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  isRetry: boolean;
  isFallback: boolean;
  latencyMs: number | null;
  success: boolean;
  errorCode?: string;
}

interface PricingVersion {
  id: string;
  input_token_price_usd: number;
  output_token_price_usd: number;
  cached_token_price_usd: number | null;
  usd_to_inr_rate: number;
}

/**
 * Records AI usage and calculates estimated cost.
 * Also updates the subscription usage counters.
 * Uses an idempotency key to prevent double-counting.
 */
export async function recordAiUsage(
  usage: UsageRecord,
  agentResponse: AgentResponse
): Promise<{ estimatedCostInr: number; pricingVersionId: string | null }> {
  const admin = createSupabaseAdminClient();

  // Get current pricing for this provider/model
  const { data: pricing } = await admin
    .from('provider_pricing')
    .select('id, input_token_price_usd, output_token_price_usd, cached_token_price_usd, usd_to_inr_rate')
    .eq('provider', usage.provider)
    .eq('model', usage.model)
    .eq('is_current', true)
    .maybeSingle() as { data: PricingVersion | null };

  // Calculate estimated cost
  let estimatedCostUsd = 0;
  if (pricing) {
    estimatedCostUsd +=
      (usage.inputTokens - (usage.cachedTokens ?? 0)) * pricing.input_token_price_usd;
    estimatedCostUsd += (usage.cachedTokens ?? 0) * (pricing.cached_token_price_usd ?? pricing.input_token_price_usd);
    estimatedCostUsd += usage.outputTokens * pricing.output_token_price_usd;
  }
  const estimatedCostInr = estimatedCostUsd * (pricing?.usd_to_inr_rate ?? 85);

  // Record in ai_usage_records
  const { error: insertError } = await admin.from('ai_usage_records').insert({
    organization_id: usage.organizationId,
    conversation_id: usage.conversationId,
    request_id: usage.requestId,
    provider: usage.provider,
    model: usage.model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cached_tokens: usage.cachedTokens,
    is_retry: usage.isRetry,
    is_fallback: usage.isFallback,
    latency_ms: usage.latencyMs,
    success: usage.success,
    error_code: usage.errorCode ?? null,
    pricing_version_id: pricing?.id ?? null,
    estimated_cost_inr: estimatedCostInr,
  });

  if (!insertError && usage.success) {
    // Append-only usage ledger entry
    await admin.from('usage_ledger').insert({
      organization_id: usage.organizationId,
      entry_type: 'ai_request',
      quantity: 1,
      cost_inr: estimatedCostInr,
      reference_id: usage.requestId,
      idempotency_key: `ai:${usage.requestId}`,
    }).onConflict('idempotency_key').ignore();

    // Update subscription counters (atomic increment)
    await admin.rpc('increment_usage', {
      p_organization_id: usage.organizationId,
      p_ai_requests: 1,
      p_ai_cost_inr: estimatedCostInr,
    });
  }

  return { estimatedCostInr, pricingVersionId: pricing?.id ?? null };
}

/**
 * Checks whether an organization has sufficient quota for an AI request.
 * Returns the reason for denial if blocked.
 */
export async function checkQuota(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string; warningLevel?: 'warning' | 'critical' }> {
  const admin = createSupabaseAdminClient();

  const { data: sub } = await admin
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('organization_id', organizationId)
    .single();

  if (!sub) {
    return { allowed: false, reason: 'No active subscription found.' };
  }

  if (!['active', 'trial', 'grace_period'].includes(sub.status)) {
    return { allowed: false, reason: `Subscription is ${sub.status}. Please renew to continue.` };
  }

  const plan = sub.subscription_plans;
  if (!plan) {
    return { allowed: false, reason: 'Subscription plan not found.' };
  }

  // Check AI request quota
  const requestsUsed = sub.ai_requests_used;
  const requestsLimit = plan.included_ai_requests;
  const usagePercent = requestsLimit > 0 ? (requestsUsed / requestsLimit) * 100 : 0;

  if (usagePercent >= 100 && plan.over_limit_behavior === 'block') {
    return { allowed: false, reason: 'Monthly AI request quota exceeded.' };
  }

  // Check cost quota
  const costUsed = parseFloat(sub.ai_cost_used_inr);
  const costLimit = plan.max_monthly_spend_inr;
  if (costLimit && costUsed >= costLimit) {
    return { allowed: false, reason: 'Monthly AI cost limit reached.' };
  }

  // Determine warning level
  if (usagePercent >= 95) {
    return { allowed: true, warningLevel: 'critical' };
  }
  if (usagePercent >= 80) {
    return { allowed: true, warningLevel: 'warning' };
  }

  return { allowed: true };
}
