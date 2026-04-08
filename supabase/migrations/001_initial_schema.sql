-- VetPac Initial Schema
-- Run this in Supabase SQL Editor

-- USERS (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  phone           text,
  full_name       text,
  address_line1   text,
  address_line2   text,
  city            text,
  postcode        text,
  region          text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- VETS
CREATE TABLE IF NOT EXISTS public.vets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.users(id),
  vcnz_number     text UNIQUE NOT NULL,
  apc_expiry      date NOT NULL,
  full_name       text NOT NULL,
  practice_name   text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- DOGS
CREATE TABLE IF NOT EXISTS public.dogs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  breed           text NOT NULL,
  dob             date,
  sex             text CHECK (sex IN ('male', 'female')),
  desexed         boolean DEFAULT false,
  weight_kg       numeric(4,1),
  colour          text,
  microchip_no    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- INTAKE ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.intake_assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id          uuid REFERENCES public.dogs(id),
  owner_id        uuid REFERENCES public.users(id),
  form_data       jsonb NOT NULL DEFAULT '{}',
  video_url       text,
  ai_assessment   jsonb,
  ai_flags        text[],
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending','ai_complete','vet_review','approved','rejected','needs_physical')),
  vet_id          uuid REFERENCES public.vets(id),
  vet_notes       text,
  vet_approved_at timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- VOIS (Veterinary Operating Instructions)
CREATE TABLE IF NOT EXISTS public.vois (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id                    uuid REFERENCES public.dogs(id),
  owner_id                  uuid REFERENCES public.users(id),
  vet_id                    uuid REFERENCES public.vets(id),
  intake_id                 uuid REFERENCES public.intake_assessments(id),
  treatment_plan            jsonb NOT NULL DEFAULT '{}',
  authorised_person_name    text NOT NULL,
  authorised_person_dob     date,
  valid_from                date NOT NULL,
  valid_until               date NOT NULL,
  pdf_url                   text,
  status                    text DEFAULT 'active'
                            CHECK (status IN ('active','expired','revoked')),
  created_at                timestamptz DEFAULT now()
);

-- Add voi_id to intake_assessments
ALTER TABLE public.intake_assessments ADD COLUMN IF NOT EXISTS voi_id uuid REFERENCES public.vois(id);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              uuid REFERENCES public.users(id),
  dog_id                uuid REFERENCES public.dogs(id),
  voi_id                uuid REFERENCES public.vois(id),
  stripe_session_id     text UNIQUE,
  stripe_payment_intent text,
  line_items            jsonb NOT NULL DEFAULT '[]',
  subtotal_nzd          numeric(8,2),
  total_nzd             numeric(8,2),
  status                text DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  assist_requested      boolean DEFAULT false,
  assist_scheduled_at   timestamptz,
  delivery_address      jsonb NOT NULL DEFAULT '{}',
  tracking_number       text,
  courier               text,
  shipped_at            timestamptz,
  delivered_at          timestamptz,
  created_at            timestamptz DEFAULT now()
);

-- ORDER DOSES
CREATE TABLE IF NOT EXISTS public.order_doses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  dog_id            uuid REFERENCES public.dogs(id),
  product_code      text NOT NULL,
  product_name      text NOT NULL,
  dose_number       int NOT NULL,
  scheduled_date    date NOT NULL,
  shipped_at        timestamptz,
  tracking_number   text,
  status            text DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','shipped','delivered','administered','overdue')),
  administered_at   timestamptz,
  administered_by   text
);

-- REMINDERS
CREATE TABLE IF NOT EXISTS public.reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES public.users(id),
  dog_id          uuid REFERENCES public.dogs(id),
  order_dose_id   uuid REFERENCES public.order_doses(id),
  reminder_type   text CHECK (reminder_type IN ('sms','email')),
  scheduled_for   timestamptz NOT NULL,
  sent_at         timestamptz,
  status          text DEFAULT 'pending'
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON public.dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_intake_assessments_owner_id ON public.intake_assessments(owner_id);
CREATE INDEX IF NOT EXISTS idx_intake_assessments_dog_id ON public.intake_assessments(dog_id);
CREATE INDEX IF NOT EXISTS idx_intake_assessments_status ON public.intake_assessments(status);
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_doses_order_id ON public.order_doses(order_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_for ON public.reminders(scheduled_for);

-- ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_doses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own dogs" ON public.dogs
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own dogs" ON public.dogs
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own intakes" ON public.intake_assessments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own intakes" ON public.intake_assessments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view own VOIs" ON public.vois
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view own order doses" ON public.order_doses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.owner_id = auth.uid())
  );

CREATE POLICY "Vets are publicly viewable" ON public.vets
  FOR SELECT TO authenticated USING (true);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE BUCKETS (run separately or in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('dog-videos', 'dog-videos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('voi-documents', 'voi-documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);
