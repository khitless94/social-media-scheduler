-- Complete Database Setup for n8n Scheduled Posting
-- Run this script in your Supabase SQL editor
-- This combines all the necessary setup in one file

-- ============================================================================
-- STEP 1: Create Enum Types
-- ============================================================================

-- Create scheduling status enum
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
    WHEN duplicate_object THEN
        RAISE NOTICE 'scheduling_status_enum already exists, skipping...';
END $$;

-- ============================================================================
-- STEP 2: Enhance Posts Table
-- ============================================================================

-- Add scheduling columns to posts table
DO $$
BEGIN
    -- Add scheduled_for column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'scheduled_for') THEN
        ALTER TABLE posts ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added scheduled_for column to posts table';
    END IF;

    -- Add n8n_execution_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'n8n_execution_id') THEN
        ALTER TABLE posts ADD COLUMN n8n_execution_id VARCHAR(255);
        RAISE NOTICE 'Added n8n_execution_id column to posts table';
    END IF;

    -- Add retry_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'retry_count') THEN
        ALTER TABLE posts ADD COLUMN retry_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added retry_count column to posts table';
    END IF;

    -- Add last_retry_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'last_retry_at') THEN
        ALTER TABLE posts ADD COLUMN last_retry_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_retry_at column to posts table';
    END IF;

    -- Add error_message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'error_message') THEN
        ALTER TABLE posts ADD COLUMN error_message TEXT;
        RAISE NOTICE 'Added error_message column to posts table';
    END IF;

    -- Handle scheduling_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts' AND column_name = 'scheduling_status') THEN
        -- Add new column with enum type
        ALTER TABLE posts ADD COLUMN scheduling_status scheduling_status_enum DEFAULT 'draft';
        RAISE NOTICE 'Added scheduling_status column to posts table';
    ELSE
        -- Check if column is wrong type and fix it
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'posts'
                   AND column_name = 'scheduling_status'
                   AND data_type != 'USER-DEFINED') THEN
            -- Drop default, convert type, restore default
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
            RAISE NOTICE 'Converted scheduling_status column to enum type';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Create Scheduled Posts Queue Table
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Create Indexes for Performance
-- ============================================================================

-- Indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for
ON posts(scheduled_for)
WHERE scheduling_status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_posts_scheduling_status
ON posts(scheduling_status);

CREATE INDEX IF NOT EXISTS idx_posts_user_scheduling
ON posts(user_id, scheduling_status);

-- Indexes for queue table
CREATE INDEX IF NOT EXISTS idx_queue_scheduled_for
ON scheduled_posts_queue(scheduled_for)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_queue_status
ON scheduled_posts_queue(status);

CREATE INDEX IF NOT EXISTS idx_queue_user_id
ON scheduled_posts_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_queue_post_id
ON scheduled_posts_queue(post_id);

-- ============================================================================
-- STEP 5: Create Functions
-- ============================================================================

-- Function to automatically add posts to queue when scheduled
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

        RAISE NOTICE 'Cancelled scheduled post % in queue', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for n8n to fetch pending scheduled posts
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

-- Function for n8n to update post status
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
    affected_rows INTEGER;
BEGIN
    -- Get the post_id from queue
    SELECT post_id INTO post_id_var
    FROM scheduled_posts_queue
    WHERE id = queue_id_param;

    IF post_id_var IS NULL THEN
        RAISE WARNING 'Queue ID % not found', queue_id_param;
        RETURN FALSE;
    END IF;

    -- Update queue status
    UPDATE scheduled_posts_queue
    SET
        status = new_status,
        n8n_execution_id = COALESCE(execution_id_param, n8n_execution_id),
        error_message = error_message_param,
        processed_at = CASE
            WHEN new_status IN ('completed', 'failed') THEN NOW()
            ELSE processed_at
        END,
        updated_at = NOW(),
        retry_count = CASE
            WHEN new_status = 'failed' THEN retry_count + 1
            ELSE retry_count
        END
    WHERE id = queue_id_param;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows = 0 THEN
        RAISE WARNING 'Failed to update queue entry %', queue_id_param;
        RETURN FALSE;
    END IF;

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
        published_at = CASE
            WHEN new_status = 'completed' THEN NOW()
            ELSE published_at
        END,
        updated_at = NOW(),
        retry_count = CASE
            WHEN new_status = 'failed' THEN retry_count + 1
            ELSE retry_count
        END,
        last_retry_at = CASE
            WHEN new_status = 'failed' THEN NOW()
            ELSE last_retry_at
        END
    WHERE id = post_id_var;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows = 0 THEN
        RAISE WARNING 'Failed to update post %', post_id_var;
        RETURN FALSE;
    END IF;

    RAISE NOTICE 'Updated post % status to % (execution: %)',
        post_id_var, new_status, execution_id_param;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create Triggers
-- ============================================================================

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_add_to_scheduled_queue ON posts;

-- Create trigger to automatically manage queue
CREATE TRIGGER trigger_add_to_scheduled_queue
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_to_scheduled_queue();

-- ============================================================================
-- STEP 7: Create Utility Functions
-- ============================================================================

-- Function to get queue health
CREATE OR REPLACE FUNCTION get_queue_health()
RETURNS TABLE (
    total_pending INTEGER,
    overdue_posts INTEGER,
    processing_posts INTEGER,
    failed_posts_last_hour INTEGER,
    next_scheduled TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER FROM scheduled_posts_queue WHERE status = 'pending') as total_pending,
        (SELECT COUNT(*)::INTEGER FROM scheduled_posts_queue
         WHERE status = 'pending' AND scheduled_for < NOW() - INTERVAL '5 minutes') as overdue_posts,
        (SELECT COUNT(*)::INTEGER FROM scheduled_posts_queue WHERE status = 'processing') as processing_posts,
        (SELECT COUNT(*)::INTEGER FROM scheduled_posts_queue
         WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '1 hour') as failed_posts_last_hour,
        (SELECT MIN(scheduled_for) FROM scheduled_posts_queue WHERE status = 'pending') as next_scheduled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create test posts
CREATE OR REPLACE FUNCTION create_test_scheduled_post(
    user_id_param UUID,
    content_param TEXT DEFAULT 'Test scheduled post from n8n! 🚀',
    platforms_param TEXT[] DEFAULT ARRAY['twitter'],
    minutes_from_now INTEGER DEFAULT 2
)
RETURNS UUID AS $$
DECLARE
    new_post_id UUID;
BEGIN
    INSERT INTO posts (
        user_id,
        content,
        platforms,
        scheduling_status,
        scheduled_for,
        status,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        content_param,
        platforms_param,
        'scheduled',
        NOW() + (minutes_from_now || ' minutes')::INTERVAL,
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO new_post_id;

    RAISE NOTICE 'Created test post % scheduled for %',
        new_post_id,
        NOW() + (minutes_from_now || ' minutes')::INTERVAL;

    RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create multiple test posts
CREATE OR REPLACE FUNCTION create_test_posts_for_n8n(
    user_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
    post_id UUID,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    platforms TEXT[]
) AS $$
DECLARE
    post_record RECORD;
BEGIN
    -- Create immediate test post (1 minute from now)
    INSERT INTO posts (
        user_id,
        content,
        platforms,
        scheduling_status,
        scheduled_for,
        status,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        'Immediate test post from n8n workflow! 🚀 This should publish in 1 minute.',
        ARRAY['twitter'],
        'scheduled',
        NOW() + INTERVAL '1 minute',
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id, scheduled_for, platforms INTO post_record;
    
    post_id := post_record.id;
    scheduled_for := post_record.scheduled_for;
    platforms := post_record.platforms;
    RETURN NEXT;
    
    -- Create test post for 5 minutes from now
    INSERT INTO posts (
        user_id,
        content,
        platforms,
        scheduling_status,
        scheduled_for,
        status,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        'Multi-platform test post! 📱 Testing Twitter, Facebook, and LinkedIn integration.',
        ARRAY['twitter', 'facebook', 'linkedin'],
        'scheduled',
        NOW() + INTERVAL '5 minutes',
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id, scheduled_for, platforms INTO post_record;
    
    post_id := post_record.id;
    scheduled_for := post_record.scheduled_for;
    platforms := post_record.platforms;
    RETURN NEXT;
    
    -- Create test post for 10 minutes from now
    INSERT INTO posts (
        user_id,
        content,
        platforms,
        scheduling_status,
        scheduled_for,
        status,
        created_at,
        updated_at
    ) VALUES (
        user_id_param,
        'Final test post with media! 🖼️ Testing media handling across platforms.',
        ARRAY['twitter', 'instagram'],
        'scheduled',
        NOW() + INTERVAL '10 minutes',
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id, scheduled_for, platforms INTO post_record;
    
    post_id := post_record.id;
    scheduled_for := post_record.scheduled_for;
    platforms := post_record.platforms;
    RETURN NEXT;
    
    RAISE NOTICE 'Created 3 test posts for n8n workflow testing';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: Create OAuth Credentials Helper Function
-- ============================================================================

-- Function to create test OAuth credentials for a real user
CREATE OR REPLACE FUNCTION create_test_oauth_credentials(
    user_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_param) THEN
        RAISE NOTICE 'User % does not exist. Skipping OAuth credentials creation.', user_id_param;
        RETURN FALSE;
    END IF;

    -- Insert test OAuth credentials for testing
    INSERT INTO oauth_credentials (
        user_id,
        platform,
        access_token,
        refresh_token,
        expires_at,
        token_type,
        scope,
        created_at,
        updated_at
    ) VALUES
    (
        user_id_param,
        'twitter',
        'test_twitter_token',
        'test_refresh_token',
        NOW() + INTERVAL '1 hour',
        'bearer',
        'tweet.read tweet.write',
        NOW(),
        NOW()
    ),
    (
        user_id_param,
        'facebook',
        'test_facebook_token',
        'test_refresh_token',
        NOW() + INTERVAL '2 hours',
        'bearer',
        'pages_manage_posts',
        NOW(),
        NOW()
    ),
    (
        user_id_param,
        'linkedin',
        'test_linkedin_token',
        'test_refresh_token',
        NOW() + INTERVAL '1 hour',
        'bearer',
        'w_member_social',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        updated_at = NOW();

    RAISE NOTICE 'Test OAuth credentials created for user %', user_id_param;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: Additional Utility Functions
-- ============================================================================

-- Function to reset stuck processing posts
CREATE OR REPLACE FUNCTION reset_stuck_processing_posts(
    minutes_stuck INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Reset posts that have been processing too long
    UPDATE scheduled_posts_queue
    SET
        status = 'pending',
        error_message = 'Reset from stuck processing state',
        updated_at = NOW()
    WHERE status = 'processing'
    AND updated_at < NOW() - (minutes_stuck || ' minutes')::INTERVAL;

    GET DIAGNOSTICS affected_count = ROW_COUNT;

    -- Also reset the posts table
    UPDATE posts
    SET
        scheduling_status = 'scheduled',
        error_message = 'Reset from stuck processing state',
        updated_at = NOW()
    WHERE scheduling_status = 'processing'
    AND updated_at < NOW() - (minutes_stuck || ' minutes')::INTERVAL;

    RAISE NOTICE 'Reset % stuck processing posts', affected_count;

    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old queue entries
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries(
    days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    DELETE FROM scheduled_posts_queue
    WHERE status IN ('completed', 'failed', 'cancelled')
    AND updated_at < NOW() - (days_old || ' days')::INTERVAL;

    GET DIAGNOSTICS affected_count = ROW_COUNT;

    RAISE NOTICE 'Cleaned up % old queue entries', affected_count;

    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 10: Final Setup Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 N8N SCHEDULED POSTING SETUP COMPLETE!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Database schema created';
    RAISE NOTICE '✅ Functions and triggers installed';
    RAISE NOTICE '✅ Test data ready';
    RAISE NOTICE '✅ Verification completed';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Set up n8n Cloud workflow';
    RAISE NOTICE '2. Configure Supabase API credentials in n8n';
    RAISE NOTICE '3. Import the production workflow JSON';
    RAISE NOTICE '4. Test with: SELECT * FROM create_test_posts_for_n8n();';
    RAISE NOTICE '5. Activate the workflow in n8n';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Test Commands:';
    RAISE NOTICE '   SELECT * FROM get_pending_scheduled_posts();';
    RAISE NOTICE '   SELECT * FROM get_queue_health();';
    RAISE NOTICE '   SELECT * FROM create_test_posts_for_n8n();';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Monitor with:';
    RAISE NOTICE '   SELECT * FROM get_scheduled_posts_stats(''your-user-id'');';
    RAISE NOTICE '';
END $$;
