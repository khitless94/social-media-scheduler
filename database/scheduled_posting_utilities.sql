-- Additional Utility Functions for Scheduled Posting System
-- Run this after the main setup to add extra functionality

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to retry failed scheduled posts
CREATE OR REPLACE FUNCTION retry_failed_post(post_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update post status back to scheduled
    UPDATE posts 
    SET 
        scheduling_status = 'scheduled'::scheduling_status_enum,
        error_message = NULL,
        updated_at = NOW()
    WHERE id = post_id_param 
    AND scheduling_status = 'failed'
    AND scheduled_for > NOW(); -- Only retry future posts
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE WARNING 'Cannot retry post % - not failed or past scheduled time', post_id_param;
        RETURN FALSE;
    END IF;
    
    -- Update queue status
    UPDATE scheduled_posts_queue 
    SET 
        status = 'pending',
        error_message = NULL,
        updated_at = NOW()
    WHERE post_id = post_id_param;
    
    RAISE NOTICE 'Post % queued for retry', post_id_param;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old completed/failed posts from queue
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM scheduled_posts_queue 
    WHERE status IN ('completed', 'failed', 'cancelled')
    AND processed_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old queue entries', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming scheduled posts for a user
CREATE OR REPLACE FUNCTION get_upcoming_posts(
    user_id_param UUID,
    hours_ahead INTEGER DEFAULT 24
)
RETURNS TABLE (
    post_id UUID,
    content TEXT,
    platforms TEXT[],
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status scheduling_status_enum,
    time_until_post INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as post_id,
        p.content,
        p.platforms,
        p.scheduled_for,
        p.scheduling_status as status,
        (p.scheduled_for - NOW()) as time_until_post
    FROM posts p
    WHERE p.user_id = user_id_param
    AND p.scheduling_status = 'scheduled'
    AND p.scheduled_for BETWEEN NOW() AND NOW() + INTERVAL '1 hour' * hours_ahead
    ORDER BY p.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get queue health metrics
CREATE OR REPLACE FUNCTION get_queue_health()
RETURNS TABLE (
    total_pending INTEGER,
    overdue_posts INTEGER,
    processing_posts INTEGER,
    failed_posts_last_hour INTEGER,
    avg_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as total_pending,
        COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_for < NOW())::INTEGER as overdue_posts,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as processing_posts,
        COUNT(*) FILTER (WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '1 hour')::INTEGER as failed_posts_last_hour,
        AVG(processed_at - created_at) FILTER (WHERE status = 'completed' AND processed_at > NOW() - INTERVAL '1 day') as avg_processing_time
    FROM scheduled_posts_queue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel scheduled post
CREATE OR REPLACE FUNCTION cancel_scheduled_post(post_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Update post status to cancelled
    UPDATE posts 
    SET 
        scheduling_status = 'cancelled'::scheduling_status_enum,
        updated_at = NOW()
    WHERE id = post_id_param 
    AND user_id = user_id_param
    AND scheduling_status IN ('scheduled', 'draft');
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE WARNING 'Cannot cancel post % - not found or not schedulable', post_id_param;
        RETURN FALSE;
    END IF;
    
    RAISE NOTICE 'Post % cancelled by user %', post_id_param, user_id_param;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reschedule a post
CREATE OR REPLACE FUNCTION reschedule_post(
    post_id_param UUID,
    user_id_param UUID,
    new_scheduled_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Validate new schedule time is in the future
    IF new_scheduled_time <= NOW() THEN
        RAISE WARNING 'New schedule time must be in the future';
        RETURN FALSE;
    END IF;
    
    -- Update post schedule time
    UPDATE posts 
    SET 
        scheduled_for = new_scheduled_time,
        scheduling_status = 'scheduled'::scheduling_status_enum,
        error_message = NULL,
        updated_at = NOW()
    WHERE id = post_id_param 
    AND user_id = user_id_param
    AND scheduling_status IN ('scheduled', 'failed', 'draft');
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE WARNING 'Cannot reschedule post % - not found or not reschedulable', post_id_param;
        RETURN FALSE;
    END IF;
    
    RAISE NOTICE 'Post % rescheduled to %', post_id_param, new_scheduled_time;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed post history
CREATE OR REPLACE FUNCTION get_post_history(post_id_param UUID)
RETURNS TABLE (
    post_id UUID,
    content TEXT,
    platforms TEXT[],
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduling_status scheduling_status_enum,
    retry_count INTEGER,
    error_message TEXT,
    platform_post_ids JSONB,
    n8n_execution_id VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as post_id,
        p.content,
        p.platforms,
        p.scheduled_for,
        p.created_at,
        p.published_at,
        p.scheduling_status,
        p.retry_count,
        p.error_message,
        p.platform_post_ids,
        p.n8n_execution_id
    FROM posts p
    WHERE p.id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a test scheduled post
CREATE OR REPLACE FUNCTION create_test_scheduled_post(
    user_id_param UUID,
    content_param TEXT DEFAULT 'Test scheduled post from n8n workflow! 🚀',
    platforms_param TEXT[] DEFAULT ARRAY['twitter'],
    minutes_from_now INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    post_id UUID;
BEGIN
    INSERT INTO posts (
        user_id,
        content,
        platforms,
        scheduling_status,
        scheduled_for,
        status,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        content_param,
        platforms_param,
        'scheduled',
        NOW() + INTERVAL '1 minute' * minutes_from_now,
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO post_id;
    
    RAISE NOTICE 'Created test scheduled post % for user % (scheduled for %)', 
        post_id, user_id_param, NOW() + INTERVAL '1 minute' * minutes_from_now;
    
    RETURN post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to reset stuck processing posts
CREATE OR REPLACE FUNCTION reset_stuck_processing_posts(timeout_minutes INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    -- Reset posts that have been processing for too long
    UPDATE posts 
    SET 
        scheduling_status = 'scheduled'::scheduling_status_enum,
        error_message = 'Reset from stuck processing state',
        updated_at = NOW()
    WHERE scheduling_status = 'processing'
    AND updated_at < NOW() - INTERVAL '1 minute' * timeout_minutes;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    -- Also reset corresponding queue entries
    UPDATE scheduled_posts_queue 
    SET 
        status = 'pending',
        error_message = 'Reset from stuck processing state',
        updated_at = NOW()
    WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '1 minute' * timeout_minutes;
    
    RAISE NOTICE 'Reset % stuck processing posts', reset_count;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate scheduling report
CREATE OR REPLACE FUNCTION generate_scheduling_report(
    user_id_param UUID DEFAULT NULL,
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    report_date DATE,
    total_posts INTEGER,
    successful_posts INTEGER,
    failed_posts INTEGER,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(p.scheduled_for) as report_date,
        COUNT(*)::INTEGER as total_posts,
        COUNT(*) FILTER (WHERE p.scheduling_status = 'published')::INTEGER as successful_posts,
        COUNT(*) FILTER (WHERE p.scheduling_status = 'failed')::INTEGER as failed_posts,
        ROUND(
            (COUNT(*) FILTER (WHERE p.scheduling_status = 'published')::NUMERIC / 
             NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as success_rate
    FROM posts p
    WHERE p.scheduled_for >= NOW() - INTERVAL '1 day' * days_back
    AND p.scheduled_for <= NOW()
    AND (user_id_param IS NULL OR p.user_id = user_id_param)
    AND p.scheduling_status IN ('published', 'failed')
    GROUP BY DATE(p.scheduled_for)
    ORDER BY report_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION retry_failed_post(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_queue_entries(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_posts(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_health() TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_scheduled_post(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_post(UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_scheduled_post(UUID, TEXT, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_stuck_processing_posts(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_scheduling_report(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 UTILITY FUNCTIONS INSTALLED!';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ retry_failed_post()';
    RAISE NOTICE '✅ cleanup_old_queue_entries()';
    RAISE NOTICE '✅ get_upcoming_posts()';
    RAISE NOTICE '✅ get_queue_health()';
    RAISE NOTICE '✅ cancel_scheduled_post()';
    RAISE NOTICE '✅ reschedule_post()';
    RAISE NOTICE '✅ get_post_history()';
    RAISE NOTICE '✅ create_test_scheduled_post()';
    RAISE NOTICE '✅ reset_stuck_processing_posts()';
    RAISE NOTICE '✅ generate_scheduling_report()';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Usage Examples:';
    RAISE NOTICE '   SELECT * FROM get_queue_health();';
    RAISE NOTICE '   SELECT * FROM get_upcoming_posts(''user-id'', 24);';
    RAISE NOTICE '   SELECT create_test_scheduled_post(''user-id'');';
    RAISE NOTICE '';
END $$;
