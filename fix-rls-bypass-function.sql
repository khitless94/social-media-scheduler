-- Fix RLS bypass function - drop and recreate
-- Run this in your Supabase SQL Editor

-- Drop the existing function first
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(uuid,text,text[],timestamp with time zone,text[]);

-- Create the new function
CREATE OR REPLACE FUNCTION create_scheduled_post_bypass_rls(
    p_user_id UUID,
    p_content TEXT,
    p_platforms TEXT[],
    p_scheduled_for TIMESTAMPTZ,
    p_media_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
    primary_platform TEXT;
BEGIN
    primary_platform := COALESCE(p_platforms[1], 'twitter');
    
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
        primary_platform,
        p_platforms,
        p_media_urls,
        'scheduled',
        'scheduled',
        p_scheduled_for,
        NOW(),
        NOW()
    ) RETURNING id INTO new_post_id;

    INSERT INTO scheduled_posts_queue (
        post_id,
        user_id,
        scheduled_for,
        status,
        created_at,
        updated_at
    ) VALUES (
        new_post_id,
        p_user_id,
        p_scheduled_for,
        'pending',
        NOW(),
        NOW()
    ) ON CONFLICT (post_id) DO UPDATE SET
        scheduled_for = p_scheduled_for,
        status = 'pending',
        updated_at = NOW(),
        error_message = NULL,
        retry_count = 0;
    
    RETURN new_post_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls TO authenticated;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls TO anon;
