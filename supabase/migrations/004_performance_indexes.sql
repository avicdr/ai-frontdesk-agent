-- Migration: 004_performance_indexes.sql
-- Description: Composite and ordering indexes for frequently queried endpoints
-- (Audit logs, payment orders, conversations inbox, and upcoming appointments)

-- 1. Audit logs ordering index (avoids full table sequential scan and quicksort on security ledger)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
ON public.audit_logs (created_at DESC);

-- 2. Payment orders admin listing index (speeds up platform admin order review)
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at_desc
ON public.payment_orders (created_at DESC);

-- 3. Payment orders tenant listing index (speeds up clinic billing history)
CREATE INDEX IF NOT EXISTS idx_payment_orders_org_created_desc
ON public.payment_orders (organization_id, created_at DESC);

-- 4. Conversations inbox composite index (avoids sorting in memory on inbox refresh)
CREATE INDEX IF NOT EXISTS idx_conversations_org_last_message
ON public.conversations (organization_id, last_message_at DESC NULLS LAST);

-- 5. Appointments scheduling index (composite org + start date for fast upcoming appointment lookup)
CREATE INDEX IF NOT EXISTS idx_appointments_org_starts_at
ON public.appointments (organization_id, starts_at ASC);
