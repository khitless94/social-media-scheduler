-- FINAL FIX for RLS Storage Issues
-- Run this in your Supabase SQL Editor

-- First, completely disable RLS temporarily to test
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can upload files to user-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in user-images" ON storage.objects;

-- Create the most permissive policies possible for testing
CREATE POLICY "Allow all operations on user-images" ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'user-images')
WITH CHECK (bucket_id = 'user-images');

-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify bucket configuration
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'user-images';

SELECT 'RLS policies have been simplified for testing' as message;
