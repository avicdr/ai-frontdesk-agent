-- 003_campaign_manager.sql
-- Migration for WhatsApp Outreach Campaign Manager & Response Time Qualification

CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    sender_phone TEXT,
    message_template TEXT NOT NULL,
    response_threshold_seconds INTEGER NOT NULL DEFAULT 60,
    delay_seconds INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_leads (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Doctor',
    clinic_name TEXT NOT NULL DEFAULT 'Clinic',
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    qualification_status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    response_time_seconds INTEGER,
    outreach_message TEXT,
    reply_text TEXT,
    ai_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_phone ON public.campaign_leads(phone);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON public.campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_qual ON public.campaign_leads(qualification_status);

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin full access: campaigns" ON public.campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Super admin full access: campaign_leads" ON public.campaign_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );
