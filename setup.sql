-- ============================================================
-- RESERVATION SYSTEM - Complete Database Setup
-- Run this entire file in Supabase SQL Editor (in order)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'student'
                           CHECK (role IN ('student', 'teacher', 'admin')),
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a new user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data ->> 'role',
      'student'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: resources  (classrooms & equipment)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL
                          CHECK (type IN ('classroom', 'laptop', 'projector', 'camera', 'other')),
  description TEXT,
  location    TEXT,
  quantity    INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  resource_id UUID        NOT NULL REFERENCES public.resources(id)  ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index for fast overlap queries
CREATE INDEX IF NOT EXISTS idx_reservations_resource_time
  ON public.reservations (resource_id, start_time, end_time)
  WHERE status = 'active';

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
-- Any authenticated user can read all profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert only their own profile (trigger uses SECURITY DEFINER so this
-- policy covers manual inserts as a safety net)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update only their own profile; admins can update any
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- ---------- resources ----------
-- All authenticated users can read
DROP POLICY IF EXISTS "resources_select" ON public.resources;
CREATE POLICY "resources_select" ON public.resources
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert / update / delete
DROP POLICY IF EXISTS "resources_insert" ON public.resources;
CREATE POLICY "resources_insert" ON public.resources
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "resources_update" ON public.resources;
CREATE POLICY "resources_update" ON public.resources
  FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "resources_delete" ON public.resources;
CREATE POLICY "resources_delete" ON public.resources
  FOR DELETE
  USING (public.is_admin());

-- ---------- reservations ----------
-- All authenticated users can see all reservations (needed to detect conflicts)
DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
CREATE POLICY "reservations_select" ON public.reservations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create reservations only for themselves
DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
CREATE POLICY "reservations_insert" ON public.reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel/update their own; admins can update any
DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
CREATE POLICY "reservations_update" ON public.reservations
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

-- Users can delete their own; admins can delete any
DROP POLICY IF EXISTS "reservations_delete" ON public.reservations;
CREATE POLICY "reservations_delete" ON public.reservations
  FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ============================================================
-- SAMPLE DATA  (optional — remove before production)
-- ============================================================
INSERT INTO public.resources (name, type, description, location, quantity)
VALUES
  ('Učebna A101',              'classroom', 'Velká přednášková učebna s projektorem, kapacita 30 osob.',     'Budova A, 1. patro',   1),
  ('Učebna B205',              'classroom', 'Počítačová učebna, 20 pracovních stanic, klimatizace.',        'Budova B, 2. patro',   1),
  ('Notebook Dell Latitude',   'laptop',    'Dell Latitude 5520, Intel i7 11. gen, 16 GB RAM, SSD 512 GB.', 'Sklad č. 1',           5),
  ('Projektor Epson EB-X41',   'projector', 'Full HD projektor 3600 lm, HDMI/VGA, dálkové ovládání.',       'Sklad č. 1',           3),
  ('Kamera Canon EOS M50',     'camera',    'Bezzrcadlový fotoaparát 24 Mpx, 4K video, výměnné objektivy.', 'Sklad č. 2',           2),
  ('Učebna C310',              'classroom', 'Seminarní místnost, kulatý stůl, kapacita 12 osob.',           'Budova C, 3. patro',   1),
  ('Notebook HP EliteBook',    'laptop',    'HP EliteBook 840, Intel i5, 8 GB RAM, Business třída.',        'Sklad č. 1',           3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- HOW TO CREATE THE FIRST ADMIN USER
-- After registering via the app, run:
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
