-- 🎯 SIMPLE REAL POSTING CRON: Uses pg_notify to trigger frontend posting
-- This approach works without needing service role keys

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Clean up existing functions and jobs
DROP FUNCTION IF EXISTS process_scheduled_posts CASCADE;
DROP FUNCTION IF EXISTS notify_for_posting CASCADE;

-- Remove existing cron jobs
DO $$
BEGIN
    PERFORM cron.unschedule('process-scheduled-posts');
    PERFORM cron.unschedule('notify-for-posting');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create function that marks posts as ready and sends notifications
CREATE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    ready_count INTEGER := 0;
    notification_payload JSONB;
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
        -- Update status to 'ready_for_posting'
        UPDATE posts 
        SET 
            status = 'ready_for_posting',
            updated_at = NOW()
        WHERE id = post_record.id;
        
        -- Create notification payload
        notification_payload := jsonb_build_object(
            'post_id', post_record.id,
            'user_id', post_record.user_id,
            'platform', post_record.platform,
            'content', left(post_record.content, 200),
            'image_url', post_record.image_url,
            'scheduled_at', post_record.scheduled_at,
            'action', 'post_now'
        );
        
        -- Send notification for immediate processing
        PERFORM pg_notify('social_media_post_ready', notification_payload::text);
        
        ready_count := ready_count + 1;
        RAISE NOTICE 'Marked post ready for posting: % (platform: %)', 
            post_record.id, post_record.platform;
    END LOOP;
    
    -- Send summary notification if any posts were processed
    IF ready_count > 0 THEN
        PERFORM pg_notify('social_media_batch_ready', 
            jsonb_build_object(
                'count', ready_count,
                'timestamp', NOW(),
                'message', ready_count || ' posts ready for social media posting'
            )::text
        );
        
        RAISE NOTICE 'Marked % posts as ready for social media posting at %', 
            ready_count, NOW();
    END IF;
END;
$$;

-- Create function to get posts ready for posting
CREATE OR REPLACE FUNCTION get_posts_ready_for_posting()
RETURNS TABLE(
    id UUID,
    user_id UUID,
    content TEXT,
    platform TEXT,
    image_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
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
        p.updated_at
    FROM posts p
    WHERE p.status = 'ready_for_posting'
    ORDER BY p.scheduled_at ASC;
END;
$$;

-- Create function to mark post as posted (called after successful posting)
CREATE OR REPLACE FUNCTION mark_post_as_posted(
    p_post_id UUID,
    p_success BOOLEAN,
    p_platform_response TEXT DEFAULT NULL,
    p_post_url TEXT DEFAULT NULL
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
        WHERE id = p_post_id AND status = 'ready_for_posting';
        
        -- Log success
        INSERT INTO post_history (post_id, action, details, post_url, created_at)
        VALUES (
            p_post_id,
            'published',
            'Successfully posted: ' || COALESCE(p_platform_response, 'Success'),
            p_post_url,
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Send success notification
        PERFORM pg_notify('social_media_post_success', 
            jsonb_build_object(
                'post_id', p_post_id,
                'message', 'Post successfully published',
                'url', p_post_url
            )::text
        );
    ELSE
        UPDATE posts 
        SET 
            status = 'failed',
            updated_at = NOW()
        WHERE id = p_post_id AND status = 'ready_for_posting';
        
        -- Log failure
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'failed',
            'Failed to post: ' || COALESCE(p_platform_response, 'Unknown error'),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
        -- Send failure notification
        PERFORM pg_notify('social_media_post_failed', 
            jsonb_build_object(
                'post_id', p_post_id,
                'error', p_platform_response
            )::text
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Create post_history table with post_url column
CREATE TABLE IF NOT EXISTS post_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, action, created_at)
);

-- Add post_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_history'
        AND column_name = 'post_url'
    ) THEN
        ALTER TABLE post_history ADD COLUMN post_url TEXT;
    END IF;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;
GRANT EXECUTE ON FUNCTION get_posts_ready_for_posting() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_post_as_posted(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

-- Create the cron job (every minute)
SELECT cron.schedule(
    'process-scheduled-posts',
    '* * * * *',
    'SELECT process_scheduled_posts();'
);

-- Create monitoring view
CREATE OR REPLACE VIEW social_posting_status AS
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
        WHEN p.status = 'scheduled' AND p.scheduled_at <= NOW() THEN 'Overdue - will process next run'
        WHEN p.status = 'ready_for_posting' THEN 'Ready - waiting for frontend to post'
        WHEN p.status = 'scheduled' AND p.scheduled_at > NOW() THEN 'Waiting for schedule time'
        WHEN p.status = 'published' THEN 'Successfully posted to social media'
        WHEN p.status = 'failed' THEN 'Failed to post to social media'
        ELSE p.status
    END as processing_status,
    CASE 
        WHEN p.status = 'ready_for_posting' THEN EXTRACT(EPOCH FROM (NOW() - p.updated_at))/60
        WHEN p.status = 'scheduled' AND p.scheduled_at <= NOW() THEN EXTRACT(EPOCH FROM (NOW() - p.scheduled_at))/60
        ELSE NULL
    END as minutes_waiting,
    (SELECT COUNT(*) FROM post_history ph WHERE ph.post_id = p.id) as history_count,
    (SELECT post_url FROM post_history ph WHERE ph.post_id = p.id AND ph.post_url IS NOT NULL ORDER BY created_at DESC LIMIT 1) as social_media_url
FROM posts p
WHERE p.status IN ('scheduled', 'ready_for_posting', 'published', 'failed')
ORDER BY 
    CASE p.status 
        WHEN 'ready_for_posting' THEN 1 
        WHEN 'scheduled' THEN 2 
        WHEN 'failed' THEN 3 
        WHEN 'published' THEN 4 
    END,
    p.scheduled_at DESC;

-- Grant view access
GRANT SELECT ON social_posting_status TO authenticated;
GRANT SELECT ON post_history TO authenticated;

-- Show results
SELECT 'SUCCESS: Simple real posting cron created!' as message;
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-posts';

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SIMPLE REAL POSTING CRON SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 How it works:';
    RAISE NOTICE '1. Cron runs every minute';
    RAISE NOTICE '2. Marks scheduled posts as "ready_for_posting"';
    RAISE NOTICE '3. Sends pg_notify notifications';
    RAISE NOTICE '4. Frontend processor receives notifications and posts immediately';
    RAISE NOTICE '5. Frontend calls mark_post_as_posted() when done';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Monitor with:';
    RAISE NOTICE '• SELECT * FROM social_posting_status;';
    RAISE NOTICE '• SELECT * FROM get_posts_ready_for_posting();';
    RAISE NOTICE '• SELECT * FROM post_history ORDER BY created_at DESC;';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next step: Update frontend to listen for notifications!';
    RAISE NOTICE '';
END $$;
