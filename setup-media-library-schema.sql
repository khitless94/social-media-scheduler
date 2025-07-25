-- Media Library Database Schema
-- This creates all necessary tables and policies for the media library functionality

-- Create media_folders table first (since media_library references it)
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

-- Create media_usage_logs table to track when media is used in posts
CREATE TABLE IF NOT EXISTS media_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID, -- Reference to posts table if available
  platform TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own media" ON media_library;
DROP POLICY IF EXISTS "Users can insert their own media" ON media_library;
DROP POLICY IF EXISTS "Users can update their own media" ON media_library;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_library;

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

-- Drop existing policies if they exist for media_folders
DROP POLICY IF EXISTS "Users can view their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON media_folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON media_folders;

-- Create RLS policies for media_folders
CREATE POLICY "Users can view their own folders" ON media_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" ON media_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON media_folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON media_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for media_usage_logs
CREATE POLICY "Users can view their own usage logs" ON media_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs" ON media_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON media_library TO authenticated;
GRANT ALL ON media_folders TO authenticated;
GRANT ALL ON media_usage_logs TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_library_user_id ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(type);
CREATE INDEX IF NOT EXISTS idx_media_library_folder_id ON media_library(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(created_at);
CREATE INDEX IF NOT EXISTS idx_media_library_usage_count ON media_library(usage_count);
CREATE INDEX IF NOT EXISTS idx_media_library_is_favorite ON media_library(is_favorite);

CREATE INDEX IF NOT EXISTS idx_media_folders_user_id ON media_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_parent_folder_id ON media_folders(parent_folder_id);

CREATE INDEX IF NOT EXISTS idx_media_usage_logs_media_id ON media_usage_logs(media_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_logs_user_id ON media_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_logs_used_at ON media_usage_logs(used_at);

-- Create a view for folder item counts
CREATE OR REPLACE VIEW media_folders_with_counts AS
SELECT 
  f.*,
  COALESCE(item_counts.item_count, 0) as item_count
FROM media_folders f
LEFT JOIN (
  SELECT 
    folder_id,
    COUNT(*) as item_count
  FROM media_library
  GROUP BY folder_id
) item_counts ON f.id = item_counts.folder_id;

-- Grant access to the view
GRANT SELECT ON media_folders_with_counts TO authenticated;

-- Create function to update usage count
CREATE OR REPLACE FUNCTION increment_media_usage(media_id UUID, post_id UUID DEFAULT NULL, platform TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Update usage count
  UPDATE media_library 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = media_id;
  
  -- Log the usage
  INSERT INTO media_usage_logs (media_id, user_id, post_id, platform)
  VALUES (media_id, auth.uid(), post_id, platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get media analytics
CREATE OR REPLACE FUNCTION get_media_analytics(user_uuid UUID)
RETURNS TABLE (
  total_items BIGINT,
  total_size BIGINT,
  total_favorites BIGINT,
  total_folders BIGINT,
  most_used_media JSON,
  recent_uploads JSON,
  storage_by_type JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM media_library WHERE user_id = user_uuid) as total_items,
    (SELECT COALESCE(SUM(size), 0) FROM media_library WHERE user_id = user_uuid) as total_size,
    (SELECT COUNT(*) FROM media_library WHERE user_id = user_uuid AND is_favorite = true) as total_favorites,
    (SELECT COUNT(*) FROM media_folders WHERE user_id = user_uuid) as total_folders,
    (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT name, usage_count, url 
      FROM media_library 
      WHERE user_id = user_uuid 
      ORDER BY usage_count DESC 
      LIMIT 5
    ) t) as most_used_media,
    (SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT name, type, size, created_at 
      FROM media_library 
      WHERE user_id = user_uuid 
      ORDER BY created_at DESC 
      LIMIT 10
    ) t) as recent_uploads,
    (SELECT COALESCE(json_object_agg(type, type_data), '{}'::json) FROM (
      SELECT 
        type,
        json_build_object(
          'count', COUNT(*),
          'total_size', SUM(size)
        ) as type_data
      FROM media_library 
      WHERE user_id = user_uuid 
      GROUP BY type
    ) t) as storage_by_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up unused media (optional)
CREATE OR REPLACE FUNCTION cleanup_unused_media(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete media that hasn't been used in X days and has 0 usage count
  DELETE FROM media_library 
  WHERE usage_count = 0 
    AND created_at < NOW() - INTERVAL '1 day' * days_old
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_library_updated_at 
  BEFORE UPDATE ON media_library 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_folders_updated_at 
  BEFORE UPDATE ON media_folders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for media library
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

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

-- Insert some default folders for new users (optional)
CREATE OR REPLACE FUNCTION create_default_media_folders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO media_folders (user_id, name, description) VALUES
    (NEW.id, 'Social Media Images', 'Images for social media posts'),
    (NEW.id, 'Brand Assets', 'Logos, brand colors, and brand materials'),
    (NEW.id, 'Stock Photos', 'Stock photography and generic images'),
    (NEW.id, 'Videos', 'Video content for posts'),
    (NEW.id, 'Documents', 'PDFs and other documents');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment the following line if you want to auto-create folders for new users
-- CREATE TRIGGER create_default_folders_trigger
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION create_default_media_folders();
