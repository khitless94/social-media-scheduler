-- Database functions required for webhook-based n8n workflow
-- Run this in Supabase SQL Editor

-- 1. Function to get user's OAuth credentials
CREATE OR REPLACE FUNCTION get_user_oauth_credentials(target_user_id UUID)
RETURNS TABLE (
    platform TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    token_type TEXT,
    scope TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oc.platform,
        oc.access_token,
        oc.refresh_token,
        oc.expires_at,
        oc.token_type,
        oc.scope
    FROM oauth_credentials oc
    WHERE oc.user_id = target_user_id
    AND oc.access_token IS NOT NULL;
END;
$$;

-- 2. Function to update post status after publishing
CREATE OR REPLACE FUNCTION update_post_status(
    target_post_id UUID,
    new_status TEXT DEFAULT 'published',
    new_scheduling_status TEXT DEFAULT 'completed'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_post posts%ROWTYPE;
BEGIN
    -- Update the post status
    UPDATE posts 
    SET 
        status = new_status,
        scheduling_status = new_scheduling_status,
        published_at = CASE 
            WHEN new_status = 'published' THEN NOW()
            ELSE published_at
        END,
        updated_at = NOW()
    WHERE id = target_post_id
    RETURNING * INTO updated_post;
    
    -- Update queue status if exists
    UPDATE scheduled_posts_queue 
    SET 
        status = CASE 
            WHEN new_status = 'published' THEN 'completed'
            ELSE 'failed'
        END,
        updated_at = NOW()
    WHERE post_id = target_post_id;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'post_id', updated_post.id,
        'status', updated_post.status,
        'scheduling_status', updated_post.scheduling_status,
        'published_at', updated_post.published_at
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'post_id', target_post_id
        );
END;
$$;

-- 3. Function to create webhook-triggered scheduled post
CREATE OR REPLACE FUNCTION create_webhook_scheduled_post(
    p_user_id UUID,
    p_content TEXT,
    p_platforms TEXT[],
    p_scheduled_for TIMESTAMP WITH TIME ZONE,
    p_media_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
    result JSON;
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
        scheduled_for,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_content,
        CASE 
            WHEN array_length(p_platforms, 1) > 0 THEN p_platforms[1]
            ELSE 'twitter'
        END,
        p_platforms,
        p_media_urls,
        'scheduled',
        'scheduled',
        p_scheduled_for,
        NOW(),
        NOW()
    ) RETURNING id INTO new_post_id;
    
    -- The trigger will automatically add to scheduled_posts_queue
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'post_id', new_post_id,
        'user_id', p_user_id,
        'content', p_content,
        'platforms', p_platforms,
        'scheduled_for', p_scheduled_for,
        'status', 'scheduled'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', p_user_id
        );
END;
$$;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID) TO anon;

GRANT EXECUTE ON FUNCTION update_post_status(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_post_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_post_status(UUID, TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION create_webhook_scheduled_post(UUID, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION create_webhook_scheduled_post(UUID, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_webhook_scheduled_post(UUID, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, TEXT[]) TO anon;

-- Test the functions
DO $$
BEGIN
    RAISE NOTICE '✅ Webhook database functions created successfully!';
    RAISE NOTICE '📋 Functions available:';
    RAISE NOTICE '   - get_user_oauth_credentials(user_id)';
    RAISE NOTICE '   - update_post_status(post_id, status, scheduling_status)';
    RAISE NOTICE '   - create_webhook_scheduled_post(user_id, content, platforms, scheduled_for, media_urls)';
END $$;
