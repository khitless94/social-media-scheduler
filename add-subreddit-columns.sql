-- Add subreddit columns to user_preferences table
-- Run this in your Supabase SQL editor if the migration doesn't work

-- First, check if the columns already exist
DO $$ 
BEGIN
    -- Add reddit_subreddits column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'reddit_subreddits'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN reddit_subreddits JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Added reddit_subreddits column';
    ELSE
        RAISE NOTICE 'reddit_subreddits column already exists';
    END IF;
    
    -- Add default_reddit_subreddit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'default_reddit_subreddit'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN default_reddit_subreddit TEXT DEFAULT 'testingground4bots';
        
        RAISE NOTICE 'Added default_reddit_subreddit column';
    ELSE
        RAISE NOTICE 'default_reddit_subreddit column already exists';
    END IF;
END $$;

-- Update existing rows to have default values if they're null
UPDATE user_preferences 
SET 
    reddit_subreddits = COALESCE(reddit_subreddits, '[]'::jsonb),
    default_reddit_subreddit = COALESCE(default_reddit_subreddit, 'testingground4bots')
WHERE 
    reddit_subreddits IS NULL 
    OR default_reddit_subreddit IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
AND column_name IN ('reddit_subreddits', 'default_reddit_subreddit')
ORDER BY column_name;
