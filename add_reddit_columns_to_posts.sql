-- Add Reddit-specific columns to posts table
-- Run this in your Supabase SQL Editor

-- Add title and subreddit columns to posts table
DO $$ 
BEGIN
    -- Add title column for Reddit posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'title') THEN
        ALTER TABLE posts ADD COLUMN title TEXT;
        RAISE NOTICE '✅ Added title column to posts table';
    ELSE
        RAISE NOTICE '✓ title column already exists';
    END IF;

    -- Add subreddit column for Reddit posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'subreddit') THEN
        ALTER TABLE posts ADD COLUMN subreddit TEXT;
        RAISE NOTICE '✅ Added subreddit column to posts table';
    ELSE
        RAISE NOTICE '✓ subreddit column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('title', 'subreddit')
ORDER BY column_name;
