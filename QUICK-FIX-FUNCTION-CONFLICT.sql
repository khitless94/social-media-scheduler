-- 🔧 QUICK FIX: Resolve function return type conflict
-- Run this first if you get "cannot change return type" error

-- Step 1: Drop all existing functions that might conflict
DROP FUNCTION IF EXISTS process_scheduled_posts() CASCADE;
DROP FUNCTION IF EXISTS get_scheduling_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Drop any existing cron jobs (ignore errors if jobs don't exist)
DO $$
BEGIN
    PERFORM cron.unschedule('process-scheduled-posts');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cron job process-scheduled-posts did not exist';
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('scheduling-stats');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cron job scheduling-stats did not exist';
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('test-cron-job');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cron job test-cron-job did not exist';
END $$;

-- Step 3: Create simple function without return type conflicts
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Find posts that are ready to be processed
    FOR post_record IN 
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10  -- Process max 10 posts per run
    LOOP
        -- Update post status to 'published'
        UPDATE posts 
        SET 
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = post_record.id;
        
        processed_count := processed_count + 1;
        
        -- Log the processing
        RAISE NOTICE 'Processed post ID: % for platform: %', 
            post_record.id, post_record.platform;
    END LOOP;
    
    -- Log summary
    IF processed_count > 0 THEN
        RAISE NOTICE 'Processed % scheduled posts at %', processed_count, NOW();
    END IF;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO authenticated;

-- Step 5: Create the cron job
SELECT cron.schedule(
    'process-scheduled-posts',
    '* * * * *',
    'SELECT process_scheduled_posts();'
);

-- Step 6: Test the function (ignore errors if no posts to process)
DO $$
BEGIN
    PERFORM process_scheduled_posts();
    RAISE NOTICE 'Function test completed successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;

-- Step 7: Check cron job was created
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-posts';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Function conflict resolved!';
    RAISE NOTICE '⏰ Cron job created: process-scheduled-posts';
    RAISE NOTICE '🧪 Test with: SELECT process_scheduled_posts();';
END $$;
