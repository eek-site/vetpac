-- Supabase linter 0013: public tables must have RLS enabled when exposed to PostgREST.
-- _eek_migrations is internal; RLS on with no policies blocks anon/authenticated via API.
-- Service role and direct DB connections bypass RLS as needed for migrations tooling.

ALTER TABLE IF EXISTS public._eek_migrations ENABLE ROW LEVEL SECURITY;
