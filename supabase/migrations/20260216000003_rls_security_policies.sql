-- ============================================================================
-- Migration: 20260216000003_rls_security_policies.sql
-- Description: Enable Row Level Security (RLS) on all exposed application tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on all 10 tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- Privacy: Full profile with phone/private data is accessible ONLY to the owner
-- or platform admins. Public profile data is accessed via public_profiles view.
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_select_owner_or_admin"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id OR auth.is_admin()
  );

CREATE POLICY "profiles_insert_own_profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id AND NOT is_suspended AND NOT is_verified_keeper
  );

CREATE POLICY "profiles_update_owner_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id OR auth.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR auth.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 2. CROPS POLICIES
-- Public can read approved crops. Only admins can insert/update/delete.
-- ----------------------------------------------------------------------------
CREATE POLICY "crops_select_public_approved"
  ON public.crops
  FOR SELECT
  USING (
    is_approved = TRUE OR auth.is_admin()
  );

CREATE POLICY "crops_insert_admin_only"
  ON public.crops
  FOR INSERT
  WITH CHECK (
    auth.is_admin()
  );

CREATE POLICY "crops_update_admin_only"
  ON public.crops
  FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "crops_delete_admin_only"
  ON public.crops
  FOR DELETE
  USING (auth.is_admin());

-- ----------------------------------------------------------------------------
-- 3. LISTINGS POLICIES
-- Anonymous & public: active listings only.
-- Sellers: manage their own listings (if not suspended).
-- Admins: full oversight.
-- ----------------------------------------------------------------------------
CREATE POLICY "listings_select_active_or_owner_or_admin"
  ON public.listings
  FOR SELECT
  USING (
    (status = 'active' AND NOT public.is_user_suspended(seller_id))
    OR auth.uid() = seller_id
    OR auth.is_admin()
  );

CREATE POLICY "listings_insert_owner"
  ON public.listings
  FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND NOT public.is_current_user_suspended()
    AND NOT is_verified_certified
  );

CREATE POLICY "listings_update_owner_or_admin"
  ON public.listings
  FOR UPDATE
  USING (
    (auth.uid() = seller_id AND NOT public.is_current_user_suspended())
    OR auth.is_admin()
  )
  WITH CHECK (
    (auth.uid() = seller_id AND NOT public.is_current_user_suspended())
    OR auth.is_admin()
  );

CREATE POLICY "listings_delete_owner_or_admin"
  ON public.listings
  FOR DELETE
  USING (
    (auth.uid() = seller_id AND NOT public.is_current_user_suspended())
    OR auth.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 4. LISTING IMAGES POLICIES
-- Public can view images for visible listings.
-- Sellers can insert/delete images for their own active listings.
-- ----------------------------------------------------------------------------
CREATE POLICY "listing_images_select"
  ON public.listing_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND (
          (l.status = 'active' AND NOT public.is_user_suspended(l.seller_id))
          OR l.seller_id = auth.uid()
          OR auth.is_admin()
        )
    )
  );

CREATE POLICY "listing_images_insert_owner"
  ON public.listing_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.seller_id = auth.uid()
        AND NOT public.is_current_user_suspended()
    )
  );

CREATE POLICY "listing_images_delete_owner_or_admin"
  ON public.listing_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND (
          (l.seller_id = auth.uid() AND NOT public.is_current_user_suspended())
          OR auth.is_admin()
        )
    )
  );

-- ----------------------------------------------------------------------------
-- 5. CONVERSATIONS POLICIES
-- Accessible only to conversation members or administrators.
-- ----------------------------------------------------------------------------
CREATE POLICY "conversations_select_members_or_admin"
  ON public.conversations
  FOR SELECT
  USING (
    public.is_conversation_member(conversations.id, auth.uid())
    OR auth.is_admin()
  );

-- Creation is handled via the start_conversation() RPC. Direct inserts require valid ownership.
CREATE POLICY "conversations_insert_authenticated"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND NOT public.is_current_user_suspended()
  );

-- ----------------------------------------------------------------------------
-- 6. CONVERSATION MEMBERS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "conversation_members_select_participants"
  ON public.conversation_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_conversation_member(conversation_id, auth.uid())
    OR auth.is_admin()
  );

CREATE POLICY "conversation_members_insert_members_or_admin"
  ON public.conversation_members
  FOR INSERT
  WITH CHECK (
    auth.is_admin()
    OR (
      NOT public.is_current_user_suspended()
      AND (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.listings l
          JOIN public.conversations c ON c.listing_id = l.id
          WHERE c.id = conversation_members.conversation_id
            AND l.seller_id = conversation_members.user_id
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- 7. MESSAGES POLICIES
-- Accessible strictly to verified conversation members or platform admins.
-- ----------------------------------------------------------------------------
CREATE POLICY "messages_select_members_or_admin"
  ON public.messages
  FOR SELECT
  USING (
    public.is_conversation_member(messages.conversation_id, auth.uid())
    OR auth.is_admin()
  );

CREATE POLICY "messages_insert_sender"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.is_current_user_suspended()
    AND public.is_conversation_member(messages.conversation_id, auth.uid())
  );

CREATE POLICY "messages_update_admin_only"
  ON public.messages
  FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "messages_delete_admin_only"
  ON public.messages
  FOR DELETE
  USING (auth.is_admin());

-- ----------------------------------------------------------------------------
-- 8. FAVORITES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "favorites_select_owner_or_admin"
  ON public.favorites
  FOR SELECT
  USING (
    auth.uid() = user_id OR auth.is_admin()
  );

CREATE POLICY "favorites_insert_owner"
  ON public.favorites
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND NOT public.is_current_user_suspended()
  );

CREATE POLICY "favorites_delete_owner_or_admin"
  ON public.favorites
  FOR DELETE
  USING (
    auth.uid() = user_id OR auth.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 9. REPORTS POLICIES
-- Reporter identity is hidden from unrelated users. Only reporter and admin can view.
-- ----------------------------------------------------------------------------
CREATE POLICY "reports_select_reporter_or_admin"
  ON public.reports
  FOR SELECT
  USING (
    auth.uid() = reporter_id OR auth.is_admin()
  );

CREATE POLICY "reports_insert_reporter"
  ON public.reports
  FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id AND NOT public.is_current_user_suspended()
  );

CREATE POLICY "reports_update_admin_only"
  ON public.reports
  FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "reports_delete_admin_only"
  ON public.reports
  FOR DELETE
  USING (auth.is_admin());

-- ----------------------------------------------------------------------------
-- 10. MODERATION ACTIONS POLICIES
-- Strictly restricted to administrators.
-- ----------------------------------------------------------------------------
CREATE POLICY "moderation_actions_select_admin_only"
  ON public.moderation_actions
  FOR SELECT
  USING (auth.is_admin());

CREATE POLICY "moderation_actions_insert_admin_only"
  ON public.moderation_actions
  FOR INSERT
  WITH CHECK (
    auth.is_admin() AND auth.uid() = admin_id
  );

CREATE POLICY "moderation_actions_modify_admin_only"
  ON public.moderation_actions
  FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());
