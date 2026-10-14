-- ============================================================================
-- Migration: 20260216000006_auth_and_profiles.sql
-- Description: Auth triggers, profile synchronization, and field enhancements
-- ============================================================================

-- 1. Add preferred_language and village to profiles if not already present
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'ur', 'pa')),
  ADD COLUMN IF NOT EXISTS village TEXT;

-- 2. Update public_profiles view to include preferred_language and village
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  province,
  district,
  tehsil,
  village,
  farming_type,
  preferred_language,
  is_verified_keeper,
  bio,
  created_at
FROM public.profiles
WHERE NOT is_suspended;

-- 3. Automatic Profile Creation Trigger on Supabase Auth SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_full_name TEXT;
  v_province TEXT;
  v_district TEXT;
  v_tehsil TEXT;
  v_village TEXT;
  v_phone TEXT;
  v_preferred_language TEXT;
  v_farming_type TEXT;
BEGIN
  -- Extract user metadata supplied during registration
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  v_province := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'province'), ''),
    'punjab'
  );

  v_district := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'district'), ''),
    'Lahore'
  );

  v_tehsil := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'tehsil'), '');
  v_village := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'village'), '');
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), '');

  v_preferred_language := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'preferred_language'), ''),
    'en'
  );

  v_farming_type := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'farming_type'), ''),
    'conventional'
  );

  -- Validate province enum fallback
  IF v_province NOT IN (
    'punjab', 'sindh', 'khyberPakhtunkhwa', 'balochistan',
    'gilgitBaltistan', 'azadKashmir', 'islamabad'
  ) THEN
    v_province := 'punjab';
  END IF;

  -- Validate language fallback
  IF v_preferred_language NOT IN ('en', 'ur', 'pa') THEN
    v_preferred_language := 'en';
  END IF;

  -- Validate farming type fallback
  IF v_farming_type NOT IN ('organic', 'conventional', 'seedSaver', 'researcher') THEN
    v_farming_type := 'conventional';
  END IF;

  -- Insert profile row
  INSERT INTO public.profiles (
    id,
    full_name,
    province,
    district,
    tehsil,
    village,
    phone,
    preferred_language,
    farming_type,
    is_verified_keeper,
    is_suspended,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    v_province,
    v_district,
    v_tehsil,
    v_village,
    v_phone,
    v_preferred_language,
    v_farming_type,
    FALSE, -- Security: NEVER trust client for verified keeper
    FALSE, -- Security: Not suspended by default
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    province = EXCLUDED.province,
    district = EXCLUDED.district,
    preferred_language = EXCLUDED.preferred_language,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Note: In managed Supabase, this trigger binds to auth.users.
-- Guarded with conditional execution for environments where auth.users exists.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
