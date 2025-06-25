-- Supabase Storage Setup for Image Functionality
-- Run this in your Supabase SQL Editor to set up the storage bucket and policies

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to user images" ON storage.objects;

-- Create the user-images storage bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-images'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to view their own images
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-images'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-images'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow public access to images (for social media posting)
CREATE POLICY "Public access to user images" ON storage.objects
FOR SELECT USING (bucket_id = 'user-images');

-- Verify the setup
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-images';

-- Show existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%user%images%';
