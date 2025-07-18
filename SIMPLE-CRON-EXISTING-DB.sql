-- 🎯 SIMPLE CRON FOR EXISTING DATABASE
-- This works with your current database structure without major changes

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Fix status constraint to allow 'ready_for_posting'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
CHECK (status IN ('draft', 'scheduled', 'ready_for_posting', 'published', 'failed'));

-- Clean up existing cron jobs
DO $$
BEGIN
    PERFORM cron.unschedule('process-scheduled-posts');
    PERFORM cron.unschedule('simple-scheduled-posts');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create simple function that marks posts as ready for processing
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    ready_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting scheduled posts processing at %', NOW();
    
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
        
        ready_count := ready_count + 1;
        RAISE NOTICE 'Marked post ready for posting: % (platform: %)', 
            post_record.id, post_record.platform;
    END LOOP;
    
    IF ready_count > 0 THEN
        RAISE NOTICE 'Marked % posts as ready for social media posting at %', 
            ready_count, NOW();
    END IF;
END;
$$;

-- Create function to get posts ready for posting (works with existing structure)
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
        p.platform::TEXT,  -- Cast varchar to text
        p.image_url,
        p.scheduled_at,
        p.updated_at
    FROM posts p
    WHERE p.status = 'ready_for_posting'
    ORDER BY p.scheduled_at ASC;
END;
$$;

-- Create function to mark post as posted (works with existing structure)
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
        
        -- Log success in existing post_history table
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'published',
            'Successfully posted: ' || COALESCE(p_platform_response, 'Success'),
            NOW()
        ) ON CONFLICT DO NOTHING;
        
    ELSE
        UPDATE posts 
        SET 
            status = 'failed',
            updated_at = NOW()
        WHERE id = p_post_id AND status = 'ready_for_posting';
        
        -- Log failure in existing post_history table
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'failed',
            'Failed to post: ' || COALESCE(p_platform_response, 'Unknown error'),
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Create monitoring view that works with existing structure
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
    (SELECT COUNT(*) FROM post_history ph WHERE ph.post_id = p.id) as history_count
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;
GRANT EXECUTE ON FUNCTION get_posts_ready_for_posting() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_post_as_posted(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT SELECT ON social_posting_status TO authenticated;

-- Create the cron job (every minute)
SELECT cron.schedule(
    'simple-scheduled-posts',
    '* * * * *',
    'SELECT process_scheduled_posts();'
);

-- Show results
SELECT 'SUCCESS: Simple cron created for existing database!' as message;
SELECT * FROM cron.job WHERE jobname = 'simple-scheduled-posts';

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SIMPLE CRON SETUP COMPLETE FOR EXISTING DATABASE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What this does:';
    RAISE NOTICE '1. Cron runs every minute';
    RAISE NOTICE '2. Marks scheduled posts as "ready_for_posting"';
    RAISE NOTICE '3. Frontend processor picks them up automatically';
    RAISE NOTICE '4. Works with your existing database structure';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Monitor with:';
    RAISE NOTICE '• SELECT * FROM social_posting_status;';
    RAISE NOTICE '• SELECT * FROM get_posts_ready_for_posting();';
    RAISE NOTICE '• Visit /social-fix to control the processor';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next: Visit /social-fix to start the processor!';
    RAISE NOTICE '';
END $$;
