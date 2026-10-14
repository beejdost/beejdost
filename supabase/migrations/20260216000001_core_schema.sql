-- ============================================================================
-- Migration: 20260216000001_core_schema.sql
-- Description: Core schema for Beej Dost - Pakistan Agricultural Seed Exchange
-- ============================================================================

-- Ensure gen_random_uuid is available (built-in in PostgreSQL 13+, fallback to pgcrypto if present)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN
  NULL; -- gen_random_uuid() is standard built-in in modern PostgreSQL
END $$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Maps to auth.users.id
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) >= 2),
  avatar_url TEXT,
  phone TEXT CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-]{10,16}$'),
  province TEXT NOT NULL CHECK (province IN (
    'punjab', 'sindh', 'khyberPakhtunkhwa', 'balochistan',
    'gilgitBaltistan', 'azadKashmir', 'islamabad'
  )),
  district TEXT NOT NULL CHECK (length(trim(district)) >= 2),
  tehsil TEXT,
  farming_type TEXT NOT NULL DEFAULT 'conventional' CHECK (
    farming_type IN ('organic', 'conventional', 'seedSaver', 'researcher')
  ),
  is_verified_keeper BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. CROPS (Localized in English, Urdu, and Shahmukhi Punjabi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9\-]+$'),
  name_en TEXT NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ur TEXT NOT NULL CHECK (length(trim(name_ur)) > 0),
  name_pa TEXT NOT NULL CHECK (length(trim(name_pa)) > 0),
  category TEXT NOT NULL CHECK (category IN (
    'cereal', 'pulses', 'cotton', 'oilseeds', 'vegetables', 'fodder', 'fruits', 'herbs'
  )),
  scientific_name TEXT,
  description_en TEXT,
  description_ur TEXT,
  description_pa TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. LISTINGS (Agricultural Seed Lots)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
  variety_name TEXT NOT NULL CHECK (length(trim(variety_name)) >= 2),
  variety_type TEXT NOT NULL CHECK (variety_type IN ('heirloom', 'hybrid', 'opv', 'organic', 'desi')),
  seed_condition TEXT NOT NULL CHECK (seed_condition IN ('raw', 'cleaned', 'treated', 'graded', 'sun_dried')),
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'exchange', 'both')),
  quantity_kg NUMERIC(10, 2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg NUMERIC(10, 2) CHECK (price_per_kg IS NULL OR price_per_kg >= 0),
  exchange_requirements TEXT,
  germination_rate_pct NUMERIC(5, 2) CHECK (germination_rate_pct IS NULL OR (germination_rate_pct >= 0 AND germination_rate_pct <= 100)),
  harvest_year INTEGER NOT NULL CHECK (harvest_year BETWEEN 2000 AND 2100),
  province TEXT NOT NULL CHECK (province IN (
    'punjab', 'sindh', 'khyberPakhtunkhwa', 'balochistan',
    'gilgitBaltistan', 'azadKashmir', 'islamabad'
  )),
  district TEXT NOT NULL CHECK (length(trim(district)) >= 2),
  tehsil TEXT,
  village_or_area TEXT,
  description TEXT NOT NULL CHECK (length(trim(description)) >= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('draft', 'pending_approval', 'active', 'sold', 'archived', 'rejected', 'suspended')
  ),

  -- Explicit Certification Verification Metadata
  claimed_certified BOOLEAN NOT NULL DEFAULT FALSE,
  certification_details TEXT,
  is_verified_certified BOOLEAN NOT NULL DEFAULT FALSE,
  certification_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  certification_verified_at TIMESTAMPTZ,
  certification_review_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Listing type price/exchange validity constraint
  CONSTRAINT chk_listing_price_or_exchange CHECK (
    (listing_type = 'exchange') OR
    (listing_type IN ('sale', 'both') AND price_per_kg IS NOT NULL AND price_per_kg >= 0)
  )
);

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. LISTING IMAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL CHECK (length(trim(storage_path)) > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. CONVERSATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. CONVERSATION MEMBERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 7. MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. FAVORITES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

-- ----------------------------------------------------------------------------
-- 9. REPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'fraud', 'misleading_seed_claim', 'counterfeit', 'harassment', 'prohibited_variety', 'other'
  )),
  details TEXT NOT NULL CHECK (length(trim(details)) >= 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. MODERATION ACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'suspend_user', 'unsuspend_user', 'approve_listing', 'reject_listing',
    'suspend_listing', 'verify_seed_keeper', 'verify_certification',
    'resolve_report', 'dismiss_report'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'listing', 'report', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (length(trim(reason)) >= 3),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PERFORMANCE & LOOKUP INDEXES
-- ============================================================================
-- Listings search and filter indexes
CREATE INDEX IF NOT EXISTS idx_listings_search
  ON public.listings(status, crop_id, province, district);

CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON public.listings(seller_id);

CREATE INDEX IF NOT EXISTS idx_listings_created_at
  ON public.listings(created_at DESC);

-- Conversation and messaging indexes
CREATE INDEX IF NOT EXISTS idx_conversation_members_user
  ON public.conversation_members(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_listing
  ON public.conversations(listing_id);

CREATE INDEX IF NOT EXISTS idx_messages_pagination
  ON public.messages(conversation_id, created_at DESC);

-- Favorites lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user
  ON public.favorites(user_id);

-- Reports lookups
CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports(status, created_at DESC);

-- Moderation actions audit log
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target
  ON public.moderation_actions(target_type, target_id, created_at DESC);
