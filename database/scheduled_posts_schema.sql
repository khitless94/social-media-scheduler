-- Enhanced posts table for n8n scheduled posting
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS n8n_execution_id VARCHAR(255);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create enum for scheduling status first
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

-- Add scheduling_status column with proper enum type and default
DO $$ BEGIN
    -- Check if column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'scheduling_status') THEN
        ALTER TABLE posts ADD COLUMN scheduling_status scheduling_status_enum DEFAULT 'draft';
    ELSE
        -- If column exists but is wrong type, fix it
        ALTER TABLE posts ALTER COLUMN scheduling_status DROP DEFAULT;
        ALTER TABLE posts ALTER COLUMN scheduling_status TYPE scheduling_status_enum
        USING CASE
            WHEN scheduling_status = 'draft' THEN 'draft'::scheduling_status_enum
            WHEN scheduling_status = 'scheduled' THEN 'scheduled'::scheduling_status_enum
            WHEN scheduling_status = 'processing' THEN 'processing'::scheduling_status_enum
            WHEN scheduling_status = 'published' THEN 'published'::scheduling_status_enum
            WHEN scheduling_status = 'failed' THEN 'failed'::scheduling_status_enum
            WHEN scheduling_status = 'cancelled' THEN 'cancelled'::scheduling_status_enum
            ELSE 'draft'::scheduling_status_enum
        END;
        ALTER TABLE posts ALTER COLUMN scheduling_status SET DEFAULT 'draft';
    END IF;
END $$;

-- Create index for efficient querying of scheduled posts
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for) WHERE scheduling_status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_scheduling_status ON posts(scheduling_status);

-- Create scheduled_posts_queue table for n8n integration
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
    retry_count INTEGER DEFAULT 0
);

-- Create indexes for queue table
CREATE INDEX IF NOT EXISTS idx_queue_scheduled_for ON scheduled_posts_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_queue_status ON scheduled_posts_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_user_id ON scheduled_posts_queue(user_id);

-- Create function to automatically add to queue when post is scheduled
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
            updated_at = NOW();
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
    AFTER UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_to_scheduled_queue();

-- Create RLS policies for scheduled_posts_queue
ALTER TABLE scheduled_posts_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled posts queue" ON scheduled_posts_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts queue" ON scheduled_posts_queue
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function for n8n to fetch pending posts
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
                    'expires_at', oc.expires_at
                )
            ) FILTER (WHERE oc.platform IS NOT NULL),
            '{}'::jsonb
        ) as oauth_credentials
    FROM scheduled_posts_queue q
    JOIN posts p ON q.post_id = p.id
    LEFT JOIN oauth_credentials oc ON p.user_id = oc.user_id
    WHERE q.status = 'pending' 
    AND q.scheduled_for <= NOW()
    GROUP BY q.id, p.id, p.user_id, p.content, p.platforms, p.media_urls, q.scheduled_for;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    post_id_var UUID;
BEGIN
    -- Get the post_id from queue
    SELECT post_id INTO post_id_var FROM scheduled_posts_queue WHERE id = queue_id_param;
    
    IF post_id_var IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update queue status
    UPDATE scheduled_posts_queue 
    SET 
        status = new_status,
        n8n_execution_id = COALESCE(execution_id_param, n8n_execution_id),
        error_message = error_message_param,
        processed_at = CASE WHEN new_status IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
        updated_at = NOW()
    WHERE id = queue_id_param;
    
    -- Update post status
    UPDATE posts 
    SET 
        scheduling_status = CASE 
            WHEN new_status = 'completed' THEN 'published'::scheduling_status_enum
            WHEN new_status = 'failed' THEN 'failed'::scheduling_status_enum
            WHEN new_status = 'processing' THEN 'processing'::scheduling_status_enum
            ELSE scheduling_status
        END,
        status = CASE 
            WHEN new_status = 'completed' THEN 'published'
            ELSE status
        END,
        n8n_execution_id = COALESCE(execution_id_param, n8n_execution_id),
        error_message = error_message_param,
        platform_post_ids = COALESCE(platform_post_ids_param, platform_post_ids),
        published_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE published_at END,
        updated_at = NOW()
    WHERE id = post_id_var;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
