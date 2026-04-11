/**
 * Runs migrations 004 + 005 via Supabase Management API.
 * Usage: $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/run-new-migrations.mjs
 * Get your PAT from: https://supabase.com/dashboard/account/tokens
 */
const PROJECT_REF = 'vyqqkvzorrqnipbovnbp'
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error('\nMissing SUPABASE_ACCESS_TOKEN.')
  console.error('Get one from: https://supabase.com/dashboard/account/tokens')
  console.error('Then run:  $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"; node scripts/run-new-migrations.mjs\n')
  process.exit(1)
}

const SQL = `
CREATE TABLE IF NOT EXISTS public.visitor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('contact','intake','support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.visitor_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Public can read active announcements') THEN
    CREATE POLICY "Public can read active announcements" ON public.announcements FOR SELECT USING (NOW() BETWEEN start_at AND end_at);
  END IF;
END $$;

INSERT INTO public.announcements (title, body, start_at, end_at)
SELECT
  '⚠️ All Home Visits Suspended — Cyclone Vaianu',
  E'Due to Civil Defence emergency declarations across the North Island, all scheduled VetPac home visits are temporarily suspended.\n\nCyclone Vaianu is currently making landfall, with states of emergency declared in Northland, Auckland, Waikato, Coromandel, and Bay of Plenty. Civil Defence is advising all residents to stay indoors and off the roads.\n\nThe safety of our customers, their families, and our team comes first.\n\nAll affected customers will be contacted directly to reschedule at no extra cost. We expect to resume normal operations once Civil Defence advisories are lifted.\n\nStay safe, and keep your puppies inside.',
  '2026-04-10 23:00:00+00',
  '2026-04-12 23:00:00+00'
WHERE NOT EXISTS (SELECT 1 FROM public.announcements WHERE title LIKE '%Cyclone Vaianu%');
`

console.log('Running migrations 004 + 005...')
const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: SQL }),
})

const text = await res.text()
if (!res.ok) {
  console.error('Failed:', res.status, text)
  process.exit(1)
}
console.log('Done. Both tables created and Cyclone Vaianu announcement seeded.')
