-- Normalized newborn tracker schema
-- One admin per baby; caregivers share care data; RLS by membership.
-- Run in Supabase SQL Editor (Dashboard → SQL).

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Profiles (1:1 with auth.users) ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  email         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- Babies + membership (exactly one admin per baby) ----------
CREATE TABLE IF NOT EXISTS public.babies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  birth_date    date NOT NULL,
  invite_code   text NOT NULL UNIQUE,
  created_by    uuid NOT NULL REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS babies_invite_code_idx ON public.babies (lower(invite_code));

CREATE TABLE IF NOT EXISTS public.baby_members (
  baby_id     uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('admin', 'caregiver')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (baby_id, user_id)
);

CREATE INDEX IF NOT EXISTS baby_members_user_id_idx ON public.baby_members (user_id);

-- Enforce at most one admin per baby
CREATE UNIQUE INDEX IF NOT EXISTS baby_members_one_admin_idx
  ON public.baby_members (baby_id)
  WHERE role = 'admin';

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id            uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme              text NOT NULL DEFAULT 'system',
  bottle_unit        text NOT NULL DEFAULT 'oz',
  temperature_unit   text NOT NULL DEFAULT 'F',
  weight_unit        text NOT NULL DEFAULT 'lb_oz',
  length_unit        text NOT NULL DEFAULT 'in',
  head_unit          text NOT NULL DEFAULT 'in',
  active_baby_id     uuid REFERENCES public.babies(id) ON DELETE SET NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------- Shared care tables ----------
CREATE TABLE IF NOT EXISTS public.feeding_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id                 uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by              uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  feed_type               text NOT NULL CHECK (feed_type IN ('nursing', 'bottle')),
  start_time              timestamptz NOT NULL,
  end_time                timestamptz,
  left_duration_seconds   integer,
  right_duration_seconds  integer,
  total_duration_seconds  integer,
  last_active_side        text,
  volume_ml               numeric,
  bottle_type             text,
  note                    text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feeding_events_baby_time_idx
  ON public.feeding_events (baby_id, start_time DESC);

CREATE TABLE IF NOT EXISTS public.diaper_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id             uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  timestamp           timestamptz NOT NULL,
  has_pee             boolean NOT NULL DEFAULT false,
  pee_color           text,
  has_poop            boolean NOT NULL DEFAULT false,
  poop_consistency    text,
  poop_color          text,
  alert_acknowledged  boolean,
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diaper_events_baby_time_idx
  ON public.diaper_events (baby_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS public.sleep_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id           uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_time        timestamptz NOT NULL,
  end_time          timestamptz NOT NULL,
  duration_seconds  integer NOT NULL,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sleep_events_baby_time_idx
  ON public.sleep_events (baby_id, start_time DESC);

CREATE TABLE IF NOT EXISTS public.temperature_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id              uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  timestamp            timestamptz NOT NULL,
  temperature_celsius  numeric NOT NULL,
  alert_acknowledged   boolean,
  note                 text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS temperature_events_baby_time_idx
  ON public.temperature_events (baby_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS public.appointments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id                uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by             uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title                  text NOT NULL,
  provider_name          text NOT NULL DEFAULT '',
  date_time              timestamptz NOT NULL,
  location               text,
  questions              text[] NOT NULL DEFAULT '{}',
  provider_instructions  text,
  is_completed           boolean NOT NULL DEFAULT false,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.growth_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id                 uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by              uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  timestamp               timestamptz NOT NULL,
  weight_grams            numeric,
  length_cm               numeric,
  head_circumference_cm   numeric,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id     uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  timestamp   timestamptz NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  title       text NOT NULL,
  details     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.baby_active_timers (
  baby_id   uuid PRIMARY KEY REFERENCES public.babies(id) ON DELETE CASCADE,
  nursing   jsonb,
  sleep     jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ---------- Helper: is member / is admin ----------
CREATE OR REPLACE FUNCTION public.is_baby_member(p_baby_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.baby_members
    WHERE baby_id = p_baby_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_baby_admin(p_baby_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.baby_members
    WHERE baby_id = p_baby_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------- RPCs ----------
CREATE OR REPLACE FUNCTION public.create_baby(p_name text, p_birth_date date)
RETURNS public.babies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_baby public.babies;
  v_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_code := lower('baby-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.babies (name, birth_date, invite_code, created_by)
  VALUES (trim(p_name), p_birth_date, v_code, auth.uid())
  RETURNING * INTO v_baby;

  INSERT INTO public.baby_members (baby_id, user_id, role)
  VALUES (v_baby.id, auth.uid(), 'admin');

  INSERT INTO public.baby_active_timers (baby_id) VALUES (v_baby.id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_settings (user_id, active_baby_id)
  VALUES (auth.uid(), v_baby.id)
  ON CONFLICT (user_id) DO UPDATE SET active_baby_id = EXCLUDED.active_baby_id, updated_at = now();

  RETURN v_baby;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_baby_by_invite_code(p_code text)
RETURNS public.babies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_baby public.babies;
  v_clean text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_clean := lower(trim(p_code));
  SELECT * INTO v_baby FROM public.babies WHERE lower(invite_code) = v_clean;
  IF v_baby.id IS NULL THEN
    RAISE EXCEPTION 'Invalid family code';
  END IF;

  INSERT INTO public.baby_members (baby_id, user_id, role)
  VALUES (v_baby.id, auth.uid(), 'caregiver')
  ON CONFLICT (baby_id, user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id, active_baby_id)
  VALUES (auth.uid(), v_baby.id)
  ON CONFLICT (user_id) DO UPDATE SET active_baby_id = EXCLUDED.active_baby_id, updated_at = now();

  RETURN v_baby;
END;
$$;

-- ---------- RLS ----------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diaper_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_active_timers ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.baby_members me
    JOIN public.baby_members them ON me.baby_id = them.baby_id
    WHERE me.user_id = auth.uid() AND them.user_id = profiles.id
  ));
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid());

-- User settings
DROP POLICY IF EXISTS user_settings_all_own ON public.user_settings;
CREATE POLICY user_settings_all_own ON public.user_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Babies
DROP POLICY IF EXISTS babies_select_member ON public.babies;
CREATE POLICY babies_select_member ON public.babies FOR SELECT USING (public.is_baby_member(id));
DROP POLICY IF EXISTS babies_update_admin ON public.babies;
CREATE POLICY babies_update_admin ON public.babies FOR UPDATE USING (public.is_baby_admin(id));

-- Members
DROP POLICY IF EXISTS baby_members_select ON public.baby_members;
CREATE POLICY baby_members_select ON public.baby_members FOR SELECT USING (public.is_baby_member(baby_id));
DROP POLICY IF EXISTS baby_members_delete_admin ON public.baby_members;
CREATE POLICY baby_members_delete_admin ON public.baby_members FOR DELETE USING (public.is_baby_admin(baby_id));

-- Care tables: members CRUD
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'feeding_events','diaper_events','sleep_events','temperature_events',
    'appointments','growth_records','health_notes','baby_active_timers'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_member_all ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_member_all ON public.%I FOR ALL USING (public.is_baby_member(baby_id)) WITH CHECK (public.is_baby_member(baby_id))',
      t, t
    );
  END LOOP;
END $$;

-- Keep legacy blob table if present (for import); do not drop.
-- GRANT execute on RPCs
GRANT EXECUTE ON FUNCTION public.create_baby(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_baby_by_invite_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_baby_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_baby_admin(uuid) TO authenticated;
