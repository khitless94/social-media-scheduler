-- Create RLS bypass function for scheduled posts
-- Run this in your Supabase SQL Editor

-- First, create the bypass function
CREATE OR REPLACE FUNCTION create_scheduled_post_bypass_rls(
    p_user_id UUID,
    p_content TEXT,
    p_platforms TEXT[],
    p_scheduled_for TIMESTAMPTZ,
    p_media_urls TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
AS $$
DECLARE
    new_post_id UUID;
    primary_platform TEXT;
BEGIN
    -- Get primary platform (first one in array)
    primary_platform := COALESCE(p_platforms[1], 'twitter');
    
    -- Insert the post with elevated privileges (bypasses RLS)
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

    -- Add to scheduled queue
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

    -- Log success
    RAISE NOTICE 'Successfully created scheduled post % for user %', new_post_id, p_user_id;
    
    RETURN new_post_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        RAISE NOTICE 'Error in create_scheduled_post_bypass_rls: %', SQLERRM;
        -- Re-raise the error
        RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls TO authenticated;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls TO anon;

-- Test the function
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with a real user ID for testing
    test_post_id UUID;
BEGIN
    -- Only run test if we have a valid user ID
    IF test_user_id != '00000000-0000-0000-0000-000000000000' THEN
        SELECT create_scheduled_post_bypass_rls(
            test_user_id,
            'Test post from RLS bypass function',
            ARRAY['twitter', 'instagram'],
            NOW() + INTERVAL '5 minutes',
            ARRAY[]::TEXT[]
        ) INTO test_post_id;
        
        RAISE NOTICE '✅ Test successful! Created post ID: %', test_post_id;
    ELSE
        RAISE NOTICE '⚠️ Skipping test - update test_user_id with a real user ID to test';
    END IF;
END;
$$;

-- Verify the function was created and show success message
DO $$
BEGIN
    -- Check if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'create_scheduled_post_bypass_rls'
    ) THEN
        RAISE NOTICE '🎉 RLS bypass function created successfully!';
        RAISE NOTICE '🧪 Test your app now - it should bypass RLS completely';
    ELSE
        RAISE NOTICE '❌ Function creation failed';
    END IF;
END;
$$;
