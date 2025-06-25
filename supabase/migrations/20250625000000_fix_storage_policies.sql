-- Fix storage bucket policies for user-images
-- This migration ensures proper access to the user-images bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop ALL existing policies for user-images bucket to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;
DROP POLICY IF EXISTS "user_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "user_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "user_images_delete_policy" ON storage.objects;

-- Create correct storage policies based on best practices
-- Policy for uploads (INSERT) - users can upload to their own folder
CREATE POLICY "Authenticated users can upload files to user-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for reading files (SELECT) - public access for user-images bucket
CREATE POLICY "Anyone can view files in user-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-images');

-- Policy for deleting files (DELETE) - users can delete their own files
CREATE POLICY "Users can delete own files in user-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for updating files (UPDATE) - users can update their own files
CREATE POLICY "Users can update own files in user-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated, service_role;
GRANT ALL ON storage.buckets TO authenticated, service_role;

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Storage bucket user-images has been configured with proper RLS policies';
  RAISE NOTICE 'Policies: upload (authenticated users to own folder), select (public), delete/update (own files only)';
END $$;
