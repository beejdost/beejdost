-- ============================================================================
-- Migration: 20260216000004_storage_policies.sql
-- Description: Supabase Storage configuration and secure access policies
-- ============================================================================

-- Create storage schema and objects table if not already present
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  public BOOLEAN DEFAULT FALSE,
  avif_autodetection BOOLEAN DEFAULT FALSE,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT,
  owner UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB,
  path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Create Storage Buckets
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'listing-images',
    'listing-images',
    TRUE,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    TRUE,
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'private-docs',
    'private-docs',
    FALSE, -- Private: FSC&RD certification verification certificates
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- Storage Policies for listing-images
-- Path structure: <user_id>/<listing_id>/<filename>
-- ----------------------------------------------------------------------------
CREATE POLICY "storage_listing_images_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "storage_listing_images_owner_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.objects.path_tokens)[1]
    AND NOT public.is_current_user_suspended()
  );

CREATE POLICY "storage_listing_images_owner_or_admin_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND (
      auth.uid()::text = (storage.objects.path_tokens)[1]
      OR auth.is_admin()
    )
  );

CREATE POLICY "storage_listing_images_owner_or_admin_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND (
      auth.uid()::text = (storage.objects.path_tokens)[1]
      OR auth.is_admin()
    )
  );

-- ----------------------------------------------------------------------------
-- Storage Policies for avatars
-- Path structure: <user_id>/avatar.<ext>
-- ----------------------------------------------------------------------------
CREATE POLICY "storage_avatars_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "storage_avatars_owner_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.objects.path_tokens)[1]
    AND NOT public.is_current_user_suspended()
  );

CREATE POLICY "storage_avatars_owner_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid()::text = (storage.objects.path_tokens)[1]
      OR auth.is_admin()
    )
  );

-- ----------------------------------------------------------------------------
-- Storage Policies for private-docs (Certification Proofs)
-- Private bucket: only owner and administrators can access.
-- ----------------------------------------------------------------------------
CREATE POLICY "storage_private_docs_read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'private-docs'
    AND (
      auth.uid()::text = (storage.objects.path_tokens)[1]
      OR auth.is_admin()
    )
  );

CREATE POLICY "storage_private_docs_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'private-docs'
    AND auth.uid()::text = (storage.objects.path_tokens)[1]
    AND NOT public.is_current_user_suspended()
  );
