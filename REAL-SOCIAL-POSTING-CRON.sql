-- 🚀 REAL SOCIAL POSTING CRON: Actually posts to social media from database
-- This creates a cron job that calls your existing Supabase Edge Function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Clean up existing functions and jobs
DROP FUNCTION IF EXISTS process_scheduled_posts CASCADE;
DROP FUNCTION IF EXISTS call_social_media_api CASCADE;

-- Remove existing cron jobs
DO $$
BEGIN
    PERFORM cron.unschedule('process-scheduled-posts');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create function that actually calls your social media API
CREATE OR REPLACE FUNCTION call_social_media_api(
    p_user_id UUID,
    p_content TEXT,
    p_platform TEXT,
    p_image_url TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, response_text TEXT, post_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_url TEXT := 'https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social';
    request_body JSONB;
    response_data JSONB;
    http_response http_response;
    service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; -- Replace with your actual service role key
BEGIN
    -- Prepare request body
    request_body := jsonb_build_object(
        'content', p_content,
        'platforms', jsonb_build_array(p_platform),
        'user_id', p_user_id
    );
    
    -- Add image if provided
    IF p_image_url IS NOT NULL THEN
        request_body := request_body || jsonb_build_object('image', p_image_url);
    END IF;
    
    RAISE NOTICE 'Calling social media API for user % platform % with content: %', 
        p_user_id, p_platform, left(p_content, 50);
    
    -- Make HTTP request to your Edge Function
    SELECT * INTO http_response FROM http((
        'POST',
        api_url,
        ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('apikey', service_role_key)
        ],
        'application/json',
        request_body::text
    )::http_request);
    
    -- Parse response
    IF http_response.status = 200 THEN
        BEGIN
            response_data := http_response.content::jsonb;
            
            -- Check if the API call was successful
            IF response_data->>'success' = 'true' THEN
                RETURN QUERY SELECT 
                    TRUE as success,
                    COALESCE(response_data->>'message', 'Posted successfully') as response_text,
                    COALESCE(response_data->>'url', '') as post_url;
            ELSE
                RETURN QUERY SELECT 
                    FALSE as success,
                    COALESCE(response_data->>'error', 'API call failed') as response_text,
                    '' as post_url;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                FALSE as success,
                'Failed to parse API response: ' || SQLERRM as response_text,
                '' as post_url;
        END;
    ELSE
        RETURN QUERY SELECT 
            FALSE as success,
            'HTTP ' || http_response.status || ': ' || COALESCE(http_response.content, 'Unknown error') as response_text,
            '' as post_url;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        FALSE as success,
        'Exception calling API: ' || SQLERRM as response_text,
        '' as post_url;
END;
$$;

-- Create enhanced processing function that actually posts to social media
CREATE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    api_result RECORD;
    processed_count INTEGER := 0;
    failed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting scheduled posts processing at %', NOW();
    
    -- Find posts ready for processing
    FOR post_record IN 
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 5  -- Process max 5 posts per run to avoid rate limits
    LOOP
        BEGIN
            RAISE NOTICE 'Processing post % for platform %', post_record.id, post_record.platform;
            
            -- Mark post as processing
            UPDATE posts 
            SET 
                status = 'processing',
                updated_at = NOW()
            WHERE id = post_record.id;
            
            -- Call the social media API
            SELECT * INTO api_result 
            FROM call_social_media_api(
                post_record.user_id,
                post_record.content,
                post_record.platform,
                post_record.image_url
            );
            
            -- Update post based on API response
            IF api_result.success THEN
                UPDATE posts 
                SET 
                    status = 'published',
                    published_at = NOW(),
                    updated_at = NOW()
                WHERE id = post_record.id;
                
                -- Log success
                INSERT INTO post_history (post_id, action, details, created_at)
                VALUES (
                    post_record.id,
                    'published',
                    'Successfully posted to ' || post_record.platform || ': ' || api_result.response_text,
                    NOW()
                ) ON CONFLICT DO NOTHING;
                
                processed_count := processed_count + 1;
                RAISE NOTICE 'Successfully posted to %: % - %', 
                    post_record.platform, post_record.id, api_result.response_text;
            ELSE
                -- Mark as failed
                UPDATE posts 
                SET 
                    status = 'failed',
                    updated_at = NOW()
                WHERE id = post_record.id;
                
                -- Log failure
                INSERT INTO post_history (post_id, action, details, created_at)
                VALUES (
                    post_record.id,
                    'failed',
                    'Failed to post to ' || post_record.platform || ': ' || api_result.response_text,
                    NOW()
                ) ON CONFLICT DO NOTHING;
                
                failed_count := failed_count + 1;
                RAISE NOTICE 'Failed to post to %: % - %', 
                    post_record.platform, post_record.id, api_result.response_text;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Handle any errors
            UPDATE posts 
            SET 
                status = 'failed',
                updated_at = NOW()
            WHERE id = post_record.id;
            
            -- Log error
            INSERT INTO post_history (post_id, action, details, created_at)
            VALUES (
                post_record.id,
                'error',
                'Exception during processing: ' || SQLERRM,
                NOW()
            ) ON CONFLICT DO NOTHING;
            
            failed_count := failed_count + 1;
            RAISE NOTICE 'Exception processing post %: %', post_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Log summary
    IF processed_count > 0 OR failed_count > 0 THEN
        RAISE NOTICE 'Cron run completed at %. Processed: %, Failed: %', 
            NOW(), processed_count, failed_count;
    END IF;
END;
$$;

-- Create post_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, action, created_at)
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;
GRANT EXECUTE ON FUNCTION call_social_media_api(UUID, TEXT, TEXT, TEXT) TO postgres;

-- Create the cron job (every 2 minutes to avoid rate limits)
SELECT cron.schedule(
    'process-scheduled-posts',
    '*/2 * * * *',  -- Every 2 minutes
    'SELECT process_scheduled_posts();'
);

-- Create monitoring view
CREATE OR REPLACE VIEW real_social_posting_monitor AS
SELECT 
    p.id,
    p.content,
    p.platform,
    p.status,
    p.scheduled_at,
    p.published_at,
    p.created_at,
    p.updated_at,
    CASE 
        WHEN p.status = 'scheduled' AND p.scheduled_at <= NOW() THEN 'Ready for processing'
        WHEN p.status = 'processing' THEN 'Currently posting to social media'
        WHEN p.status = 'scheduled' AND p.scheduled_at > NOW() THEN 'Waiting for schedule time'
        WHEN p.status = 'published' THEN 'Successfully posted to social media'
        WHEN p.status = 'failed' THEN 'Failed to post to social media'
        ELSE p.status
    END as processing_status,
    EXTRACT(EPOCH FROM (NOW() - p.scheduled_at))/60 as minutes_since_scheduled,
    (SELECT COUNT(*) FROM post_history ph WHERE ph.post_id = p.id) as history_count,
    (SELECT details FROM post_history ph WHERE ph.post_id = p.id ORDER BY created_at DESC LIMIT 1) as last_action_details
FROM posts p
WHERE p.status IN ('scheduled', 'processing', 'published', 'failed')
ORDER BY 
    CASE p.status 
        WHEN 'processing' THEN 1 
        WHEN 'scheduled' THEN 2 
        WHEN 'failed' THEN 3 
        WHEN 'published' THEN 4 
    END,
    p.scheduled_at DESC;

-- Grant view access
GRANT SELECT ON real_social_posting_monitor TO authenticated;
GRANT SELECT ON post_history TO authenticated;

-- Show results
SELECT 'SUCCESS: Real social posting cron created!' as message;
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-posts';

-- Final instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 REAL SOCIAL POSTING CRON SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What happens now:';
    RAISE NOTICE '1. Cron runs every 2 minutes';
    RAISE NOTICE '2. Finds posts where status=''scheduled'' and scheduled_at <= NOW()';
    RAISE NOTICE '3. Calls your existing /functions/v1/post-to-social API';
    RAISE NOTICE '4. Actually posts to Twitter, LinkedIn, Facebook, etc.';
    RAISE NOTICE '5. Updates status to ''published'' or ''failed''';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Monitor with:';
    RAISE NOTICE '• SELECT * FROM real_social_posting_monitor;';
    RAISE NOTICE '• SELECT * FROM post_history ORDER BY created_at DESC;';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ IMPORTANT: Update the service_role_key in the function!';
    RAISE NOTICE '';
END $$;
