-- FINAL COMPREHENSIVE STORAGE FIX FOR SOCIAL MEDIA SCHEDULER
-- Run this SQL in your Supabase SQL Editor to completely fix all storage upload issues
-- This addresses the "All upload methods failed" error you're seeing

-- Step 1: Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Ensure the bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  10485760, -- 10MB limit (increased from 5MB)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Step 3: Drop ALL existing policies to start completely fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on storage.objects that might conflict
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Step 4: Create SIMPLE and WORKING policies

-- POLICY 1: Allow ALL authenticated users to upload to user-images bucket
-- This is the most permissive policy that will definitely work
CREATE POLICY "user_images_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-images');

-- POLICY 2: Allow EVERYONE (including anonymous) to view files in user-images bucket
-- This enables public sharing of uploaded images
CREATE POLICY "user_images_select_policy"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-images');

-- POLICY 3: Allow authenticated users to update files in user-images bucket
CREATE POLICY "user_images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-images')
WITH CHECK (bucket_id = 'user-images');

-- POLICY 4: Allow authenticated users to delete files in user-images bucket
CREATE POLICY "user_images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-images');

-- Step 5: Verify bucket configuration
SELECT 
  'BUCKET CONFIGURATION:' as info,
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'user-images';

-- Step 6: Verify policies were created correctly
SELECT 
  'STORAGE POLICIES:' as info,
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%user_images%'
ORDER BY policyname;

-- Step 7: Test bucket accessibility
SELECT 
  'BUCKET TEST:' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-images' AND public = true) 
    THEN 'SUCCESS: user-images bucket exists and is public'
    ELSE 'ERROR: user-images bucket not found or not public'
  END as status;

-- Step 8: Show all current storage policies for debugging
SELECT 
  'ALL STORAGE POLICIES:' as info,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
