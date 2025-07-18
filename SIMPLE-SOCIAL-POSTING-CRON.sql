-- 🎯 SIMPLE SOLUTION: Cron + External Processing
-- This marks posts as ready and lets your frontend/external service handle the actual posting

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Clean up existing
DROP FUNCTION IF EXISTS process_scheduled_posts CASCADE;
DROP FUNCTION IF EXISTS notify_ready_posts CASCADE;

-- Remove existing cron jobs
DO $$
BEGIN
    PERFORM cron.unschedule('process-scheduled-posts');
    PERFORM cron.unschedule('notify-ready-posts');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create function that marks posts as ready and notifies external systems
CREATE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    ready_count INTEGER := 0;
BEGIN
    -- Find posts ready for processing
    FOR post_record IN 
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10
    LOOP
        -- Update status to 'ready' (instead of 'published')
        UPDATE posts 
        SET 
            status = 'ready',
            updated_at = NOW()
        WHERE id = post_record.id;
        
        -- Send notification for external processing
        PERFORM pg_notify(
            'post_ready', 
            json_build_object(
                'post_id', post_record.id,
                'user_id', post_record.user_id,
                'platform', post_record.platform,
                'content', left(post_record.content, 100),
                'image_url', post_record.image_url,
                'scheduled_at', post_record.scheduled_at
            )::text
        );
        
        ready_count := ready_count + 1;
        RAISE NOTICE 'Marked post ready for %: %', post_record.platform, post_record.id;
    END LOOP;
    
    -- Log summary
    IF ready_count > 0 THEN
        RAISE NOTICE 'Marked % posts as ready for external processing at %', ready_count, NOW();
        
        -- Send summary notification
        PERFORM pg_notify(
            'posts_ready_summary',
            json_build_object(
                'count', ready_count,
                'timestamp', NOW()
            )::text
        );
    END IF;
END;
$$;

-- Create function to get posts ready for external processing
CREATE OR REPLACE FUNCTION get_ready_posts()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    content TEXT,
    platform TEXT,
    image_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.content,
        p.platform,
        p.image_url,
        p.scheduled_at,
        p.created_at
    FROM posts p
    WHERE p.status = 'ready'
    ORDER BY p.scheduled_at ASC;
END;
$$;

-- Create function to mark post as posted (called by external system)
CREATE OR REPLACE FUNCTION mark_post_as_posted(
    p_post_id UUID,
    p_success BOOLEAN,
    p_response_data TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_success THEN
        UPDATE posts 
        SET 
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = p_post_id;
        
        -- Log success
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'published',
            'Successfully posted: ' || COALESCE(p_response_data, 'Success'),
            NOW()
        );
    ELSE
        UPDATE posts 
        SET 
            status = 'failed',
            updated_at = NOW()
        WHERE id = p_post_id;
        
        -- Log failure
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'failed',
            'Failed to post: ' || COALESCE(p_response_data, 'Unknown error'),
            NOW()
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;
GRANT EXECUTE ON FUNCTION get_ready_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_post_as_posted(UUID, BOOLEAN, TEXT) TO authenticated;

-- Create the cron job (every minute)
SELECT cron.schedule(
    'process-scheduled-posts',
    '* * * * *',
    'SELECT process_scheduled_posts();'
);

-- Create enhanced monitoring view
CREATE OR REPLACE VIEW social_posting_monitor AS
SELECT 
    p.id,
    p.content,
    p.platform,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.status = 'scheduled' AND p.scheduled_at <= NOW() THEN 'Overdue - Will process next run'
        WHEN p.status = 'scheduled' AND p.scheduled_at > NOW() THEN 'Waiting for schedule time'
        WHEN p.status = 'ready' THEN 'Ready for external posting'
        WHEN p.status = 'published' THEN 'Successfully posted'
        WHEN p.status = 'failed' THEN 'Failed to post'
        ELSE p.status
    END as processing_status,
    CASE 
        WHEN p.status = 'ready' THEN EXTRACT(EPOCH FROM (NOW() - p.updated_at))/60
        WHEN p.status = 'scheduled' AND p.scheduled_at <= NOW() THEN EXTRACT(EPOCH FROM (NOW() - p.scheduled_at))/60
        ELSE NULL
    END as minutes_waiting,
    (SELECT COUNT(*) FROM post_history ph WHERE ph.post_id = p.id) as history_count
FROM posts p
WHERE p.status IN ('scheduled', 'ready', 'published', 'failed')
ORDER BY 
    CASE p.status 
        WHEN 'ready' THEN 1 
        WHEN 'scheduled' THEN 2 
        WHEN 'failed' THEN 3 
        WHEN 'published' THEN 4 
    END,
    p.scheduled_at DESC;

-- Grant view access
GRANT SELECT ON social_posting_monitor TO authenticated;

-- Create a simple API endpoint view for external processing
CREATE OR REPLACE VIEW posts_ready_for_processing AS
SELECT 
    id,
    user_id,
    content,
    platform,
    image_url,
    scheduled_at,
    updated_at as marked_ready_at
FROM posts 
WHERE status = 'ready'
ORDER BY scheduled_at ASC;

GRANT SELECT ON posts_ready_for_processing TO authenticated;

-- Show results
SELECT 'SUCCESS: Social posting cron created!' as message;
SELECT 'Posts will be marked as "ready" for external processing' as note;
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-posts';

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SOCIAL POSTING CRON SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 How it works:';
    RAISE NOTICE '1. Cron runs every minute';
    RAISE NOTICE '2. Marks scheduled posts as "ready" when time arrives';
    RAISE NOTICE '3. External system processes "ready" posts';
    RAISE NOTICE '4. External system calls mark_post_as_posted() when done';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Monitor with:';
    RAISE NOTICE '• SELECT * FROM social_posting_monitor;';
    RAISE NOTICE '• SELECT * FROM posts_ready_for_processing;';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 External processing:';
    RAISE NOTICE '• Query: SELECT * FROM get_ready_posts();';
    RAISE NOTICE '• Update: SELECT mark_post_as_posted(post_id, success, response);';
    RAISE NOTICE '';
END $$;
