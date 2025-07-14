-- Fix n8n RPC function for scheduled posts
-- This script ensures the get_pending_scheduled_posts function exists and has proper permissions

-- First, let's check if the function exists and drop it if needed
DROP FUNCTION IF EXISTS get_pending_scheduled_posts();

-- Create the function for n8n to fetch pending scheduled posts
CREATE OR REPLACE FUNCTION get_pending_scheduled_posts()
RETURNS TABLE (
    queue_id UUID,
    post_id UUID,
    user_id UUID,
    content TEXT,
    platform TEXT,
    platforms TEXT[],
    media_urls TEXT[],
    scheduled_for TIMESTAMP WITH TIME ZONE,
    oauth_credentials JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id as queue_id,
        p.id as post_id,
        p.user_id,
        p.content,
        CASE 
            WHEN array_length(p.platforms, 1) > 0 THEN p.platforms[1]
            ELSE 'twitter'
        END as platform,
        p.platforms,
        p.media_urls,
        q.scheduled_for,
        COALESCE(
            jsonb_object_agg(
                oc.platform, 
                jsonb_build_object(
                    'access_token', oc.access_token,
                    'refresh_token', oc.refresh_token,
                    'expires_at', oc.expires_at,
                    'token_type', oc.token_type,
                    'scope', oc.scope
                )
            ) FILTER (WHERE oc.platform IS NOT NULL),
            '{}'::jsonb
        ) as oauth_credentials
    FROM scheduled_posts_queue q
    JOIN posts p ON q.post_id = p.id
    LEFT JOIN oauth_credentials oc ON oc.user_id = p.user_id
    WHERE 
        q.status = 'pending'
        AND q.scheduled_for <= NOW()
        AND p.scheduling_status = 'scheduled'
    GROUP BY q.id, p.id, p.user_id, p.content, p.platforms, p.media_urls, q.scheduled_for
    ORDER BY q.scheduled_for ASC;
END;
$$;

-- Grant execute permission to service role (for n8n)
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;

-- Grant execute permission to authenticated users (for testing)
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO authenticated;

-- Also grant execute to anon role for public access if needed
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO anon;

-- Create a simpler version that returns JSON for easier n8n consumption
CREATE OR REPLACE FUNCTION get_pending_posts_json()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'queue_id', queue_id,
            'post_id', post_id,
            'user_id', user_id,
            'content', content,
            'platform', platform,
            'platforms', platforms,
            'media_urls', media_urls,
            'scheduled_for', scheduled_for,
            'oauth_credentials', oauth_credentials
        )
    )
    INTO result
    FROM get_pending_scheduled_posts();
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant permissions for the JSON version
GRANT EXECUTE ON FUNCTION get_pending_posts_json() TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_posts_json() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_posts_json() TO anon;

-- Create function to update post status (for n8n workflow completion)
CREATE OR REPLACE FUNCTION update_scheduled_post_status(
    queue_id_param UUID,
    new_status TEXT,
    execution_id_param TEXT DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL,
    platform_post_ids_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_id_var UUID;
    affected_rows INTEGER;
BEGIN
    -- Get the post_id from queue
    SELECT post_id INTO post_id_var
    FROM scheduled_posts_queue
    WHERE id = queue_id_param;
    
    IF post_id_var IS NULL THEN
        RAISE WARNING 'Queue entry % not found', queue_id_param;
        RETURN FALSE;
    END IF;
    
    -- Update the queue status
    UPDATE scheduled_posts_queue
    SET 
        status = new_status,
        n8n_execution_id = execution_id_param,
        error_message = error_message_param,
        processed_at = CASE WHEN new_status IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
        updated_at = NOW()
    WHERE id = queue_id_param;
    
    -- Update the main posts table
    UPDATE posts
    SET 
        scheduling_status = CASE 
            WHEN new_status = 'completed' THEN 'published'
            WHEN new_status = 'failed' THEN 'failed'
            ELSE scheduling_status
        END,
        status = CASE 
            WHEN new_status = 'completed' THEN 'published'
            WHEN new_status = 'failed' THEN 'failed'
            ELSE status
        END,
        platform_post_ids = COALESCE(platform_post_ids_param, platform_post_ids),
        error_message = error_message_param,
        published_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE published_at END,
        n8n_execution_id = execution_id_param,
        updated_at = NOW()
    WHERE id = post_id_var;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE WARNING 'Post % not found or not updated', post_id_var;
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Grant permissions for the update function
GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Create a helper function for creating test posts
CREATE OR REPLACE FUNCTION create_test_scheduled_post(
    test_user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
    test_content TEXT DEFAULT 'Test post for n8n workflow',
    test_platforms TEXT[] DEFAULT ARRAY['twitter'],
    minutes_from_now INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
    queue_id UUID;
BEGIN
    -- Insert the post
    INSERT INTO posts (
        user_id,
        content,
        platform,
        platforms,
        media_urls,
        status,
        scheduling_status,
        scheduled_for
    ) VALUES (
        test_user_id,
        test_content || ' - ' || NOW()::TEXT,
        test_platforms[1],
        test_platforms,
        ARRAY[]::TEXT[],
        'scheduled',
        'scheduled',
        NOW() + (minutes_from_now || ' minutes')::INTERVAL
    ) RETURNING id INTO new_post_id;

    -- Add to queue
    INSERT INTO scheduled_posts_queue (
        post_id,
        user_id,
        scheduled_for,
        status
    ) VALUES (
        new_post_id,
        test_user_id,
        NOW() + (minutes_from_now || ' minutes')::INTERVAL,
        'pending'
    ) RETURNING id INTO queue_id;

    RAISE NOTICE '✅ Created test post % with queue entry %', new_post_id, queue_id;

    RETURN new_post_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating test post: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Grant permissions for the test function
GRANT EXECUTE ON FUNCTION create_test_scheduled_post(UUID, TEXT, TEXT[], INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION create_test_scheduled_post(UUID, TEXT, TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_scheduled_post(UUID, TEXT, TEXT[], INTEGER) TO anon;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE '✅ RPC functions created successfully!';
    RAISE NOTICE '📋 Available functions:';
    RAISE NOTICE '   - get_pending_scheduled_posts()';
    RAISE NOTICE '   - get_pending_posts_json()';
    RAISE NOTICE '   - update_scheduled_post_status()';
    RAISE NOTICE '   - create_test_scheduled_post()';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Test with: SELECT * FROM get_pending_scheduled_posts();';
    RAISE NOTICE '🧪 Create test post: SELECT create_test_scheduled_post();';
END $$;
