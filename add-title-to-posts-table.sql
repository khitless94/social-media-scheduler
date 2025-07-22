-- Add title column to posts table for Reddit posts
-- This migration adds a title field to support Reddit post titles

DO $$ 
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'title') THEN
        ALTER TABLE posts ADD COLUMN title TEXT;
        RAISE NOTICE '✅ Added title column to posts table';
    ELSE
        RAISE NOTICE '✓ title column already exists in posts table';
    END IF;
END $$;

-- Add comment to document the purpose
COMMENT ON COLUMN posts.title IS 'Title for Reddit posts (required for Reddit platform)';
