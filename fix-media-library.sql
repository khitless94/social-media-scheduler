-- Quick fix for Media Library - handles existing policies
-- Run this in your Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own media" ON media_library;
DROP POLICY IF EXISTS "Users can insert their own media" ON media_library;
DROP POLICY IF EXISTS "Users can update their own media" ON media_library;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_library;

DROP POLICY IF EXISTS "Users can view their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON media_folders;

DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

-- Create media_folders table if it doesn't exist
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

-- Create media_library table (images and videos only)
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

-- Enable Row Level Security
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media_library (images and videos only)
CREATE POLICY "Users can view their own media" ON media_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media_library
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    type IN ('image', 'video')
  );

CREATE POLICY "Users can update their own media" ON media_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media_library
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for media_folders
CREATE POLICY "Users can view their own folders" ON media_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON media_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON media_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON media_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON media_library TO authenticated;
GRANT ALL ON media_folders TO authenticated;

-- Create storage bucket for media library
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (images and videos only)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_library_user_id ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(type);
CREATE INDEX IF NOT EXISTS idx_media_library_folder_id ON media_library(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at);

CREATE INDEX IF NOT EXISTS idx_media_folders_user_id ON media_folders(user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Media Library setup complete!';
  RAISE NOTICE '📋 Tables created: media_library, media_folders';
  RAISE NOTICE '🗂️ Storage bucket: media-library';
  RAISE NOTICE '🔒 RLS policies: Enabled for user data protection';
  RAISE NOTICE '📁 File types: Images and Videos only';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 You can now:';
  RAISE NOTICE '   • Upload images (PNG, JPG, GIF, WebP, SVG)';
  RAISE NOTICE '   • Upload videos (MP4, MOV, AVI, WebM, MKV)';
  RAISE NOTICE '   • Create and manage folders';
  RAISE NOTICE '   • View media analytics';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Test your Media Library at: http://localhost:8080/media';
END $$;
