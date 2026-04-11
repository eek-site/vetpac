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
  legacy_session_id TEXT UNIQUE,
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
DO $$ BEGIN
  CREATE POLICY "service_only" ON public.intake_sessions FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === 004 intake_sessions order fields ===

ALTER TABLE public.intake_sessions
  ADD COLUMN IF NOT EXISTS vaccine_plan JSONB,
  ADD COLUMN IF NOT EXISTS delivery_method TEXT,
  ADD COLUMN IF NOT EXISTS warranty_selected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS order_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';

-- === 005 dashboard_access table ===

CREATE TABLE IF NOT EXISTS public.dashboard_access (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dashboard_access ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "service_only" ON public.dashboard_access FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- --- RLS on EEK migrations table (Supabase linter 0013) ---
ALTER TABLE IF EXISTS public._eek_migrations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Migration 004: visitor_messages — unified chat SSOT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.visitor_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT        NOT NULL,
  email       TEXT,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  source      TEXT        NOT NULL CHECK (source IN ('contact', 'intake', 'support')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visitor_messages_visitor ON public.visitor_messages (visitor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_messages_email ON public.visitor_messages (email, created_at) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_messages_created ON public.visitor_messages (created_at DESC);
ALTER TABLE public.visitor_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Migration 005: announcements — splash modal
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements (start_at, end_at);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Public can read active announcements') THEN
    CREATE POLICY "Public can read active announcements"
      ON public.announcements FOR SELECT
      USING (NOW() BETWEEN start_at AND end_at);
  END IF;
END $$;

-- Seed: Cyclone Vaianu notice (11 Apr 11am NZT → 13 Apr 11am NZT)
INSERT INTO public.announcements (title, body, start_at, end_at)
SELECT
  '⚠️ All Home Visits Suspended — Cyclone Vaianu',
  E'Due to Civil Defence emergency declarations across the North Island, all scheduled VetPac home visits are temporarily suspended.\n\nCyclone Vaianu is currently making landfall, with states of emergency declared in Northland, Auckland, Waikato, Coromandel, and Bay of Plenty. Civil Defence is advising all residents to stay indoors and off the roads.\n\nThe safety of our customers, their families, and our team comes first.\n\nAll affected customers will be contacted directly to reschedule at no extra cost. We expect to resume normal operations once Civil Defence advisories are lifted.\n\nStay safe, and keep your puppies inside.',
  '2026-04-10 23:00:00+00',
  '2026-04-12 23:00:00+00'
WHERE NOT EXISTS (SELECT 1 FROM public.announcements WHERE title LIKE '%Cyclone Vaianu%');
