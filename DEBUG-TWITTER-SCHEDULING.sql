-- 🐦 DEBUG TWITTER SCHEDULING ISSUES
-- This helps identify why Twitter scheduling isn't working

-- 1. Check if Twitter posts are being stored
SELECT 
    'TWITTER POSTS IN DATABASE' as check_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_count,
    COUNT(CASE WHEN status = 'ready_for_posting' THEN 1 END) as ready_count,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM posts 
WHERE platform = 'twitter';

-- 2. Show recent Twitter posts with details
SELECT 
    'RECENT TWITTER POSTS' as info,
    id,
    content,
    status,
    scheduled_at,
    created_at,
    updated_at,
    CASE 
        WHEN scheduled_at <= NOW() THEN 'OVERDUE'
        ELSE 'FUTURE'
    END as timing_status
FROM posts 
WHERE platform = 'twitter'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if cron job is running
SELECT
    'CRON JOB STATUS' as check_type,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname LIKE '%social%' OR jobname LIKE '%post%';

-- 4. Check if processing function exists
SELECT
    'PROCESSING FUNCTIONS' as check_type,
    proname as function_name
FROM pg_proc
WHERE proname LIKE '%process%post%' OR proname LIKE '%scheduled%';

-- 5. Test the processing function manually
SELECT 'MANUAL PROCESSING TEST' as test_type;
SELECT process_scheduled_posts_v3();

-- 6. Check post_history for Twitter posts
SELECT 
    'TWITTER POST HISTORY' as info,
    ph.post_id,
    ph.action,
    ph.details,
    ph.created_at,
    p.content,
    p.status
FROM post_history ph
JOIN posts p ON ph.post_id = p.id
WHERE p.platform = 'twitter'
ORDER BY ph.created_at DESC
LIMIT 20;

-- 7. Check for any Twitter-specific constraints or issues
SELECT 
    'TWITTER CONSTRAINT CHECK' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass
AND pg_get_constraintdef(oid) LIKE '%twitter%';

-- 8. Check if there are any Twitter posts stuck in processing
SELECT 
    'STUCK TWITTER POSTS' as info,
    id,
    content,
    status,
    scheduled_at,
    updated_at,
    NOW() - updated_at as stuck_duration
FROM posts 
WHERE platform = 'twitter'
AND status IN ('processing', 'ready_for_posting')
AND updated_at < NOW() - INTERVAL '10 minutes';

-- 9. Create a test Twitter post to verify the system
INSERT INTO posts (
    user_id,
    platform,
    content,
    status,
    scheduled_at,
    created_at,
    updated_at
) VALUES (
    (SELECT auth.uid()),
    'twitter',
    '🧪 DEBUG: Test Twitter post created at ' || NOW(),
    'scheduled',
    NOW() + INTERVAL '1 minute',
    NOW(),
    NOW()
) RETURNING 
    'TEST POST CREATED' as result,
    id,
    content,
    scheduled_at;

-- 10. Show summary of all platforms for comparison
SELECT 
    'PLATFORM COMPARISON' as info,
    platform,
    COUNT(*) as total_posts,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
    COUNT(CASE WHEN status = 'ready_for_posting' THEN 1 END) as ready,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM posts 
GROUP BY platform
ORDER BY platform;

-- 11. Check if edge function is being called for Twitter
CREATE OR REPLACE FUNCTION debug_twitter_processing()
RETURNS TABLE(
    post_id UUID,
    platform TEXT,
    content TEXT,
    status TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    processing_result TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
BEGIN
    -- Find Twitter posts that should be processed
    FOR post_record IN
        SELECT id, user_id, content, platform, scheduled_at, image_url, status
        FROM posts 
        WHERE platform = 'twitter'
        AND status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 5
    LOOP
        -- Try to mark as ready_for_posting
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
            'debug_marked_ready',
            'Debug: Manually marked Twitter post as ready for posting at ' || NOW(),
            NOW()
        );
        
        RETURN QUERY SELECT 
            post_record.id,
            post_record.platform,
            post_record.content,
            'ready_for_posting'::TEXT,
            post_record.scheduled_at,
            'Successfully marked as ready'::TEXT;
    END LOOP;
    
    -- If no posts found
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            'twitter'::TEXT,
            'No Twitter posts found for processing'::TEXT,
            'none'::TEXT,
            NULL::TIMESTAMP WITH TIME ZONE,
            'No overdue Twitter posts in database'::TEXT;
    END IF;
END;
$$;

-- Run the debug function
SELECT * FROM debug_twitter_processing();

-- Grant permissions
GRANT EXECUTE ON FUNCTION debug_twitter_processing() TO authenticated;

-- Final summary
SELECT 
    'DEBUG COMPLETE' as status,
    'Check the results above to identify Twitter scheduling issues' as next_steps,
    'Look for: 1) Posts in database 2) Cron job status 3) Processing function results' as what_to_check;
