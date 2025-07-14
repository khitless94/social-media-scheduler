-- Fix posts table schema for n8n workflow
-- This script ensures the posts table has the correct structure

-- First, let's check the current table structure
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current posts table structure...';
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add platforms column (array of text) if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'platforms') THEN
        ALTER TABLE posts ADD COLUMN platforms TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ Added platforms column';
    ELSE
        RAISE NOTICE '✓ platforms column already exists';
    END IF;

    -- Add media_urls column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
        ALTER TABLE posts ADD COLUMN media_urls TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE '✅ Added media_urls column';
    ELSE
        RAISE NOTICE '✓ media_urls column already exists';
    END IF;

    -- Add scheduled_for column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'scheduled_for') THEN
        ALTER TABLE posts ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added scheduled_for column';
    ELSE
        RAISE NOTICE '✓ scheduled_for column already exists';
    END IF;

    -- Add n8n_execution_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'n8n_execution_id') THEN
        ALTER TABLE posts ADD COLUMN n8n_execution_id VARCHAR(255);
        RAISE NOTICE '✅ Added n8n_execution_id column';
    ELSE
        RAISE NOTICE '✓ n8n_execution_id column already exists';
    END IF;

    -- Check if platform column allows NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'posts' AND column_name = 'platform' AND is_nullable = 'NO') THEN
        -- Make platform column nullable temporarily
        ALTER TABLE posts ALTER COLUMN platform DROP NOT NULL;
        RAISE NOTICE '✅ Made platform column nullable';
    ELSE
        RAISE NOTICE '✓ platform column is already nullable or doesn\'t exist';
    END IF;

END $$;

-- Create enum for scheduling status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE scheduling_status_enum AS ENUM (
        'draft',
        'scheduled',
        'processing',
        'published',
        'failed',
        'cancelled'
    );
    RAISE NOTICE '✅ Created scheduling_status_enum';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '✓ scheduling_status_enum already exists';
END $$;

-- Add scheduling_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'scheduling_status') THEN
        ALTER TABLE posts ADD COLUMN scheduling_status scheduling_status_enum DEFAULT 'draft';
        RAISE NOTICE '✅ Added scheduling_status column';
    ELSE
        RAISE NOTICE '✓ scheduling_status column already exists';
    END IF;
END $$;

-- Create a function to automatically set platform from platforms array
CREATE OR REPLACE FUNCTION set_platform_from_platforms()
RETURNS TRIGGER AS $$
BEGIN
    -- If platform is null but platforms array has values, set platform to first element
    IF NEW.platform IS NULL AND array_length(NEW.platforms, 1) > 0 THEN
        NEW.platform := NEW.platforms[1];
    END IF;
    
    -- If platforms is empty but platform is set, populate platforms array
    IF (NEW.platforms IS NULL OR array_length(NEW.platforms, 1) = 0) AND NEW.platform IS NOT NULL THEN
        NEW.platforms := ARRAY[NEW.platform];
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync platform and platforms
DROP TRIGGER IF EXISTS sync_platform_platforms ON posts;
CREATE TRIGGER sync_platform_platforms
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION set_platform_from_platforms();

-- Update existing records to have consistent platform/platforms
UPDATE posts 
SET platform = platforms[1] 
WHERE platform IS NULL AND array_length(platforms, 1) > 0;

UPDATE posts 
SET platforms = ARRAY[platform] 
WHERE (platforms IS NULL OR array_length(platforms, 1) = 0) AND platform IS NOT NULL;

-- Create a helper function for creating test posts
CREATE OR REPLACE FUNCTION create_test_scheduled_post(
    test_user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    test_content TEXT DEFAULT 'Test post for n8n workflow',
    test_platforms TEXT[] DEFAULT ARRAY['twitter'],
    minutes_from_now INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
    queue_id UUID;
BEGIN
    -- Insert the post
    INSERT INTO posts (
        user_id,
        content,
        platform,
        platforms,
        media_urls,
        status,
        scheduling_status,
        scheduled_for
    ) VALUES (
        test_user_id,
        test_content || ' - ' || NOW()::TEXT,
        test_platforms[1],
        test_platforms,
        ARRAY[]::TEXT[],
        'scheduled',
        'scheduled',
        NOW() + (minutes_from_now || ' minutes')::INTERVAL
    ) RETURNING id INTO new_post_id;
    
    -- Add to queue
    INSERT INTO scheduled_posts_queue (
        post_id,
        user_id,
        scheduled_for,
        status
    ) VALUES (
        new_post_id,
        test_user_id,
        NOW() + (minutes_from_now || ' minutes')::INTERVAL,
        'pending'
    ) RETURNING id INTO queue_id;
    
    RAISE NOTICE '✅ Created test post % with queue entry %', new_post_id, queue_id;
    
    RETURN new_post_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_test_scheduled_post(UUID, TEXT, TEXT[], INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION create_test_scheduled_post(UUID, TEXT, TEXT[], INTEGER) TO authenticated;

-- Test the setup
DO $$
DECLARE
    test_post_id UUID;
BEGIN
    RAISE NOTICE '🧪 Testing the setup...';
    
    -- Create a test post
    SELECT create_test_scheduled_post() INTO test_post_id;
    
    -- Check if we can fetch it
    IF EXISTS (SELECT 1 FROM get_pending_scheduled_posts() WHERE post_id = test_post_id) THEN
        RAISE NOTICE '✅ Test successful! Post can be fetched by n8n function';
    ELSE
        RAISE NOTICE '❌ Test failed! Post not found in pending queue';
    END IF;
    
    -- Clean up test post
    DELETE FROM scheduled_posts_queue WHERE post_id = test_post_id;
    DELETE FROM posts WHERE id = test_post_id;
    RAISE NOTICE '🧹 Cleaned up test post';
    
END $$;

-- Final status report
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Posts table schema fix completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary of changes:';
    RAISE NOTICE '   ✅ Added missing columns (platforms, media_urls, scheduled_for, etc.)';
    RAISE NOTICE '   ✅ Made platform column nullable';
    RAISE NOTICE '   ✅ Created scheduling_status enum';
    RAISE NOTICE '   ✅ Added trigger to sync platform/platforms';
    RAISE NOTICE '   ✅ Created helper function for test posts';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 You can now:';
    RAISE NOTICE '   - Create posts with either platform or platforms';
    RAISE NOTICE '   - Use create_test_scheduled_post() to create test data';
    RAISE NOTICE '   - Run the n8n workflow without schema errors';
    RAISE NOTICE '';
END $$;
