-- Single source of truth for all chat messages across the site.
-- Keyed by a stable visitor_id (localStorage UUID) + email when known.
-- Sources: 'contact' | 'intake' | 'support'

CREATE TABLE IF NOT EXISTS public.visitor_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  TEXT        NOT NULL,
  email       TEXT,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  source      TEXT        NOT NULL CHECK (source IN ('contact', 'intake', 'support')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_messages_visitor
  ON public.visitor_messages (visitor_id, created_at);

CREATE INDEX IF NOT EXISTS idx_visitor_messages_email
  ON public.visitor_messages (email, created_at)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visitor_messages_created
  ON public.visitor_messages (created_at DESC);

ALTER TABLE public.visitor_messages ENABLE ROW LEVEL SECURITY;
-- No public SELECT/INSERT — all access via service role through API endpoints.
