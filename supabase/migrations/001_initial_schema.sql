-- ============================================================
-- AI Front Desk SaaS — Database Schema
-- Migration: 001_initial_schema.sql
-- Run via: supabase db push OR psql -f this file
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS (managed by Supabase Auth, we add a profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORGANIZATIONS (Clinic Tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL DEFAULT 'IN',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    business_type TEXT NOT NULL DEFAULT 'dental_clinic',
    status TEXT NOT NULL DEFAULT 'onboarding'
        CHECK (status IN ('onboarding','active','suspended','deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent accidental deletion — keep for audit
CREATE RULE no_delete_organizations AS ON DELETE TO public.organizations
    DO INSTEAD NOTHING;

-- ============================================================
-- ORGANIZATION MEMBERSHIPS
-- ============================================================
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'staff', 'viewer');

CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'staff',
    invited_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================
-- CLINIC PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinic_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id),
    clinic_name TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'dental_clinic',
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'IN',
    phone TEXT,
    email TEXT,
    website TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['en'],
    emergency_instructions TEXT,
    onboarding_step INTEGER NOT NULL DEFAULT 1,
    onboarding_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKING HOURS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    -- 0=Sunday, 1=Monday, ..., 6=Saturday
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    open_time TIME,  -- e.g., '09:00'
    close_time TIME, -- e.g., '18:00'
    break_start TIME,
    break_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, day_of_week)
);

-- ============================================================
-- HOLIDAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    date DATE NOT NULL,
    name TEXT NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    price_min NUMERIC(10,2),
    price_max NUMERIC(10,2),
    price_display TEXT, -- e.g., "₹500–₹1,500"
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_bookable BOOLEAN NOT NULL DEFAULT TRUE,
    preparation_instructions TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING POLICIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id),
    min_advance_hours INTEGER NOT NULL DEFAULT 1,
    max_advance_days INTEGER NOT NULL DEFAULT 60,
    max_per_slot INTEGER NOT NULL DEFAULT 1,
    buffer_minutes INTEGER NOT NULL DEFAULT 10,
    cancellation_hours INTEGER NOT NULL DEFAULT 24,
    reschedule_hours INTEGER NOT NULL DEFAULT 24,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    allow_same_day BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AGENT CONFIGURATIONS (versioned)
-- ============================================================
CREATE TYPE public.config_status AS ENUM ('draft','pending_review','active','archived');

CREATE TABLE IF NOT EXISTS public.agent_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    version INTEGER NOT NULL DEFAULT 1,
    status public.config_status NOT NULL DEFAULT 'draft',
    assistant_name TEXT NOT NULL DEFAULT 'Aria',
    tone TEXT NOT NULL DEFAULT 'friendly'
        CHECK (tone IN ('professional','friendly','formal')),
    greeting_message TEXT,
    use_emoji BOOLEAN NOT NULL DEFAULT TRUE,
    max_response_length INTEGER NOT NULL DEFAULT 300,
    handoff_message TEXT,
    identifies_as_ai BOOLEAN NOT NULL DEFAULT TRUE,
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['en'],
    custom_instructions TEXT,
    created_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, version)
);

-- ============================================================
-- KNOWLEDGE DOCUMENTS
-- ============================================================
CREATE TYPE public.doc_type AS ENUM ('faq','policy','service','hours','general','imported_url','uploaded_file');

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    doc_type public.doc_type NOT NULL DEFAULT 'general',
    source_url TEXT,
    file_name TEXT,
    file_size_bytes INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WHATSAPP INTEGRATIONS
-- ============================================================
CREATE TYPE public.integration_status AS ENUM ('disconnected','connecting','connected','error','suspended');

CREATE TABLE IF NOT EXISTS public.whatsapp_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id),
    phone_number_id TEXT UNIQUE, -- Meta's phone number ID
    display_phone_number TEXT,
    waba_id TEXT,               -- WhatsApp Business Account ID
    access_token_encrypted TEXT, -- Encrypted permanent/system token
    webhook_verified_at TIMESTAMPTZ,
    status public.integration_status NOT NULL DEFAULT 'disconnected',
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CALENDAR INTEGRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id),
    google_account_email TEXT,
    selected_calendar_id TEXT,
    selected_calendar_name TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    status public.integration_status NOT NULL DEFAULT 'disconnected',
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TYPE public.conversation_status AS ENUM ('active','resolved','handed_off','expired');
CREATE TYPE public.conversation_owner AS ENUM ('ai','human');

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    patient_phone TEXT NOT NULL,
    patient_name TEXT,
    status public.conversation_status NOT NULL DEFAULT 'active',
    owner public.conversation_owner NOT NULL DEFAULT 'ai',
    assigned_to UUID REFERENCES auth.users(id),
    handoff_reason TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TYPE public.message_role AS ENUM ('patient','assistant','system');
CREATE TYPE public.message_status AS ENUM ('sent','delivered','read','failed');

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    -- Provider's message ID for deduplication
    external_id TEXT UNIQUE,
    role public.message_role NOT NULL,
    content TEXT NOT NULL,
    status public.message_status,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TYPE public.appointment_status AS ENUM (
    'pending_confirmation','confirmed','cancelled','rescheduled',
    'completed','no_show'
);
CREATE TYPE public.appointment_source AS ENUM ('whatsapp','dashboard','import');

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    conversation_id UUID REFERENCES public.conversations(id),
    service_id UUID REFERENCES public.services(id),
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT,
    notes TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    status public.appointment_status NOT NULL DEFAULT 'confirmed',
    source public.appointment_source NOT NULL DEFAULT 'whatsapp',
    -- External calendar event ID for sync
    external_event_id TEXT,
    external_calendar_id TEXT,
    -- Idempotency
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENT EVENTS (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    event_type TEXT NOT NULL, -- 'created','confirmed','cancelled','rescheduled','completed'
    actor_type TEXT NOT NULL, -- 'ai','patient','staff','system'
    actor_id TEXT,
    previous_status public.appointment_status,
    new_status public.appointment_status,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_inr NUMERIC(10,2) NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    included_inbound_messages INTEGER NOT NULL DEFAULT 500,
    included_outbound_messages INTEGER NOT NULL DEFAULT 500,
    included_ai_requests INTEGER NOT NULL DEFAULT 500,
    max_input_tokens_per_request INTEGER NOT NULL DEFAULT 8000,
    max_output_tokens_per_response INTEGER NOT NULL DEFAULT 700,
    max_tool_calls_per_turn INTEGER NOT NULL DEFAULT 5,
    max_knowledge_docs INTEGER NOT NULL DEFAULT 20,
    max_services INTEGER NOT NULL DEFAULT 10,
    max_ai_cost_inr NUMERIC(10,2),
    max_daily_spend_inr NUMERIC(10,2),
    max_monthly_spend_inr NUMERIC(10,2),
    max_concurrent_requests INTEGER NOT NULL DEFAULT 3,
    over_limit_behavior TEXT NOT NULL DEFAULT 'block'
        CHECK (over_limit_behavior IN ('block','warn','charge')),
    grace_period_days INTEGER NOT NULL DEFAULT 3,
    enabled_features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TYPE public.subscription_status AS ENUM (
    'trial','active','grace_period','expired','suspended','cancelled'
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status public.subscription_status NOT NULL DEFAULT 'trial',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    grace_expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    -- Usage this period
    messages_used_inbound INTEGER NOT NULL DEFAULT 0,
    messages_used_outbound INTEGER NOT NULL DEFAULT 0,
    ai_requests_used INTEGER NOT NULL DEFAULT 0,
    ai_cost_used_inr NUMERIC(12,4) NOT NULL DEFAULT 0,
    -- Renewal tracking
    last_renewed_at TIMESTAMPTZ,
    renewal_reminder_sent_at TIMESTAMPTZ,
    -- Admin overrides
    extended_by UUID REFERENCES auth.users(id),
    extended_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENT ORDERS
-- ============================================================
CREATE TYPE public.payment_order_status AS ENUM (
    'pending','processing','completed','failed','expired','refunded'
);

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    -- Provider order details
    provider TEXT NOT NULL DEFAULT 'cashfree',
    provider_order_id TEXT UNIQUE,
    amount_inr NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status public.payment_order_status NOT NULL DEFAULT 'pending',
    -- Manual UPI fallback
    utr_number TEXT,
    payment_screenshot_url TEXT,
    -- Verification
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    -- Idempotency
    idempotency_key TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_order_id UUID NOT NULL REFERENCES public.payment_orders(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    subscription_id UUID REFERENCES public.subscriptions(id),
    provider TEXT NOT NULL,
    provider_transaction_id TEXT UNIQUE,
    amount_inr NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL, -- provider status string
    payment_method TEXT,  -- 'upi','card','netbanking'
    upi_id TEXT,
    bank_reference TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECEIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    payment_transaction_id UUID UNIQUE REFERENCES public.payment_transactions(id),
    receipt_number TEXT UNIQUE NOT NULL,
    amount_inr NUMERIC(10,2) NOT NULL,
    plan_name TEXT NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROVIDER PRICING (versioned for cost calculations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.provider_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,  -- 'gemini','openai'
    model TEXT NOT NULL,
    input_token_price_usd NUMERIC(18,10) NOT NULL,  -- per token
    output_token_price_usd NUMERIC(18,10) NOT NULL,
    cached_token_price_usd NUMERIC(18,10),
    usd_to_inr_rate NUMERIC(10,4) NOT NULL DEFAULT 85.0,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, model, effective_from)
);

-- ============================================================
-- AI USAGE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    conversation_id UUID REFERENCES public.conversations(id),
    request_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cached_tokens INTEGER DEFAULT 0,
    is_retry BOOLEAN NOT NULL DEFAULT FALSE,
    is_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    latency_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_code TEXT,
    pricing_version_id UUID REFERENCES public.provider_pricing(id),
    estimated_cost_inr NUMERIC(12,6),
    provider_reported_cost NUMERIC(12,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USAGE LEDGER (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    subscription_id UUID REFERENCES public.subscriptions(id),
    -- Cannot update or delete
    entry_type TEXT NOT NULL, -- 'ai_request','message_inbound','message_outbound','manual_adjustment'
    quantity INTEGER NOT NULL DEFAULT 1,
    cost_inr NUMERIC(12,6),
    reference_id TEXT,  -- ai_usage_record ID or message ID
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent modifications to ledger
CREATE RULE no_update_usage_ledger AS ON UPDATE TO public.usage_ledger DO INSTEAD NOTHING;
CREATE RULE no_delete_usage_ledger AS ON DELETE TO public.usage_ledger DO INSTEAD NOTHING;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TYPE public.notification_status AS ENUM ('pending','sent','failed','skipped');
CREATE TYPE public.notification_channel AS ENUM ('email','whatsapp','sms');

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    notification_type TEXT NOT NULL, -- 'new_appointment','cancellation','handoff','usage_warning', etc.
    channel public.notification_channel NOT NULL DEFAULT 'email',
    recipient TEXT NOT NULL,  -- email or phone
    subject TEXT,
    body TEXT NOT NULL,
    status public.notification_status NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    idempotency_key TEXT UNIQUE NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WEBHOOK EVENTS (for deduplication)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,  -- 'whatsapp','google','cashfree'
    external_event_id TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'received',
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, external_event_id)
);

-- ============================================================
-- BACKGROUND JOBS
-- ============================================================
CREATE TYPE public.job_status AS ENUM ('pending','running','completed','failed','cancelled');

CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type TEXT NOT NULL,
    status public.job_status NOT NULL DEFAULT 'pending',
    payload JSONB NOT NULL DEFAULT '{}',
    organization_id UUID REFERENCES public.organizations(id),
    idempotency_key TEXT UNIQUE,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RATE LIMIT BUCKETS (DB-backed rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_key TEXT NOT NULL UNIQUE,  -- e.g., 'wa:+91XXXXXXXXXX:per_minute'
    count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id),
    actor_id UUID REFERENCES auth.users(id),
    actor_type TEXT NOT NULL DEFAULT 'user', -- 'user','system','ai','webhook'
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    previous_state JSONB,
    new_state JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_org_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX idx_conversations_phone ON public.conversations(patient_phone);
CREATE INDEX idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX idx_messages_ext_id ON public.messages(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX idx_appointments_starts ON public.appointments(starts_at);
CREATE INDEX idx_appointments_phone ON public.appointments(patient_phone);
CREATE INDEX idx_ai_usage_org ON public.ai_usage_records(organization_id);
CREATE INDEX idx_ai_usage_created ON public.ai_usage_records(created_at);
CREATE INDEX idx_usage_ledger_org ON public.usage_ledger(organization_id);
CREATE INDEX idx_notifications_org_status ON public.notifications(organization_id, status);
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_background_jobs_status ON public.background_jobs(status, scheduled_for);
CREATE INDEX idx_webhook_events_provider ON public.webhook_events(provider, external_event_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'user_profiles','organizations','organization_memberships',
        'clinic_profiles','working_hours','services','booking_policies',
        'agent_configurations','knowledge_documents','whatsapp_integrations',
        'calendar_integrations','conversations','appointments',
        'subscription_plans','subscriptions','payment_orders',
        'notifications','background_jobs','rate_limit_buckets'
    ] LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON public.%s
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
        ', t, t);
    END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on tenant-sensitive tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS UUID[] AS $$
    SELECT ARRAY(
        SELECT organization_id FROM public.organization_memberships
        WHERE user_id = auth.uid()
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: is user super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(is_super_admin, FALSE)
    FROM public.user_profiles
    WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: user role in org
CREATE OR REPLACE FUNCTION public.user_org_role(org_id UUID)
RETURNS TEXT AS $$
    SELECT role::TEXT FROM public.organization_memberships
    WHERE organization_id = org_id AND user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ---- user_profiles ----
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- ---- organizations ----
CREATE POLICY "Members can view their org" ON public.organizations
    FOR SELECT USING (id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Owners can update their org" ON public.organizations
    FOR UPDATE USING (public.user_org_role(id) IN ('owner','admin') OR public.is_super_admin());

-- ---- organization_memberships ----
CREATE POLICY "Members can view memberships" ON public.organization_memberships
    FOR SELECT USING (
        organization_id = ANY(public.get_user_org_ids()) OR
        user_id = auth.uid() OR
        public.is_super_admin()
    );

-- ---- Tenant tables: generic policy ----
-- For brevity, use a pattern for all tenant-scoped tables
CREATE POLICY "Tenant access: clinic_profiles" ON public.clinic_profiles
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: working_hours" ON public.working_hours
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: holidays" ON public.holidays
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: services" ON public.services
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: booking_policies" ON public.booking_policies
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: agent_configurations" ON public.agent_configurations
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: knowledge_documents" ON public.knowledge_documents
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: whatsapp_integrations" ON public.whatsapp_integrations
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: calendar_integrations" ON public.calendar_integrations
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: conversations" ON public.conversations
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: messages" ON public.messages
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: appointments" ON public.appointments
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: appointment_events" ON public.appointment_events
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: subscriptions" ON public.subscriptions
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: payment_orders" ON public.payment_orders
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: payment_transactions" ON public.payment_transactions
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: ai_usage_records" ON public.ai_usage_records
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: usage_ledger" ON public.usage_ledger
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Tenant access: notifications" ON public.notifications
    FOR ALL USING (organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin());
CREATE POLICY "Admin only: audit_logs" ON public.audit_logs
    FOR SELECT USING (
        organization_id = ANY(public.get_user_org_ids()) OR public.is_super_admin()
    );
