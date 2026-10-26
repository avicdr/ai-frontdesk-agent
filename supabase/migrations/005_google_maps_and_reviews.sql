-- Migration 005: Google Maps location & automated Google Review requests

-- 1. Add Google Maps & Review columns to clinic_profiles
ALTER TABLE public.clinic_profiles
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS google_review_link TEXT,
ADD COLUMN IF NOT EXISTS auto_review_request BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS review_request_delay_minutes INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS review_request_template TEXT;

-- 2. Add review request tracking columns to appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending';

-- 3. Index appointments for fast cron lookup of pending review requests
CREATE INDEX IF NOT EXISTS idx_appointments_pending_review 
ON public.appointments (status, review_requested_at, ends_at)
WHERE review_requested_at IS NULL;
