-- Run in Supabase SQL after 001_site_events.sql (or standalone — no dependency on site_events).
-- Full intake Q&A transcript (server-side); RLS on, service role only.

CREATE TABLE IF NOT EXISTS public.intake_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  turn_index INT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_chat_session_turn
  ON public.intake_chat_messages (session_id, turn_index);

CREATE INDEX IF NOT EXISTS idx_intake_chat_created
  ON public.intake_chat_messages (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intake_session_turn_unique
  ON public.intake_chat_messages (session_id, turn_index);

ALTER TABLE public.intake_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.intake_chat_admin_stats()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH nz AS (
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Pacific/Auckland')::date AS d0
  ),
  bounds AS (
    SELECT
      d0 AS today_nz,
      d0 - 1 AS yesterday_nz,
      d0 - 6 AS week_start_nz
    FROM nz
  ),
  rows_nz AS (
    SELECT
      session_id,
      (timezone('Pacific/Auckland', created_at))::date AS nz_day
    FROM intake_chat_messages
  )
  SELECT jsonb_build_object(
    'nz_date_today', (SELECT today_nz FROM bounds),
    'nz_date_yesterday', (SELECT yesterday_nz FROM bounds),
    'distinct_sessions_today_nz', (
      SELECT COUNT(DISTINCT session_id)::int FROM rows_nz, bounds b
      WHERE rows_nz.nz_day = b.today_nz
    ),
    'distinct_sessions_yesterday_nz', (
      SELECT COUNT(DISTINCT session_id)::int FROM rows_nz, bounds b
      WHERE rows_nz.nz_day = b.yesterday_nz
    ),
    'distinct_sessions_last_7_days_nz', (
      SELECT COUNT(DISTINCT session_id)::int FROM rows_nz, bounds b
      WHERE rows_nz.nz_day >= b.week_start_nz
    ),
    'messages_today_nz', (
      SELECT COUNT(*)::int FROM intake_chat_messages m, bounds b
      WHERE (timezone('Pacific/Auckland', m.created_at))::date = b.today_nz
    ),
    'messages_yesterday_nz', (
      SELECT COUNT(*)::int FROM intake_chat_messages m, bounds b
      WHERE (timezone('Pacific/Auckland', m.created_at))::date = b.yesterday_nz
    ),
    'messages_last_7_days_nz', (
      SELECT COUNT(*)::int FROM intake_chat_messages m, bounds b
      WHERE (timezone('Pacific/Auckland', m.created_at))::date >= b.week_start_nz
    )
  );
$$;
