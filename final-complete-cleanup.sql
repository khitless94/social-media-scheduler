-- COMPLETE CLEANUP: Remove ALL triggers and problematic functions

-- Step 1: Find and drop ALL triggers on posts table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'posts';

-- Drop ALL triggers on posts table
DROP TRIGGER IF EXISTS add_to_scheduled_queue_trigger ON posts CASCADE;
DROP TRIGGER IF EXISTS sync_posts_to_queue_trigger ON posts CASCADE;
DROP TRIGGER IF EXISTS trigger_add_to_scheduled_queue ON posts CASCADE;
DROP TRIGGER IF EXISTS scheduled_posts_trigger ON posts CASCADE;

-- Step 2: Drop ALL related functions with CASCADE
DROP FUNCTION IF EXISTS add_to_scheduled_queue() CASCADE;
DROP FUNCTION IF EXISTS sync_posts_to_queue() CASCADE;
DROP FUNCTION IF EXISTS add_to_scheduled_queue(UUID) CASCADE;
DROP FUNCTION IF EXISTS add_to_scheduled_queue(UUID, TEXT) CASCADE;

-- Step 3: Drop ALL versions of create_scheduled_post_bypass_rls
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls() CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, VARCHAR, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, VARCHAR, TIMESTAMP WITH TIME ZONE, TEXT) CASCADE;

-- Step 4: Create the CLEAN function that ONLY uses posts table
CREATE FUNCTION create_scheduled_post_bypass_rls(
    p_user_id UUID,
    p_content TEXT,
    p_platform TEXT,
    p_scheduled_for TIMESTAMP WITH TIME ZONE,
    p_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
BEGIN
    -- Insert ONLY into posts table, NO triggers will fire
    INSERT INTO posts (
        user_id,
        content,
        platform,
        scheduled_at,
        image_url,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_content,
        p_platform,
        p_scheduled_for,
        p_image_url,
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO new_post_id;
    
    RETURN new_post_id;
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) TO anon;

-- Step 6: Verify no triggers remain
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'posts';

-- Step 7: Test the function (should work without any trigger errors)
SELECT create_scheduled_post_bypass_rls(
    'a26953d6-0008-4f6c-bf86-e7cf384ff45e'::UUID,
    'Clean test post - no triggers',
    'twitter',
    NOW() + INTERVAL '2 hours'
);

-- Step 8: Verify it worked
SELECT id, content, platform, status, scheduled_at 
FROM posts 
WHERE content LIKE '%Clean test post%'
ORDER BY created_at DESC;
