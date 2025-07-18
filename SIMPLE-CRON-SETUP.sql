-- 🚀 SIMPLE CRON SETUP: No conflicts, just works!
-- Run this in Supabase SQL Editor

-- Step 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Clean up any existing cron jobs (safely)
DO $$
DECLARE
    job_name TEXT;
BEGIN
    FOR job_name IN SELECT jobname FROM cron.job WHERE jobname IN ('process-scheduled-posts', 'scheduling-stats', 'test-cron-job')
    LOOP
        PERFORM cron.unschedule(job_name);
        RAISE NOTICE 'Removed existing cron job: %', job_name;
    END LOOP;
END $$;

-- Step 3: Drop existing functions (safely)
DROP FUNCTION IF EXISTS process_scheduled_posts CASCADE;
DROP FUNCTION IF EXISTS get_scheduling_stats CASCADE;

-- Step 4: Create the processing function
CREATE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Process scheduled posts that are ready
    FOR post_record IN 
        SELECT id, content, platform, scheduled_at
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10
    LOOP
        -- Update the post status
        UPDATE posts 
        SET 
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = post_record.id;
        
        processed_count := processed_count + 1;
        
        RAISE NOTICE 'Published post: % (Platform: %)', 
            post_record.id, post_record.platform;
    END LOOP;
    
    -- Log the summary
    RAISE NOTICE 'Cron run completed. Processed % posts at %', 
        processed_count, NOW();
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;

-- Step 6: Create the cron job (every minute)
SELECT cron.schedule(
    'process-scheduled-posts',  -- job name
    '* * * * *',               -- every minute
    'SELECT process_scheduled_posts();'
);

-- Step 7: Verify setup
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count 
    FROM cron.job 
    WHERE jobname = 'process-scheduled-posts';
    
    IF job_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Cron job created successfully!';
        RAISE NOTICE '⏰ Schedule: Every minute (* * * * *)';
        RAISE NOTICE '🎯 Function: process_scheduled_posts()';
        RAISE NOTICE '📊 Check status: SELECT * FROM cron.job;';
    ELSE
        RAISE NOTICE '❌ ERROR: Cron job was not created';
    END IF;
END $$;

-- Step 8: Show current cron jobs
SELECT 
    jobname,
    schedule,
    command,
    active,
    jobid
FROM cron.job 
ORDER BY jobname;

-- Step 9: Test the function (optional)
-- Uncomment the next line to test immediately:
-- SELECT process_scheduled_posts();

-- Step 10: Create a simple monitoring query
CREATE OR REPLACE VIEW cron_monitor AS
SELECT 
    p.id,
    p.content,
    p.platform,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.created_at,
    CASE 
        WHEN p.status = 'scheduled' AND p.scheduled_at <= NOW() THEN 'Ready for processing'
        WHEN p.status = 'scheduled' AND p.scheduled_at > NOW() THEN 'Waiting'
        WHEN p.status = 'published' THEN 'Completed'
        ELSE p.status
    END as processing_status,
    EXTRACT(EPOCH FROM (NOW() - p.scheduled_at))/60 as minutes_since_scheduled
FROM posts p
WHERE p.status IN ('scheduled', 'published')
ORDER BY p.scheduled_at DESC;

-- Grant access to the view
GRANT SELECT ON cron_monitor TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 CRON SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What happens now:';
    RAISE NOTICE '   • Every minute, the cron job runs';
    RAISE NOTICE '   • It finds posts where status=''scheduled'' and scheduled_at <= NOW()';
    RAISE NOTICE '   • Changes their status to ''published''';
    RAISE NOTICE '   • Sets published_at timestamp';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Monitor with:';
    RAISE NOTICE '   • SELECT * FROM cron_monitor;';
    RAISE NOTICE '   • SELECT * FROM cron.job;';
    RAISE NOTICE '   • Visit /cron-monitor in your app';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test by creating a scheduled post and watching it get processed!';
    RAISE NOTICE '';
END $$;
