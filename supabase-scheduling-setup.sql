-- Supabase Scheduling Setup
-- Run this in your Supabase SQL Editor

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create a function to process scheduled posts
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    response_data JSONB;
BEGIN
    -- Get posts that are ready to be published
    FOR post_record IN 
        SELECT sp.*, oc.access_token, oc.platform as oauth_platform
        FROM scheduled_posts sp
        JOIN oauth_credentials oc ON sp.user_id = oc.user_id 
        WHERE sp.scheduled_time <= NOW() 
        AND sp.posted = false
        AND oc.platform = ANY(string_to_array(sp.platform, ','))
        ORDER BY sp.scheduled_time ASC
        LIMIT 10
    LOOP
        BEGIN
            -- Call the Edge Function to post to social media
            SELECT content INTO response_data
            FROM http((
                'POST',
                current_setting('app.supabase_url') || '/functions/v1/post-to-social-media',
                ARRAY[
                    http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')),
                    http_header('Content-Type', 'application/json')
                ],
                jsonb_build_object(
                    'post_id', post_record.id,
                    'platform', post_record.platform,
                    'content', post_record.content,
                    'image_url', post_record.image_url,
                    'title', post_record.title,
                    'access_token', post_record.access_token
                )::text
            )::http_request);

            -- Mark as posted if successful
            UPDATE scheduled_posts 
            SET posted = true, 
                posted_at = NOW(), 
                updated_at = NOW()
            WHERE id = post_record.id;

            -- Log success
            INSERT INTO post_logs (post_id, status, message, created_at)
            VALUES (post_record.id, 'success', 'Posted successfully', NOW());

        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue processing other posts
            INSERT INTO post_logs (post_id, status, message, error_details, created_at)
            VALUES (
                post_record.id, 
                'error', 
                'Failed to post: ' || SQLERRM,
                jsonb_build_object('error', SQLERRM, 'sqlstate', SQLSTATE),
                NOW()
            );
        END;
    END LOOP;
END;
$$;

-- 3. Create a log table for tracking
CREATE TABLE IF NOT EXISTS post_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES scheduled_posts(id),
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'retry'
    message TEXT,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Schedule the function to run every minute
SELECT cron.schedule(
    'process-scheduled-posts',
    '* * * * *', -- Every minute
    'SELECT process_scheduled_posts();'
);

-- 5. Create a simple monitoring view
CREATE OR REPLACE VIEW scheduled_posts_status AS
SELECT 
    sp.id,
    sp.content,
    sp.platform,
    sp.scheduled_time,
    sp.posted,
    sp.posted_at,
    pl.status as last_status,
    pl.message as last_message,
    pl.created_at as last_attempt
FROM scheduled_posts sp
LEFT JOIN LATERAL (
    SELECT status, message, created_at
    FROM post_logs 
    WHERE post_id = sp.id 
    ORDER BY created_at DESC 
    LIMIT 1
) pl ON true
ORDER BY sp.scheduled_time DESC;

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;

-- 7. Test the setup
-- SELECT process_scheduled_posts(); -- Uncomment to test manually
