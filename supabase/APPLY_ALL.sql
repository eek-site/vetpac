-- Paste this entire file into Supabase → SQL → New query → Run once.
-- (Same as migrations 001 + 002 combined.)
-- If the Supabase project is paused, resume it first (Dashboard → project → Restore).
-- Or from repo (project linked + unpaused): npm run db:apply:remote

-- === 001 site_events ===

CREATE TABLE IF NOT EXISTS public.site_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'client',
  meta JSONB NOT NULL DEFAULT '{}',
  backfilled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_events_created ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_type_created ON public.site_events (event_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_events_stripe_session
  ON public.site_events ((meta->>'stripe_session_id'))
  WHERE (meta->>'stripe_session_id') IS NOT NULL;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.site_event_admin_stats()
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
  )
  SELECT jsonb_build_object(
    'nz_date_today', (SELECT today_nz FROM bounds),
    'nz_date_yesterday', (SELECT yesterday_nz FROM bounds),
    'counts_today_nz', (
      SELECT COALESCE(jsonb_object_agg(event_type, c), '{}'::jsonb)
      FROM (
        SELECT se.event_type, COUNT(*)::int AS c
        FROM site_events se, bounds b
        WHERE (timezone('Pacific/Auckland', se.created_at))::date = b.today_nz
        GROUP BY se.event_type
      ) q
    ),
    'counts_yesterday_nz', (
      SELECT COALESCE(jsonb_object_agg(event_type, c), '{}'::jsonb)
      FROM (
        SELECT se.event_type, COUNT(*)::int AS c
        FROM site_events se, bounds b
        WHERE (timezone('Pacific/Auckland', se.created_at))::date = b.yesterday_nz
        GROUP BY se.event_type
      ) q
    ),
    'counts_last_7_days_nz', (
      SELECT COALESCE(jsonb_object_agg(event_type, c), '{}'::jsonb)
      FROM (
        SELECT se.event_type, COUNT(*)::int AS c
        FROM site_events se, bounds b
        WHERE (timezone('Pacific/Auckland', se.created_at))::date >= b.week_start_nz
        GROUP BY se.event_type
      ) q
    ),
    'totals_last_7_days_nz', (
      SELECT COUNT(*)::int FROM site_events se, bounds b
      WHERE (timezone('Pacific/Auckland', se.created_at))::date >= b.week_start_nz
    )
  );
$$;

-- === 002 intake_chat_messages ===

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

-- === 003 intake_sessions ===

CREATE TABLE IF NOT EXISTS public.intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email TEXT,
  dog_name TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete', 'paid')),
  messages JSONB NOT NULL DEFAULT '[]',
  dog_profile JSONB NOT NULL DEFAULT '{}',
  health_history JSONB NOT NULL DEFAULT '{}',
  lifestyle JSONB NOT NULL DEFAULT '{}',
  owner_details JSONB NOT NULL DEFAULT '{}',
  ai_assessment JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_sessions_email ON public.intake_sessions (email);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_created ON public.intake_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_token ON public.intake_sessions (session_token);

ALTER TABLE public.intake_sessions ENABLE ROW LEVEL SECURITY;
-- All reads/writes go through service-role API routes — no direct client access needed.
CREATE POLICY IF NOT EXISTS "service_only" ON public.intake_sessions FOR ALL TO service_role USING (true);

-- --- 004: RLS on EEK migrations table (Supabase linter 0013) ---
ALTER TABLE IF EXISTS public._eek_migrations ENABLE ROW LEVEL SECURITY;
