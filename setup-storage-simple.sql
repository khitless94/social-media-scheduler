-- Simple storage setup for user-images bucket
-- Run this in your Supabase SQL Editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated access" ON storage.objects;

-- Create simple policies that work
-- Policy 1: Allow anyone to upload to user-images bucket
CREATE POLICY "Allow public uploads to user-images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'user-images');

-- Policy 2: Allow anyone to read from user-images bucket
CREATE POLICY "Allow public access to user-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-images');

-- Policy 3: Allow anyone to update files in user-images bucket
CREATE POLICY "Allow public updates to user-images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'user-images')
WITH CHECK (bucket_id = 'user-images');

-- Policy 4: Allow anyone to delete files in user-images bucket
CREATE POLICY "Allow public deletes from user-images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'user-images');

-- Grant permissions
GRANT ALL ON storage.objects TO anon, authenticated, service_role;
GRANT ALL ON storage.buckets TO anon, authenticated, service_role;

-- Verify setup
SELECT 'Storage bucket user-images configured successfully!' as status;
