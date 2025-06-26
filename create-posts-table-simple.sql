-- Simple setup for posts table
-- Copy and paste this into Supabase Dashboard > SQL Editor > New Query

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  platform_post_ids JSONB DEFAULT '{}',
  engagement_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Enable RLS
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

-- Insert some sample data for testing (optional)
INSERT INTO posts (user_id, content, platforms, status, published_at, generated_by_ai) VALUES
(auth.uid(), 'Welcome to your Content Library! 🎉 This is your first post to test the system.', ARRAY['twitter'], 'published', NOW(), false),
(auth.uid(), 'Testing multi-platform posting with LinkedIn and Twitter integration.', ARRAY['linkedin', 'twitter'], 'published', NOW() - INTERVAL '1 hour', false),
(auth.uid(), 'Draft post for Instagram - still working on this content...', ARRAY['instagram'], 'draft', null, false),
(auth.uid(), 'Scheduled post for tomorrow morning announcement.', ARRAY['twitter', 'linkedin'], 'scheduled', NOW() + INTERVAL '1 day', false);
