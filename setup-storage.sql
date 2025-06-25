-- Supabase Storage Setup for Image Functionality
-- Run this in your Supabase SQL Editor to set up the storage bucket and policies

-- Create the user-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-images', 'user-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to view their own images
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow public access to images (for social media posting)
CREATE POLICY "Public access to user images" ON storage.objects
FOR SELECT USING (bucket_id = 'user-images');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
