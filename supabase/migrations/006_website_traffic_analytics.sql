-- ============================================================
-- Migration 006: Website Traffic Analytics & Tracking System
-- Tables: analytics_visitors, analytics_sessions, analytics_events
-- ============================================================

-- 1. Analytics Visitors (Persistent anonymous visitor profiles)
CREATE TABLE IF NOT EXISTS public.analytics_visitors (
    id TEXT PRIMARY KEY,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_sessions INTEGER NOT NULL DEFAULT 1,
    total_page_views INTEGER NOT NULL DEFAULT 1,
    device_type TEXT NOT NULL DEFAULT 'desktop',
    browser TEXT,
    operating_system TEXT,
    country TEXT NOT NULL DEFAULT 'UNKNOWN',
    region TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Analytics Sessions (Visitor browsing sessions, 30m idle timeout)
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id TEXT PRIMARY KEY,
    visitor_id TEXT NOT NULL REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    entry_page TEXT NOT NULL,
    exit_page TEXT NOT NULL,
    referrer TEXT,
    referring_domain TEXT,
    traffic_source TEXT NOT NULL DEFAULT 'direct'
        CHECK (traffic_source IN ('direct', 'organic_search', 'paid_search', 'social', 'referral', 'email', 'other')),
    campaign_source TEXT,
    campaign_medium TEXT,
    campaign_name TEXT,
    campaign_term TEXT,
    campaign_content TEXT,
    device_type TEXT NOT NULL DEFAULT 'desktop'
        CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    browser_version TEXT,
    operating_system TEXT,
    screen_resolution TEXT,
    country TEXT NOT NULL DEFAULT 'UNKNOWN',
    region TEXT,
    city TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    page_views INTEGER NOT NULL DEFAULT 1,
    is_bounce BOOLEAN NOT NULL DEFAULT TRUE,
    has_qualified_engagement BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Analytics Events (Granular page views, scroll milestones, clicks, custom events)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    visitor_id TEXT NOT NULL REFERENCES public.analytics_visitors(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
    page_path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    event_properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    device_type TEXT NOT NULL DEFAULT 'desktop',
    browser TEXT,
    operating_system TEXT,
    country TEXT NOT NULL DEFAULT 'UNKNOWN',
    region TEXT,
    city TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR HIGH-PERFORMANCE ANALYTICS QUERIES
-- ============================================================

-- Events Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp 
    ON public.analytics_events (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time 
    ON public.analytics_events (event_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
    ON public.analytics_events (session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor 
    ON public.analytics_events (visitor_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_path 
    ON public.analytics_events (page_path, timestamp DESC);

-- Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started 
    ON public.analytics_sessions (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_activity 
    ON public.analytics_sessions (last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_visitor 
    ON public.analytics_sessions (visitor_id);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_source 
    ON public.analytics_sessions (traffic_source, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country 
    ON public.analytics_sessions (country, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_campaign 
    ON public.analytics_sessions (campaign_name) 
    WHERE campaign_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_bounce 
    ON public.analytics_sessions (is_bounce, started_at DESC);

-- Visitors Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_last_seen 
    ON public.analytics_visitors (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_visitors_first_seen 
    ON public.analytics_visitors (first_seen_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API route ingestion & admin aggregation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'analytics_visitors' AND policyname = 'service_role_all_analytics_visitors'
    ) THEN
        CREATE POLICY service_role_all_analytics_visitors ON public.analytics_visitors
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'analytics_sessions' AND policyname = 'service_role_all_analytics_sessions'
    ) THEN
        CREATE POLICY service_role_all_analytics_sessions ON public.analytics_sessions
            FOR ALL USING (auth.role() = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'service_role_all_analytics_events'
    ) THEN
        CREATE POLICY service_role_all_analytics_events ON public.analytics_events
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

