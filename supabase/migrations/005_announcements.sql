-- Announcements table — powers the site-wide splash modal.
-- Announcement is "active" when NOW() is between start_at and end_at.

CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON public.announcements (start_at, end_at);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public SELECT for active announcements (modal fetch — no auth required)
CREATE POLICY "Public can read active announcements"
  ON public.announcements FOR SELECT
  USING (NOW() BETWEEN start_at AND end_at);

-- Seed: Cyclone Vaianu — 11 Apr 11am NZ → 13 Apr 11am NZ (NZST = UTC+12)
INSERT INTO public.announcements (title, body, start_at, end_at)
VALUES (
  '⚠️ All Home Visits Suspended — Cyclone Vaianu',
  E'Due to Civil Defence emergency declarations across the North Island, all scheduled VetPac home visits are temporarily suspended.\n\nCyclone Vaianu is currently making landfall, with states of emergency declared in Northland, Auckland, Waikato, Coromandel, and Bay of Plenty. Civil Defence is advising all residents to stay indoors and off the roads.\n\nThe safety of our customers, their families, and our team comes first.\n\nAll affected customers will be contacted directly to reschedule at no extra cost. We expect to resume normal operations once Civil Defence advisories are lifted — we will update this notice as the situation develops.\n\nStay safe, and keep your puppies inside.',
  '2026-04-10 23:00:00+00',  -- 11 Apr 11:00am NZST
  '2026-04-12 23:00:00+00'   -- 13 Apr 11:00am NZST
);
