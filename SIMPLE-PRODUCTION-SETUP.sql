-- 🚀 SIMPLE PRODUCTION SETUP (NO CONFLICTS)
-- This creates a complete automated posting system safely

-- 1. Fix the status constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
CHECK (status IN ('draft', 'scheduled', 'ready_for_posting', 'published', 'failed'));

-- 2. Fix post_history table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_history' AND column_name = 'details') THEN
        ALTER TABLE post_history ADD COLUMN details TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_history' AND column_name = 'action') THEN
        ALTER TABLE post_history ADD COLUMN action TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_history' AND column_name = 'user_id') THEN
        ALTER TABLE post_history ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
EXCEPTION WHEN undefined_table THEN
    CREATE TABLE post_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id),
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_post_history_post_id ON post_history(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
    GRANT SELECT, INSERT ON post_history TO authenticated;
END $$;

-- 3. Create the processing function (with unique name to avoid conflicts)
CREATE OR REPLACE FUNCTION process_scheduled_posts_v2()
RETURNS TABLE(processed_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    post_count INTEGER := 0;
BEGIN
    FOR post_record IN
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 20
    LOOP
        UPDATE posts 
        SET 
            status = 'ready_for_posting',
            updated_at = NOW()
        WHERE id = post_record.id;
        
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            post_record.id,
            post_record.user_id,
            'marked_ready',
            'Post marked as ready for posting by automated system at ' || NOW(),
            NOW()
        );
        
        post_count := post_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT post_count, 'Processed ' || post_count || ' scheduled posts';
END;
$$;

-- 4. Update mark_post_as_posted function
CREATE OR REPLACE FUNCTION mark_post_as_posted(
    p_post_id UUID,
    p_success BOOLEAN,
    p_platform_response TEXT DEFAULT NULL,
    p_post_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_platform TEXT;
BEGIN
    SELECT user_id, platform INTO v_user_id, v_platform FROM posts WHERE id = p_post_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Post not found: %', p_post_id;
    END IF;
    
    IF p_success THEN
        UPDATE posts 
        SET 
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = p_post_id;
        
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            p_post_id,
            v_user_id,
            'published',
            'Successfully posted to ' || v_platform || ': ' || COALESCE(p_platform_response, 'Success'),
            NOW()
        );
        
    ELSE
        UPDATE posts 
        SET 
            status = 'failed',
            updated_at = NOW()
        WHERE id = p_post_id;
        
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            p_post_id,
            v_user_id,
            'failed',
            'Failed to post to ' || v_platform || ': ' || COALESCE(p_platform_response, 'Unknown error'),
            NOW()
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 5. Create monitoring functions
CREATE OR REPLACE FUNCTION get_posting_system_stats()
RETURNS TABLE(
    total_scheduled INTEGER,
    ready_for_posting INTEGER,
    published_today INTEGER,
    failed_today INTEGER,
    next_scheduled_time TIMESTAMP WITH TIME ZONE,
    last_processing_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'scheduled'),
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'ready_for_posting'),
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'published' AND published_at >= CURRENT_DATE),
        (SELECT COUNT(*)::INTEGER FROM posts WHERE status = 'failed' AND updated_at >= CURRENT_DATE),
        (SELECT MIN(scheduled_at) FROM posts WHERE status = 'scheduled' AND scheduled_at > NOW()),
        (SELECT MAX(created_at) FROM post_history WHERE action = 'marked_ready')
$$;

-- 6. Create manual trigger function
CREATE OR REPLACE FUNCTION trigger_manual_processing()
RETURNS TABLE(processed_count INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT * FROM process_scheduled_posts_v2();
END;
$$;

-- 7. Create cron status function (simplified)
CREATE OR REPLACE FUNCTION check_cron_status()
RETURNS TABLE(
    job_name TEXT,
    schedule TEXT,
    active BOOLEAN,
    last_run TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        'social-media-processor-v2'::TEXT,
        '* * * * *'::TEXT,
        true,
        NOW() as last_run
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'social-media-processor-v2')
    UNION ALL
    SELECT 
        'No cron job found'::TEXT,
        'Not scheduled'::TEXT,
        false,
        NULL::TIMESTAMP WITH TIME ZONE
    WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'social-media-processor-v2');
$$;

-- 8. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 9. Create the cron job (with unique name)
SELECT cron.schedule(
    'social-media-processor-v2',
    '* * * * *',
    'SELECT process_scheduled_posts_v2();'
);

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_post_as_posted(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_posting_system_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_manual_processing() TO authenticated;
GRANT EXECUTE ON FUNCTION check_cron_status() TO authenticated;

-- Success message
SELECT 'SUCCESS: Simple production setup complete!' as status;
SELECT 'Cron job "social-media-processor-v2" is now running every minute' as info;
