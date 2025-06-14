-- Fix storage bucket policies for user-images
-- This will resolve the RLS policy violation error

-- First, ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to user images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "user_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "user_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "user_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "user_images_delete_policy" ON storage.objects;

-- Create simple, working policies for user-images bucket
CREATE POLICY "user_images_upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'user-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "user_images_view" ON storage.objects
FOR SELECT USING (
    bucket_id = 'user-images'
);

CREATE POLICY "user_images_update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'user-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "user_images_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'user-images' AND 
    auth.role() = 'authenticated'
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
