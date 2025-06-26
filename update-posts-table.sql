-- Update existing posts table to add missing columns
-- Run this to add the required columns for the Content Library

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add platforms column (array of text)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'platforms') THEN
        ALTER TABLE posts ADD COLUMN platforms TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'status') THEN
        ALTER TABLE posts ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));
    END IF;
    
    -- Add scheduled_for column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'scheduled_for') THEN
        ALTER TABLE posts ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add published_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'published_at') THEN
        ALTER TABLE posts ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'image_url') THEN
        ALTER TABLE posts ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add platform_post_ids column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'platform_post_ids') THEN
        ALTER TABLE posts ADD COLUMN platform_post_ids JSONB DEFAULT '{}'::JSONB;
    END IF;
    
    -- Add engagement_stats column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'engagement_stats') THEN
        ALTER TABLE posts ADD COLUMN engagement_stats JSONB DEFAULT '{}'::JSONB;
    END IF;
    
    -- Add generated_by_ai column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'generated_by_ai') THEN
        ALTER TABLE posts ADD COLUMN generated_by_ai BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add ai_prompt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'ai_prompt') THEN
        ALTER TABLE posts ADD COLUMN ai_prompt TEXT;
    END IF;
    
    -- Add error_message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'error_message') THEN
        ALTER TABLE posts ADD COLUMN error_message TEXT;
    END IF;
    
    -- Add retry_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'retry_count') THEN
        ALTER TABLE posts ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'updated_at') THEN
        ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Update any existing posts to have default values
UPDATE posts 
SET 
    platforms = COALESCE(platforms, ARRAY['twitter']::TEXT[]),
    status = COALESCE(status, 'published'),
    engagement_stats = COALESCE(engagement_stats, '{}'::JSONB),
    platform_post_ids = COALESCE(platform_post_ids, '{}'::JSONB),
    generated_by_ai = COALESCE(generated_by_ai, FALSE),
    retry_count = COALESCE(retry_count, 0),
    updated_at = COALESCE(updated_at, created_at)
WHERE platforms IS NULL OR status IS NULL;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
