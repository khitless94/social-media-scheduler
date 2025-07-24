-- Fix database schema for posts table
-- This ensures the posts table has the correct structure

-- Drop and recreate posts table with correct schema
DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'facebook', 'reddit')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  platform_post_ids JSONB DEFAULT '{}',
  engagement_stats JSONB DEFAULT '{}',
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  title TEXT, -- For Reddit posts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON posts TO authenticated;
GRANT USAGE ON SEQUENCE posts_id_seq TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Create post_history table for tracking
DROP TABLE IF EXISTS post_history CASCADE;

CREATE TABLE post_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'posted',
  post_id TEXT,
  post_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for post_history
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for post_history
CREATE POLICY "Users can view their own post history" ON post_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post history" ON post_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions for post_history
GRANT ALL ON post_history TO authenticated;

-- Create indexes for post_history
CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_platform ON post_history(platform);
CREATE INDEX IF NOT EXISTS idx_post_history_created_at ON post_history(created_at);
