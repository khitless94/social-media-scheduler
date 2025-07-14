-- Fix posts table schema for scheduling functionality
-- This ensures the table has all required columns

-- First, let's check if the table exists and create it if not
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add scheduled_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'scheduled_at') THEN
        ALTER TABLE posts ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added scheduled_at column to posts table';
    END IF;

    -- Add image_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'image_url') THEN
        ALTER TABLE posts ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Added image_url column to posts table';
    END IF;

    -- Add platform_post_ids column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'platform_post_ids') THEN
        ALTER TABLE posts ADD COLUMN platform_post_ids JSONB DEFAULT '{}';
        RAISE NOTICE 'Added platform_post_ids column to posts table';
    END IF;

    -- Add engagement_stats column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'engagement_stats') THEN
        ALTER TABLE posts ADD COLUMN engagement_stats JSONB DEFAULT '{}';
        RAISE NOTICE 'Added engagement_stats column to posts table';
    END IF;

    -- Add generated_by_ai column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'generated_by_ai') THEN
        ALTER TABLE posts ADD COLUMN generated_by_ai BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added generated_by_ai column to posts table';
    END IF;

    -- Add ai_prompt column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'ai_prompt') THEN
        ALTER TABLE posts ADD COLUMN ai_prompt TEXT;
        RAISE NOTICE 'Added ai_prompt column to posts table';
    END IF;

    -- Add error_message column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'error_message') THEN
        ALTER TABLE posts ADD COLUMN error_message TEXT;
        RAISE NOTICE 'Added error_message column to posts table';
    END IF;

    -- Add retry_count column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'retry_count') THEN
        ALTER TABLE posts ADD COLUMN retry_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added retry_count column to posts table';
    END IF;

    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'updated_at') THEN
        ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to posts table';
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' AND policyname = 'Users can view their own posts'
    ) THEN
        CREATE POLICY "Users can view their own posts" ON posts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' AND policyname = 'Users can insert their own posts'
    ) THEN
        CREATE POLICY "Users can insert their own posts" ON posts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' AND policyname = 'Users can update their own posts'
    ) THEN
        CREATE POLICY "Users can update their own posts" ON posts
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' AND policyname = 'Users can delete their own posts'
    ) THEN
        CREATE POLICY "Users can delete their own posts" ON posts
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create an index for better performance on scheduled posts
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
