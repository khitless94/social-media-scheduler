-- Security setup for webhook-based n8n scheduling
-- Run this in Supabase SQL Editor to ensure proper user isolation

-- 1. Enable Row Level Security (RLS) on all relevant tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for posts table
DROP POLICY IF EXISTS "Users can only access their own posts" ON posts;
CREATE POLICY "Users can only access their own posts" ON posts
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 3. Create RLS policies for scheduled_posts_queue table
DROP POLICY IF EXISTS "Users can only access their own queue items" ON scheduled_posts_queue;
CREATE POLICY "Users can only access their own queue items" ON scheduled_posts_queue
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 4. Create RLS policies for oauth_credentials table
DROP POLICY IF EXISTS "Users can only access their own credentials" ON oauth_credentials;
CREATE POLICY "Users can only access their own credentials" ON oauth_credentials
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- 5. Create webhook validation function
CREATE OR REPLACE FUNCTION validate_webhook_request(
    request_user_id UUID,
    request_post_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    -- If post_id is provided, verify the user owns the post
    IF request_post_id IS NOT NULL THEN
        SELECT user_id INTO post_owner_id 
        FROM posts 
        WHERE id = request_post_id;
        
        IF post_owner_id IS NULL THEN
            RAISE EXCEPTION 'Post not found: %', request_post_id;
        END IF;
        
        IF post_owner_id != request_user_id THEN
            RAISE EXCEPTION 'User % does not own post %', request_user_id, request_post_id;
        END IF;
    END IF;
    
    -- Verify user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = request_user_id) THEN
        RAISE EXCEPTION 'User not found: %', request_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 6. Create secure post creation function for webhooks
CREATE OR REPLACE FUNCTION create_secure_webhook_post(
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
    -- Validate the request
    PERFORM validate_webhook_request(p_user_id);
    
    -- Validate platforms array
    IF array_length(p_platforms, 1) IS NULL OR array_length(p_platforms, 1) = 0 THEN
        RAISE EXCEPTION 'At least one platform must be specified';
    END IF;
    
    -- Validate scheduled time is in the future
    IF p_scheduled_for <= NOW() THEN
        RAISE EXCEPTION 'Scheduled time must be in the future';
    END IF;
    
    -- Validate content is not empty
    IF p_content IS NULL OR trim(p_content) = '' THEN
        RAISE EXCEPTION 'Post content cannot be empty';
    END IF;
    
    -- Insert the post with proper validation
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
        p_platforms[1], -- Primary platform
        p_platforms,
        p_media_urls,
        'scheduled',
        'scheduled',
        p_scheduled_for,
        NOW(),
        NOW()
    ) RETURNING id INTO new_post_id;
    
    -- Log the webhook request for audit
    INSERT INTO webhook_audit_log (
        user_id,
        post_id,
        action,
        payload,
        created_at
    ) VALUES (
        p_user_id,
        new_post_id,
        'create_post',
        jsonb_build_object(
            'content_length', length(p_content),
            'platforms', p_platforms,
            'scheduled_for', p_scheduled_for
        ),
        NOW()
    );
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'post_id', new_post_id,
        'user_id', p_user_id,
        'platforms', p_platforms,
        'scheduled_for', p_scheduled_for,
        'status', 'scheduled'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO webhook_audit_log (
            user_id,
            action,
            payload,
            error_message,
            created_at
        ) VALUES (
            p_user_id,
            'create_post_error',
            jsonb_build_object(
                'content_length', COALESCE(length(p_content), 0),
                'platforms', p_platforms,
                'scheduled_for', p_scheduled_for
            ),
            SQLERRM,
            NOW()
        );
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'user_id', p_user_id
        );
END;
$$;

-- 7. Create webhook audit log table
CREATE TABLE IF NOT EXISTS webhook_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    post_id UUID REFERENCES posts(id),
    action TEXT NOT NULL,
    payload JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE webhook_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit log
CREATE POLICY "Service role can access audit log" ON webhook_audit_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Grant permissions to functions
GRANT EXECUTE ON FUNCTION validate_webhook_request(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_secure_webhook_post(UUID, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, TEXT[]) TO service_role;

-- 9. Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_limit INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_count INTEGER;
BEGIN
    -- Count requests in the time window
    SELECT COUNT(*) INTO request_count
    FROM webhook_audit_log
    WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Check if limit exceeded
    IF request_count >= p_limit THEN
        RAISE EXCEPTION 'Rate limit exceeded: % requests in % minutes (limit: %)', 
            request_count, p_window_minutes, p_limit;
    END IF;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) TO service_role;

-- 10. Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Webhook security setup completed successfully!';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '📊 Audit logging configured';
    RAISE NOTICE '⚡ Rate limiting implemented';
    RAISE NOTICE '🛡️ User isolation enforced';
END $$;
