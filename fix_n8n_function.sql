-- Fix n8n function for scheduled posts
-- Run this in your Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_pending_scheduled_posts();

-- Create the function that n8n needs
CREATE OR REPLACE FUNCTION get_pending_scheduled_posts()
RETURNS TABLE (
    queue_id UUID,
    post_id UUID,
    user_id UUID,
    content TEXT,
    platforms TEXT[],
    media_urls TEXT[],
    scheduled_for TIMESTAMP WITH TIME ZONE,
    oauth_credentials JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id as queue_id,
        p.id as post_id,
        p.user_id,
        p.content,
        p.platforms,
        p.media_urls,
        q.scheduled_for,
        COALESCE(
            jsonb_object_agg(
                oc.platform,
                jsonb_build_object(
                    'access_token', oc.access_token,
                    'refresh_token', oc.refresh_token,
                    'expires_at', oc.expires_at,
                    'token_type', oc.token_type,
                    'scope', oc.scope
                )
            ) FILTER (WHERE oc.platform IS NOT NULL),
            '{}'::jsonb
        ) as oauth_credentials
    FROM scheduled_posts_queue q
    JOIN posts p ON q.post_id = p.id
    LEFT JOIN oauth_credentials oc ON p.user_id = oc.user_id
    WHERE q.status = 'pending'
    AND q.scheduled_for <= NOW()
    AND p.scheduling_status = 'scheduled'
    GROUP BY q.id, p.id, p.user_id, p.content, p.platforms, p.media_urls, q.scheduled_for
    ORDER BY q.scheduled_for ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the scheduled_posts_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS scheduled_posts_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    n8n_execution_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    UNIQUE(post_id) -- Ensure one queue entry per post
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_status_scheduled 
ON scheduled_posts_queue(status, scheduled_for) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE scheduled_posts_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own scheduled posts queue" ON scheduled_posts_queue;
CREATE POLICY "Users can view their own scheduled posts queue" ON scheduled_posts_queue
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all queue entries" ON scheduled_posts_queue;
CREATE POLICY "Service role can manage all queue entries" ON scheduled_posts_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger function to automatically add posts to queue
CREATE OR REPLACE FUNCTION add_to_scheduled_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- If post is being scheduled, add to queue
    IF NEW.scheduling_status = 'scheduled' AND NEW.scheduled_for IS NOT NULL THEN
        INSERT INTO scheduled_posts_queue (post_id, user_id, scheduled_for)
        VALUES (NEW.id, NEW.user_id, NEW.scheduled_for)
        ON CONFLICT (post_id) DO UPDATE SET
            scheduled_for = NEW.scheduled_for,
            status = 'pending',
            updated_at = NOW(),
            error_message = NULL,
            retry_count = 0;

        RAISE NOTICE 'Added post % to scheduled queue for %', NEW.id, NEW.scheduled_for;
    END IF;

    -- If post is cancelled, update queue
    IF NEW.scheduling_status = 'cancelled' THEN
        UPDATE scheduled_posts_queue 
        SET status = 'cancelled', updated_at = NOW()
        WHERE post_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_add_to_scheduled_queue ON posts;
CREATE TRIGGER trigger_add_to_scheduled_queue
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_to_scheduled_queue();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;
GRANT EXECUTE ON FUNCTION add_to_scheduled_queue() TO service_role;

-- Create function for n8n to update post status
CREATE OR REPLACE FUNCTION update_scheduled_post_status(
    queue_id_param UUID,
    new_status TEXT,
    execution_id_param TEXT DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL,
    platform_post_ids_param JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    post_record RECORD;
BEGIN
    -- Get the post info from queue
    SELECT q.post_id, q.user_id INTO post_record
    FROM scheduled_posts_queue q
    WHERE q.id = queue_id_param;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Queue entry not found: %', queue_id_param;
    END IF;

    -- Update the queue entry
    UPDATE scheduled_posts_queue
    SET 
        status = new_status,
        n8n_execution_id = COALESCE(execution_id_param, n8n_execution_id),
        error_message = error_message_param,
        processed_at = CASE WHEN new_status IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
        updated_at = NOW(),
        retry_count = CASE WHEN new_status = 'failed' THEN retry_count + 1 ELSE retry_count END
    WHERE id = queue_id_param;

    -- Update the main posts table
    UPDATE posts
    SET 
        scheduling_status = CASE 
            WHEN new_status = 'completed' THEN 'published'
            WHEN new_status = 'failed' THEN 'failed'
            ELSE scheduling_status
        END,
        status = CASE 
            WHEN new_status = 'completed' THEN 'published'
            WHEN new_status = 'failed' THEN 'failed'
            ELSE status
        END,
        platform_post_ids = COALESCE(platform_post_ids_param, platform_post_ids),
        error_message = error_message_param,
        published_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE published_at END,
        updated_at = NOW()
    WHERE id = post_record.post_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- Add any missing columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS n8n_execution_id VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- Create enum for scheduling status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE scheduling_status_enum AS ENUM (
        'draft',
        'scheduled',
        'processing',
        'published',
        'failed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add scheduling_status column if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduling_status scheduling_status_enum DEFAULT 'draft';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'n8n function setup completed successfully!';
    RAISE NOTICE 'Function created: get_pending_scheduled_posts()';
    RAISE NOTICE 'Function created: update_scheduled_post_status()';
    RAISE NOTICE 'Table created: scheduled_posts_queue';
    RAISE NOTICE 'Trigger created: trigger_add_to_scheduled_queue';
END $$;
