-- Emails allowed to request a dashboard magic link (registered after paid consult, vaccine order, or verified Stripe session).
-- Access only via Supabase service role from Vercel functions.

create table if not exists public.dashboard_access (
  email text primary key,
  created_at timestamptz not null default now()
);

comment on table public.dashboard_access is 'Customer emails eligible for dashboard login.';

alter table public.dashboard_access enable row level security;

-- No policies: anon/authenticated cannot read/write; service role bypasses RLS.
