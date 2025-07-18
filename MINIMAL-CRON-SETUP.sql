-- 🚀 MINIMAL CRON SETUP: Absolutely no syntax errors!
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Clean up existing functions and jobs
DROP FUNCTION IF EXISTS process_scheduled_posts CASCADE;

-- Remove existing cron jobs (ignore errors)
DO $$
BEGIN
    PERFORM cron.unschedule('process-scheduled-posts');
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors
END $$;

-- Create the processing function
CREATE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    FOR post_record IN 
        SELECT id, content, platform, scheduled_at
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10
    LOOP
        UPDATE posts 
        SET 
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = post_record.id;
        
        processed_count := processed_count + 1;
    END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;

-- Create the cron job
SELECT cron.schedule(
    'process-scheduled-posts',
    '* * * * *',
    'SELECT process_scheduled_posts();'
);

-- Create monitoring view
CREATE OR REPLACE VIEW cron_monitor AS
SELECT 
    id,
    content,
    platform,
    status,
    scheduled_at,
    published_at,
    created_at,
    CASE 
        WHEN status = 'scheduled' AND scheduled_at <= NOW() THEN 'Ready'
        WHEN status = 'scheduled' AND scheduled_at > NOW() THEN 'Waiting'
        WHEN status = 'published' THEN 'Done'
        ELSE status
    END as processing_status
FROM posts
WHERE status IN ('scheduled', 'published')
ORDER BY scheduled_at DESC;

-- Grant view access
GRANT SELECT ON cron_monitor TO authenticated;

-- Show results
SELECT 'SUCCESS: Cron job created!' as message;
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-posts';
SELECT 'Use: SELECT * FROM cron_monitor; to monitor posts' as tip;
