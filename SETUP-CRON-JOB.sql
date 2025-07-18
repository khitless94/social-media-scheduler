-- ⏰ CRON JOB SETUP: Process scheduled posts every minute
-- Run this in Supabase SQL Editor (requires admin/superuser privileges)

-- Step 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Drop existing functions first (to avoid return type conflicts)
DROP FUNCTION IF EXISTS process_scheduled_posts() CASCADE;
DROP FUNCTION IF EXISTS get_scheduling_stats() CASCADE;

-- Step 3: Create function to process scheduled posts
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS TABLE(
    processed_count INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    processed INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Find posts that are ready to be processed
    FOR post_record IN 
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10  -- Process max 10 posts per run to avoid overload
    LOOP
        BEGIN
            -- Log the processing attempt
            INSERT INTO post_history (
                post_id, 
                action, 
                details, 
                created_at
            ) VALUES (
                post_record.id,
                'processing',
                'Started processing scheduled post',
                NOW()
            );
            
            -- Update post status to 'published'
            -- In real implementation, this is where you'd call external APIs
            UPDATE posts 
            SET 
                status = 'published',
                published_at = NOW(),
                updated_at = NOW()
            WHERE id = post_record.id;
            
            -- Log success
            INSERT INTO post_history (
                post_id, 
                action, 
                details, 
                created_at
            ) VALUES (
                post_record.id,
                'published',
                'Post successfully processed and published',
                NOW()
            );
            
            processed := processed + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Handle errors gracefully
            UPDATE posts 
            SET 
                status = 'failed',
                updated_at = NOW()
            WHERE id = post_record.id;
            
            -- Log error
            INSERT INTO post_history (
                post_id, 
                action, 
                details, 
                created_at
            ) VALUES (
                post_record.id,
                'failed',
                'Error processing post: ' || SQLERRM,
                NOW()
            );
            
            error_count := error_count + 1;
        END;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT 
        processed as processed_count,
        CASE 
            WHEN processed = 0 AND error_count = 0 THEN 'No posts to process'
            WHEN processed > 0 AND error_count = 0 THEN 'Successfully processed ' || processed || ' posts'
            WHEN error_count > 0 THEN 'Processed ' || processed || ' posts, ' || error_count || ' errors'
            ELSE 'Processing completed'
        END as message;
END;
$$;

-- Step 3: Create a simple monitoring function
CREATE OR REPLACE FUNCTION get_scheduling_stats()
RETURNS TABLE(
    total_scheduled INTEGER,
    ready_to_process INTEGER,
    processed_today INTEGER,
    failed_today INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT 
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'scheduled') as total_scheduled,
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'scheduled' AND scheduled_at <= NOW()) as ready_to_process,
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'published' AND DATE(published_at) = CURRENT_DATE) as processed_today,
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'failed' AND DATE(updated_at) = CURRENT_DATE) as failed_today;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;
GRANT EXECUTE ON FUNCTION get_scheduling_stats() TO postgres;
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_scheduling_stats() TO authenticated;

-- Step 5: Remove any existing cron jobs with the same name (safely)
DO $$
DECLARE
    job_name TEXT;
BEGIN
    FOR job_name IN SELECT jobname FROM cron.job WHERE jobname IN ('process-scheduled-posts', 'test-cron-job', 'scheduling-stats')
    LOOP
        PERFORM cron.unschedule(job_name);
        RAISE NOTICE 'Removed existing cron job: %', job_name;
    END LOOP;
END $$;

-- Step 6: Create the main cron job (every minute)
SELECT cron.schedule(
    'process-scheduled-posts',           -- job name
    '* * * * *',                        -- every minute
    'SELECT process_scheduled_posts();'  -- function to execute
);

-- Step 7: Create a monitoring cron job (every 5 minutes)
SELECT cron.schedule(
    'scheduling-stats',
    '*/5 * * * *',                      -- every 5 minutes
    'SELECT get_scheduling_stats();'
);

-- Step 8: View current cron jobs
SELECT * FROM cron.job;

-- Step 9: Test the function manually
SELECT * FROM process_scheduled_posts();
SELECT * FROM get_scheduling_stats();

-- Step 10: Create a view for easy monitoring
CREATE OR REPLACE VIEW scheduled_posts_monitor AS
SELECT 
    p.id,
    p.content,
    p.platform,
    p.scheduled_at,
    p.status,
    p.created_at,
    CASE 
        WHEN p.scheduled_at <= NOW() AND p.status = 'scheduled' THEN 'Ready to process'
        WHEN p.scheduled_at > NOW() AND p.status = 'scheduled' THEN 'Waiting'
        WHEN p.status = 'published' THEN 'Completed'
        WHEN p.status = 'failed' THEN 'Failed'
        ELSE p.status
    END as processing_status,
    EXTRACT(EPOCH FROM (NOW() - p.scheduled_at))/60 as minutes_overdue
FROM posts p
WHERE p.status IN ('scheduled', 'published', 'failed')
ORDER BY p.scheduled_at ASC;

-- Grant access to the view
GRANT SELECT ON scheduled_posts_monitor TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Cron job setup completed!';
    RAISE NOTICE '⏰ Processing scheduled posts every minute';
    RAISE NOTICE '📊 Monitoring stats every 5 minutes';
    RAISE NOTICE '👀 Use "SELECT * FROM scheduled_posts_monitor;" to monitor';
    RAISE NOTICE '🧪 Use "SELECT * FROM process_scheduled_posts();" to test manually';
END $$;
