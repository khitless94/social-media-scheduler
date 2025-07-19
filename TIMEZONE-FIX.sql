-- 🕐 TIMEZONE FIX FOR SCHEDULING
-- This fixes timezone issues in the scheduling system

-- 1. Add timezone column to posts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'user_timezone') THEN
        ALTER TABLE posts ADD COLUMN user_timezone TEXT DEFAULT 'UTC';
        RAISE NOTICE 'Added user_timezone column to posts table';
    END IF;
END $$;

-- 2. Create function to fix existing timezone issues
CREATE OR REPLACE FUNCTION fix_post_timezone(
    p_post_id UUID,
    p_correct_local_time TIMESTAMP,
    p_user_timezone TEXT DEFAULT 'Asia/Kolkata'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the post with correct local time and timezone
    UPDATE posts 
    SET 
        scheduled_at = p_correct_local_time AT TIME ZONE p_user_timezone,
        user_timezone = p_user_timezone,
        updated_at = NOW()
    WHERE id = p_post_id;
    
    -- Log the timezone fix
    INSERT INTO post_history (post_id, user_id, action, details, created_at)
    SELECT 
        p_post_id,
        user_id,
        'timezone_fixed',
        'Fixed timezone from ' || scheduled_at || ' to ' || p_correct_local_time || ' (' || p_user_timezone || ')',
        NOW()
    FROM posts WHERE id = p_post_id;
    
    RETURN TRUE;
END;
$$;

-- 3. Create function to get posts in user's local timezone
CREATE OR REPLACE FUNCTION get_posts_in_timezone(
    p_user_id UUID,
    p_timezone TEXT DEFAULT 'Asia/Kolkata'
)
RETURNS TABLE(
    id UUID,
    content TEXT,
    platform TEXT,
    status TEXT,
    scheduled_at_local TIMESTAMP,
    scheduled_at_utc TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.content,
        p.platform,
        p.status,
        (p.scheduled_at AT TIME ZONE 'UTC' AT TIME ZONE p_timezone) as scheduled_at_local,
        p.scheduled_at as scheduled_at_utc,
        p.created_at
    FROM posts p
    WHERE p.user_id = p_user_id
    ORDER BY p.scheduled_at DESC;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION fix_post_timezone(UUID, TIMESTAMP, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_in_timezone(UUID, TEXT) TO authenticated;

-- 5. Quick fix for your current post (adjust the time as needed)
-- Replace 'your-post-id' with the actual UUID of your LinkedIn post
-- Replace '2025-07-19 11:41:00' with your intended local time

-- Example usage (uncomment and modify):
-- SELECT fix_post_timezone(
--     'your-post-id-here'::UUID,
--     '2025-07-19 11:41:00'::TIMESTAMP,
--     'Asia/Kolkata'
-- );

SELECT 'SUCCESS: Timezone fix functions created!' as status;
SELECT 'Use fix_post_timezone() to correct your LinkedIn post time' as info;
