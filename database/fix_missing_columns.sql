-- Fix Missing Columns for Scheduled Posting
-- Run this script to add the missing columns that the ScheduledPostService expects

-- Add missing columns to posts table
DO $$ 
BEGIN
    -- Add platforms column (array of text)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'platforms') THEN
        ALTER TABLE posts ADD COLUMN platforms TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE 'Added platforms column to posts table';
    END IF;

    -- Add media_urls column (array of text)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
        ALTER TABLE posts ADD COLUMN media_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE 'Added media_urls column to posts table';
    END IF;

    -- Ensure scheduling_status column exists (from complete_scheduled_posting_setup.sql)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'scheduling_status') THEN
        -- Create enum type if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduling_status_enum') THEN
            CREATE TYPE scheduling_status_enum AS ENUM (
                'draft',
                'scheduled', 
                'processing',
                'published',
                'failed',
                'cancelled'
            );
        END IF;
        
        ALTER TABLE posts ADD COLUMN scheduling_status scheduling_status_enum DEFAULT 'draft';
        RAISE NOTICE 'Added scheduling_status column to posts table';
    END IF;

    -- Ensure scheduled_for column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'scheduled_for') THEN
        ALTER TABLE posts ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added scheduled_for column to posts table';
    END IF;

END $$;

-- Update any existing posts to have default values for new columns
UPDATE posts 
SET 
    platforms = COALESCE(platforms, ARRAY[COALESCE(platform, 'twitter')]::TEXT[]),
    media_urls = COALESCE(media_urls, ARRAY[]::TEXT[]),
    scheduling_status = COALESCE(scheduling_status, 
        CASE 
            WHEN status = 'draft' THEN 'draft'::scheduling_status_enum
            WHEN status = 'scheduled' THEN 'scheduled'::scheduling_status_enum
            WHEN status = 'published' THEN 'published'::scheduling_status_enum
            WHEN status = 'failed' THEN 'failed'::scheduling_status_enum
            ELSE 'draft'::scheduling_status_enum
        END
    )
WHERE platforms IS NULL OR media_urls IS NULL OR scheduling_status IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_scheduling_status ON posts(scheduling_status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_posts_platforms ON posts USING GIN(platforms);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('platforms', 'media_urls', 'scheduling_status', 'scheduled_for')
ORDER BY column_name;
