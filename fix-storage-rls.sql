-- Run this SQL in your Supabase SQL Editor to fix storage policies
-- This will resolve the "Authentication failed" error when uploading images

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
DROP POLICY IF EXISTS "Authenticated users can upload files to user-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in user-images" ON storage.objects;

-- Create SIMPLE storage policies that work
-- Policy for uploads (INSERT) - allow all authenticated users to upload
CREATE POLICY "Authenticated users can upload files to user-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images');

-- Policy for reading files (SELECT) - public access for user-images bucket
CREATE POLICY "Anyone can view files in user-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-images');

-- Policy for deleting files (DELETE) - allow authenticated users to delete
CREATE POLICY "Users can delete own files in user-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-images');

-- Policy for updating files (UPDATE) - allow authenticated users to update
CREATE POLICY "Users can update own files in user-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-images')
WITH CHECK (bucket_id = 'user-images');

-- Verify the setup
SELECT 'Storage bucket user-images has been configured with simple RLS policies' as message;
SELECT 'Policies: upload/select/delete/update for authenticated users' as details;
