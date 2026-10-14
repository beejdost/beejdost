-- ============================================================================
-- Migration: 20260216000002_functions_and_rpc.sql
-- Description: Security functions, atomic RPCs, and privilege escalation guards
-- ============================================================================

-- Create auth schema if not existing (for local/testing compatibility)
CREATE SCHEMA IF NOT EXISTS auth;

-- ----------------------------------------------------------------------------
-- 1. Helper: auth.uid() fallback for test/local environments
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_sub TEXT;
  v_claims TEXT;
BEGIN
  v_sub := current_setting('request.jwt.claim.sub', true);
  IF v_sub IS NOT NULL AND v_sub <> '' THEN
    RETURN v_sub::uuid;
  END IF;

  v_claims := current_setting('request.jwt.claims', true);
  IF v_claims IS NOT NULL AND v_claims <> '' THEN
    RETURN (v_claims::jsonb ->> 'sub')::uuid;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Helper: auth.is_admin()
-- Verified strictly through Supabase Auth app_metadata (never user_metadata)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_claims TEXT;
BEGIN
  v_claims := current_setting('request.jwt.claims', true);
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN FALSE;
  END IF;

  RETURN COALESCE(
    (v_claims::jsonb -> 'app_metadata' ->> 'role') = 'admin'
    OR
    (v_claims::jsonb -> 'app_metadata' ->> 'is_admin')::boolean = true,
    false
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Helper: Suspension & Conversation Membership Checks
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_suspended FROM public.profiles WHERE id = p_user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_suspended()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_user_suspended(auth.uid());
$$;

-- Security definer check to prevent RLS recursion on conversation_members
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. Guard: Prevent Privilege Escalation in Profiles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Prevent changing primary key id
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Cannot modify profile id' USING ERRCODE = '42501';
  END IF;

  -- Only administrators can modify is_verified_keeper or is_suspended
  IF (NEW.is_verified_keeper IS DISTINCT FROM OLD.is_verified_keeper) OR
     (NEW.is_suspended IS DISTINCT FROM OLD.is_suspended) THEN
    IF NOT auth.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can modify verification or suspension status'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- ----------------------------------------------------------------------------
-- 5. Guard: Prevent Unauthorized Listing Certification or Modification
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_listing_certification_and_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Suspended sellers cannot modify listings
  IF public.is_user_suspended(OLD.seller_id) THEN
    RAISE EXCEPTION 'Suspended accounts cannot update listings' USING ERRCODE = '42501';
  END IF;

  -- Only administrators can verify certification
  IF (NEW.is_verified_certified IS DISTINCT FROM OLD.is_verified_certified) OR
     (NEW.certification_verified_by IS DISTINCT FROM OLD.certification_verified_by) OR
     (NEW.certification_verified_at IS DISTINCT FROM OLD.certification_verified_at) OR
     (NEW.certification_review_notes IS DISTINCT FROM OLD.certification_review_notes) THEN
    IF NOT auth.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can verify seed certification'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- If listing was suspended by admin, only admin can reactivate it
  IF OLD.status = 'suspended' AND NEW.status <> 'suspended' THEN
    IF NOT auth.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can reactivate suspended listings'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_listing_certification
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_listing_certification_and_status();

-- ----------------------------------------------------------------------------
-- 6. Atomic RPC: Start Conversation (Prevents Seller Impersonation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_conversation(p_listing_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_seller_id UUID;
  v_buyer_id UUID := auth.uid();
  v_conv_id UUID;
  v_listing_status TEXT;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to start a conversation' USING ERRCODE = '42501';
  END IF;

  IF public.is_user_suspended(v_buyer_id) THEN
    RAISE EXCEPTION 'Suspended users cannot initiate conversations' USING ERRCODE = '42501';
  END IF;

  -- Fetch listing details
  SELECT seller_id, status INTO v_seller_id, v_listing_status
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing_status NOT IN ('active', 'pending_approval') THEN
    RAISE EXCEPTION 'Listing is not open for inquiry';
  END IF;

  IF v_seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'Cannot start a conversation on your own listing';
  END IF;

  -- Return existing conversation if buyer already initiated one for this listing
  SELECT c.id INTO v_conv_id
  FROM public.conversations c
  JOIN public.conversation_members cm ON cm.conversation_id = c.id
  WHERE c.listing_id = p_listing_id
    AND cm.user_id = v_buyer_id
    AND cm.role = 'buyer'
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN v_conv_id;
  END IF;

  -- Create fresh conversation
  INSERT INTO public.conversations (listing_id, created_by)
  VALUES (p_listing_id, v_buyer_id)
  RETURNING id INTO v_conv_id;

  -- Associate genuine seller and genuine buyer
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES (v_conv_id, v_seller_id, 'seller');

  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES (v_conv_id, v_buyer_id, 'buyer');

  RETURN v_conv_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Atomic RPC: Send Message
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id UUID, p_content TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_msg_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to send message' USING ERRCODE = '42501';
  END IF;

  IF public.is_user_suspended(v_caller_id) THEN
    RAISE EXCEPTION 'Suspended users cannot send messages' USING ERRCODE = '42501';
  END IF;

  -- Verify membership using security definer check
  IF NOT public.is_conversation_member(p_conversation_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied: caller is not a member of this conversation'
      USING ERRCODE = '42501';
  END IF;

  IF length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;

  -- Insert message
  INSERT INTO public.messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, v_caller_id, p_content)
  RETURNING id INTO v_msg_id;

  -- Touch conversation updated_at
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_msg_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. Public Profiles Secure View (Shields phone and private account data)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  full_name,
  avatar_url,
  province,
  district,
  tehsil,
  farming_type,
  is_verified_keeper,
  bio,
  created_at
FROM public.profiles
WHERE NOT is_suspended;
