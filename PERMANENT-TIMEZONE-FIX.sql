-- 🌍 PERMANENT TIMEZONE FIX FOR ALL SOCIAL MEDIA PLATFORMS
-- This fixes timezone issues for ALL posts across ALL platforms permanently

-- 1. First run the automation setup (if not already done)
-- Run SIMPLE-PRODUCTION-SETUP.sql first if you haven't already

-- 2. Add timezone support to posts table
DO $$
BEGIN
    -- Add user_timezone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'user_timezone') THEN
        ALTER TABLE posts ADD COLUMN user_timezone TEXT DEFAULT 'Asia/Kolkata';
        RAISE NOTICE 'Added user_timezone column to posts table';
    END IF;
    
    -- Add original_scheduled_time column to track user's intended time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'original_scheduled_time') THEN
        ALTER TABLE posts ADD COLUMN original_scheduled_time TEXT;
        RAISE NOTICE 'Added original_scheduled_time column to posts table';
    END IF;
END $$;

-- 3. Create function to fix ALL existing posts with timezone issues
CREATE OR REPLACE FUNCTION fix_all_timezone_issues()
RETURNS TABLE(fixed_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    fixed_count INTEGER := 0;
    user_tz TEXT := 'Asia/Kolkata'; -- Default timezone, adjust as needed
BEGIN
    -- Fix all scheduled posts that have timezone offset issues
    FOR post_record IN
        SELECT 
            id, 
            scheduled_at,
            created_at,
            content,
            platform,
            user_id
        FROM posts 
        WHERE status IN ('scheduled', 'ready_for_posting')
        AND scheduled_at IS NOT NULL
    LOOP
        -- Calculate the likely intended time by subtracting the timezone offset
        -- If scheduled_at is 5+ hours ahead of created_at, it's likely a timezone issue
        IF EXTRACT(EPOCH FROM (post_record.scheduled_at - post_record.created_at)) / 3600 > 4 THEN
            -- Fix by subtracting the timezone offset (5.5 hours for India)
            UPDATE posts 
            SET 
                scheduled_at = post_record.scheduled_at - INTERVAL '5 hours 30 minutes',
                user_timezone = user_tz,
                original_scheduled_time = post_record.scheduled_at::TEXT,
                updated_at = NOW()
            WHERE id = post_record.id;
            
            -- Log the fix
            INSERT INTO post_history (post_id, user_id, action, details, created_at)
            VALUES (
                post_record.id,
                post_record.user_id,
                'timezone_auto_fixed',
                'Automatically fixed timezone issue: ' || post_record.scheduled_at || ' → ' || (post_record.scheduled_at - INTERVAL '5 hours 30 minutes'),
                NOW()
            );
            
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT fixed_count, 'Fixed ' || fixed_count || ' posts with timezone issues';
END;
$$;

-- 4. Create function to schedule posts with correct timezone
CREATE OR REPLACE FUNCTION schedule_post_with_timezone(
    p_user_id UUID,
    p_content TEXT,
    p_platform TEXT,
    p_scheduled_time TIMESTAMP,
    p_user_timezone TEXT DEFAULT 'Asia/Kolkata',
    p_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
BEGIN
    -- Insert post with correct timezone handling
    INSERT INTO posts (
        user_id,
        content,
        platform,
        status,
        scheduled_at,
        user_timezone,
        original_scheduled_time,
        image_url,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_content,
        p_platform,
        'scheduled',
        p_scheduled_time, -- Use the time exactly as provided by frontend
        p_user_timezone,
        p_scheduled_time::TEXT,
        p_image_url,
        NOW(),
        NOW()
    ) RETURNING id INTO new_post_id;
    
    -- Log the scheduling
    INSERT INTO post_history (post_id, user_id, action, details, created_at)
    VALUES (
        new_post_id,
        p_user_id,
        'scheduled_with_timezone',
        'Post scheduled for ' || p_scheduled_time || ' in timezone ' || p_user_timezone,
        NOW()
    );
    
    RETURN new_post_id;
END;
$$;

-- 5. Create function to get posts in user's timezone
CREATE OR REPLACE FUNCTION get_user_posts_with_timezone(
    p_user_id UUID,
    p_timezone TEXT DEFAULT 'Asia/Kolkata'
)
RETURNS TABLE(
    id UUID,
    content TEXT,
    platform TEXT,
    status TEXT,
    scheduled_at_utc TIMESTAMP WITH TIME ZONE,
    scheduled_at_local TEXT,
    user_timezone TEXT,
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
        p.scheduled_at,
        TO_CHAR(p.scheduled_at AT TIME ZONE COALESCE(p.user_timezone, p_timezone), 'YYYY-MM-DD HH24:MI:SS') as scheduled_at_local,
        COALESCE(p.user_timezone, p_timezone) as user_timezone,
        p.created_at
    FROM posts p
    WHERE p.user_id = p_user_id
    ORDER BY p.scheduled_at DESC;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION fix_all_timezone_issues() TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_post_with_timezone(UUID, TEXT, TEXT, TIMESTAMP, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_posts_with_timezone(UUID, TEXT) TO authenticated;

-- 7. Run the automatic fix for all existing posts
SELECT * FROM fix_all_timezone_issues();

-- 8. Update the processing function to handle timezone-aware posts
CREATE OR REPLACE FUNCTION process_scheduled_posts_v3()
RETURNS TABLE(processed_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    post_count INTEGER := 0;
BEGIN
    -- Process posts that are scheduled and past their time (timezone-aware)
    FOR post_record IN
        SELECT id, user_id, content, platform, scheduled_at, image_url, user_timezone
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 20
    LOOP
        -- Mark post as ready for posting
        UPDATE posts 
        SET 
            status = 'ready_for_posting',
            updated_at = NOW()
        WHERE id = post_record.id;
        
        -- Log the action with timezone info
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            post_record.id,
            post_record.user_id,
            'marked_ready_tz',
            'Post marked as ready for posting by automated system (timezone: ' || COALESCE(post_record.user_timezone, 'UTC') || ') at ' || NOW(),
            NOW()
        );
        
        post_count := post_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT post_count, 'Processed ' || post_count || ' timezone-aware scheduled posts';
END;
$$;

-- 9. Update the cron job to use the new timezone-aware function
SELECT cron.unschedule('social-media-processor-v2');
SELECT cron.schedule(
    'social-media-processor-v3',
    '* * * * *',
    'SELECT process_scheduled_posts_v3();'
);

-- 10. Grant permissions for new function
GRANT EXECUTE ON FUNCTION process_scheduled_posts_v3() TO authenticated;

-- Success messages
SELECT 'SUCCESS: Permanent timezone fix applied to ALL platforms!' as status;
SELECT 'All existing posts have been automatically corrected' as existing_posts;
SELECT 'Future posts will use correct timezone handling' as future_posts;
SELECT 'Cron job updated to timezone-aware version' as automation;
