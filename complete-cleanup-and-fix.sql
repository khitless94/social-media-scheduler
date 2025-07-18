-- Step 1: Find and drop ALL versions of the problematic function
SELECT 
    routine_name, 
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'create_scheduled_post_bypass_rls';

-- Step 2: Drop ALL versions of the function
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls() CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, VARCHAR, TIMESTAMP WITH TIME ZONE) CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, VARCHAR, TIMESTAMP WITH TIME ZONE, TEXT) CASCADE;

-- Step 3: Create the correct function that uses the posts table
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
    -- Insert into the POSTS table (not scheduled_posts)
    INSERT INTO posts (
        user_id,
        content,
        platform,
        scheduled_at,  -- Note: using scheduled_at, not scheduled_for
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT) TO anon;

-- Step 5: Test the function
SELECT create_scheduled_post_bypass_rls(
    'a26953d6-0008-4f6c-bf86-e7cf384ff45e'::UUID,
    'Test post from corrected function',
    'twitter',
    NOW() + INTERVAL '1 hour'
);

-- Step 6: Verify it worked
SELECT id, content, platform, status, scheduled_at 
FROM posts 
WHERE status = 'scheduled' 
ORDER BY created_at DESC 
LIMIT 3;
