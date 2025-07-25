-- Fix Media Library Database Setup
-- Run this in your Supabase SQL editor to ensure everything is set up correctly

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS media_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, parent_folder_id)
);

CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  size BIGINT NOT NULL,
  folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  alt_text TEXT,
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON media_folders;

DROP POLICY IF EXISTS "Users can view their own media" ON media_library;
DROP POLICY IF EXISTS "Users can insert their own media" ON media_library;
DROP POLICY IF EXISTS "Users can update their own media" ON media_library;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_library;

-- 4. Create RLS policies for media_folders
CREATE POLICY "Users can view their own folders" ON media_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON media_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON media_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON media_folders
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Create RLS policies for media_library
CREATE POLICY "Users can view their own media" ON media_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media_library
  FOR INSERT WITH CHECK (auth.uid() = user_id AND type IN ('image', 'video'));

CREATE POLICY "Users can update their own media" ON media_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media_library
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT ALL ON media_folders TO authenticated;
GRANT ALL ON media_library TO authenticated;

-- 7. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

-- 9. Create storage policies
CREATE POLICY "Users can upload their own media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-library' AND
    auth.uid()::text = (string_to_array(name, '/'))[1] AND
    (
      lower(name) LIKE '%.jpg' OR lower(name) LIKE '%.jpeg' OR
      lower(name) LIKE '%.png' OR lower(name) LIKE '%.gif' OR
      lower(name) LIKE '%.webp' OR lower(name) LIKE '%.svg' OR
      lower(name) LIKE '%.mp4' OR lower(name) LIKE '%.mov' OR
      lower(name) LIKE '%.avi' OR lower(name) LIKE '%.webm' OR
      lower(name) LIKE '%.mkv'
    )
  );

CREATE POLICY "Users can view their own media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-library' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Users can update their own media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media-library' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

CREATE POLICY "Users can delete their own media" ON storage.objects
  FOR DELETE USING (bucket_id = 'media-library' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_library_user_id ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_folder_id ON media_library(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at);

CREATE INDEX IF NOT EXISTS idx_media_folders_user_id ON media_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_folder_id ON media_folders(parent_folder_id);

-- Test query to verify setup
SELECT 'Setup complete! Tables and policies created successfully.' as status;
