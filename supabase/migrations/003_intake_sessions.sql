-- Migration 003: intake_sessions
-- Stores full intake chat state server-side for resume and admin visibility.
-- Apply via: supabase db push  OR paste into Supabase SQL editor.

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
DO $$ BEGIN
  CREATE POLICY "service_only" ON public.intake_sessions FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
