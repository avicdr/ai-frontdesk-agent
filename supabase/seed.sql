-- ============================================================
-- Seed data for local development
-- ============================================================

-- Subscription plans
INSERT INTO public.subscription_plans (
    id, name, slug, description, price_inr, billing_cycle,
    included_inbound_messages, included_outbound_messages, included_ai_requests,
    max_input_tokens_per_request, max_output_tokens_per_response,
    max_tool_calls_per_turn, max_knowledge_docs, max_services,
    max_ai_cost_inr, max_daily_spend_inr, max_monthly_spend_inr,
    max_concurrent_requests, over_limit_behavior, grace_period_days,
    enabled_features, sort_order
) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Starter', 'starter',
    'Perfect for small clinics getting started with AI reception',
    999.00, 'monthly',
    500, 500, 300,
    8000, 700, 5, 20, 10,
    200.00, 10.00, 200.00, 3,
    'block', 3,
    '{"whatsapp": true, "google_calendar": true, "ai_agent": true, "reminders": false, "advanced_analytics": false}',
    1
),
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Growth', 'growth',
    'For growing clinics with higher volume and more features',
    2499.00, 'monthly',
    2000, 2000, 1200,
    8000, 700, 5, 50, 30,
    500.00, 25.00, 500.00, 5,
    'warn', 7,
    '{"whatsapp": true, "google_calendar": true, "ai_agent": true, "reminders": true, "advanced_analytics": true, "priority_support": false}',
    2
),
(
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Pro', 'pro',
    'For high-volume clinics requiring advanced features and larger quotas',
    4999.00, 'monthly',
    10000, 10000, 5000,
    8000, 700, 5, 200, 100,
    2000.00, 100.00, 2000.00, 10,
    'warn', 14,
    '{"whatsapp": true, "google_calendar": true, "ai_agent": true, "reminders": true, "advanced_analytics": true, "priority_support": true, "custom_integrations": true}',
    3
)
ON CONFLICT (slug) DO NOTHING;

-- Provider pricing (Gemini 1.5 Flash pricing as of 2024)
INSERT INTO public.provider_pricing (
    provider, model,
    input_token_price_usd, output_token_price_usd, cached_token_price_usd,
    usd_to_inr_rate, effective_from, is_current
) VALUES
(
    'gemini', 'gemini-1.5-flash',
    0.000000075, 0.0000003, 0.00000001875,
    85.0, '2024-01-01T00:00:00Z', TRUE
),
(
    'openai', 'gpt-4o-mini',
    0.00000015, 0.0000006, NULL,
    85.0, '2024-01-01T00:00:00Z', TRUE
)
ON CONFLICT (provider, model, effective_from) DO NOTHING;
