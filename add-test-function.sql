-- Quick fix: Add the missing create_test_scheduled_post function
-- Run this in Supabase SQL Editor to fix Test 4

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
DECLARE
    test_post_id UUID;
BEGIN
    RAISE NOTICE '🧪 Testing create_test_scheduled_post function...';
    
    -- Create a test post
    SELECT create_test_scheduled_post() INTO test_post_id;
    
    IF test_post_id IS NOT NULL THEN
        RAISE NOTICE '✅ Test function works! Created post: %', test_post_id;
        
        -- Clean up the test post
        DELETE FROM scheduled_posts_queue WHERE post_id = test_post_id;
        DELETE FROM posts WHERE id = test_post_id;
        RAISE NOTICE '🧹 Cleaned up test post';
    ELSE
        RAISE NOTICE '❌ Test function failed!';
    END IF;


RAISE NOTICE '✅ create_test_scheduled_post function added successfully!';
END $$;