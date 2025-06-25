-- Simple policy fix that doesn't require table ownership
-- Run this in your Supabase SQL Editor

-- Drop existing policies (this should work)
DROP POLICY IF EXISTS "Authenticated users can upload files to user-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in user-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on user-images" ON storage.objects;

-- Create a single, simple policy for all operations
CREATE POLICY "Public access to user-images bucket"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'user-images')
WITH CHECK (bucket_id = 'user-images');

-- Ensure bucket is properly configured
UPDATE storage.buckets 
SET public = true
WHERE id = 'user-images';

SELECT 'Simple policy created for user-images bucket' as result;
