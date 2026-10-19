-- 002_baileys_whatsapp_sessions.sql
-- Migration to store Baileys session credentials and keys per organization
-- Enables multi-device QR and Pairing Code WhatsApp connections without Meta Cloud API

CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    key_id TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_key UNIQUE (organization_id, key_id)
);

-- Index for rapid lookups of session keys
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_org ON public.whatsapp_sessions(organization_id);

-- Enhance whatsapp_integrations table to record connection type, jid, and pairing info
ALTER TABLE public.whatsapp_integrations
    ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'baileys',
    ADD COLUMN IF NOT EXISTS jid TEXT,
    ADD COLUMN IF NOT EXISTS pairing_code TEXT;

-- Row Level Security for whatsapp_sessions
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access: whatsapp_sessions" ON public.whatsapp_sessions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid()
        )
    );
