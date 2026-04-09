-- Run in Supabase SQL editor (or supabase db push) once.
-- Stores client analytics + Stripe backfill rows.

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

-- Dedupe Stripe backfill re-runs
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_events_stripe_session
  ON public.site_events ((meta->>'stripe_session_id'))
  WHERE (meta->>'stripe_session_id') IS NOT NULL;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

-- No public policies: only service role (API routes) reads/writes.

-- Aggregates for admin (Pacific/Auckland calendar dates)
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
