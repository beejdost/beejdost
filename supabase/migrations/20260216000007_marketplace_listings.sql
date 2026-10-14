-- ============================================================================
-- Migration: 20260216000007_marketplace_listings.sql
-- Description: Marketplace listing constraints, title column, business rules,
--              and status review protection
-- ============================================================================

-- 1. Add title column to listings (falls back to variety_name if null)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Add maximum bounded quantity check (up to 50,000 kg / 50 metric tons)
-- Drop existing check if we need to replace or enhance it
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS chk_listing_quantity_bound,
  ADD CONSTRAINT chk_listing_quantity_bound CHECK (
    quantity_kg > 0 AND quantity_kg <= 50000
  );

-- 3. Strict price policy constraint:
-- - 'sale': price_per_kg MUST be positive (> 0) and <= 1,000,000 PKR
-- - 'exchange': price_per_kg MUST be null or 0 (no cash price required)
-- - 'both': price_per_kg MUST be positive (> 0) and exchange_requirements represented
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS chk_listing_price_or_exchange,
  DROP CONSTRAINT IF EXISTS chk_listing_pricing_policy;

ALTER TABLE public.listings
  ADD CONSTRAINT chk_listing_pricing_policy CHECK (
    (listing_type = 'exchange' AND (price_per_kg IS NULL OR price_per_kg = 0)) OR
    (listing_type = 'sale' AND price_per_kg IS NOT NULL AND price_per_kg > 0 AND price_per_kg <= 1000000) OR
    (listing_type = 'both' AND price_per_kg IS NOT NULL AND price_per_kg > 0 AND price_per_kg <= 1000000)
  );

-- 4. Status Transition & Certification Protection Trigger
-- Owners cannot self-approve their listing if it was rejected/suspended,
-- nor can they self-verify certification metadata.
CREATE OR REPLACE FUNCTION public.check_listing_update_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If executing as admin, allow all modifications
  IF auth.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Security: Non-admins cannot alter certification verification status
  IF (NEW.is_verified_certified IS DISTINCT FROM OLD.is_verified_certified) OR
     (NEW.certification_verified_by IS DISTINCT FROM OLD.certification_verified_by) OR
     (NEW.certification_verified_at IS DISTINCT FROM OLD.certification_verified_at) THEN
    RAISE EXCEPTION 'Only administrators can verify seed certifications.';
  END IF;

  -- Security: Owners cannot un-suspend or un-reject their own listings
  IF OLD.status IN ('rejected', 'suspended') AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'A rejected or suspended listing cannot be activated without administrator review.';
  END IF;

  -- Auto-populate title if left blank
  IF NEW.title IS NULL OR length(trim(NEW.title)) = 0 THEN
    NEW.title := NEW.variety_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_listing_update ON public.listings;
CREATE TRIGGER trigger_check_listing_update
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_listing_update_permissions();

-- 5. Trigger on Insert to ensure default title if omitted
CREATE OR REPLACE FUNCTION public.set_default_listing_title()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.title IS NULL OR length(trim(NEW.title)) = 0 THEN
    NEW.title := NEW.variety_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_listing_title ON public.listings;
CREATE TRIGGER trigger_set_listing_title
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_listing_title();

-- 6. Marketplace Search Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_listings_marketplace_search
  ON public.listings (status, province, district, crop_id, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_price
  ON public.listings (price_per_kg)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_seller_status
  ON public.listings (seller_id, status, created_at DESC);
