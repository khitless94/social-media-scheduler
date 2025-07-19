-- 🚀 COMPLETE CRON SETUP FOR SOCIAL MEDIA SCHEDULER
-- This creates a comprehensive automated posting system

-- 1. First run the QUICK-FIX-ALL-ISSUES.sql to fix constraints

-- 2. Create the automated posting function
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    post_count INTEGER := 0;
BEGIN
    -- Log the start of processing
    RAISE NOTICE 'Starting scheduled post processing at %', NOW();
    
    -- Find posts that are scheduled and ready to be posted
    FOR post_record IN
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10  -- Process max 10 posts per run
    LOOP
        -- Mark post as ready for posting
        UPDATE posts 
        SET 
            status = 'ready_for_posting',
            updated_at = NOW()
        WHERE id = post_record.id;
        
        -- Log the action
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            post_record.id,
            post_record.user_id,
            'marked_ready',
            'Post marked as ready for posting by cron job',
            NOW()
        );
        
        post_count := post_count + 1;
        
        RAISE NOTICE 'Marked post % as ready for posting (Platform: %, Scheduled: %)', 
            post_record.id, post_record.platform, post_record.scheduled_at;
    END LOOP;
    
    RAISE NOTICE 'Processed % posts in this run', post_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO authenticated;

-- 3. Create the cron job (runs every minute)
SELECT cron.schedule(
    'process-scheduled-posts',
    '* * * * *',  -- Every minute
    'SELECT process_scheduled_posts();'
);

-- 4. Create a function to check cron job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE(
    jobname TEXT,
    schedule TEXT,
    active BOOLEAN,
    last_run TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        jobname::TEXT,
        schedule::TEXT,
        active,
        last_run
    FROM cron.job 
    WHERE jobname = 'process-scheduled-posts';
$$;

GRANT EXECUTE ON FUNCTION get_cron_job_status() TO authenticated;

-- 5. Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_post_processing()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM process_scheduled_posts();
    RETURN 'Manual post processing triggered successfully';
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_post_processing() TO authenticated;

-- 6. Create a function to get processing statistics
CREATE OR REPLACE FUNCTION get_post_processing_stats()
RETURNS TABLE(
    total_scheduled INTEGER,
    ready_for_posting INTEGER,
    published_today INTEGER,
    failed_today INTEGER,
    next_scheduled TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        (SELECT COUNT(*) FROM posts WHERE status = 'scheduled')::INTEGER,
        (SELECT COUNT(*) FROM posts WHERE status = 'ready_for_posting')::INTEGER,
        (SELECT COUNT(*) FROM posts WHERE status = 'published' AND published_at >= CURRENT_DATE)::INTEGER,
        (SELECT COUNT(*) FROM posts WHERE status = 'failed' AND updated_at >= CURRENT_DATE)::INTEGER,
        (SELECT MIN(scheduled_at) FROM posts WHERE status = 'scheduled' AND scheduled_at > NOW())
$$;

GRANT EXECUTE ON FUNCTION get_post_processing_stats() TO authenticated;

-- 7. Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT 'SUCCESS: Complete cron system setup!' as message;
SELECT 'Cron job will run every minute to process scheduled posts' as status;
SELECT 'Use get_cron_job_status() to check if cron is running' as info;
