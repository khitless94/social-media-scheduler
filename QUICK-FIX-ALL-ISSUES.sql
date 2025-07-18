-- 🚀 QUICK FIX FOR ALL DATABASE ISSUES
-- This fixes both the constraint and post_history table issues

-- 1. Fix the status constraint to allow all needed statuses
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
CHECK (status IN ('draft', 'scheduled', 'ready_for_posting', 'published', 'failed'));

-- 2. Fix post_history table
DO $$
BEGIN
    -- Add details column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_history' AND column_name = 'details'
    ) THEN
        ALTER TABLE post_history ADD COLUMN details TEXT;
        RAISE NOTICE 'Added details column to post_history table';
    END IF;

    -- Add action column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_history' AND column_name = 'action'
    ) THEN
        ALTER TABLE post_history ADD COLUMN action TEXT;
        RAISE NOTICE 'Added action column to post_history table';
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_history' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE post_history ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added user_id column to post_history table';
    END IF;

EXCEPTION WHEN undefined_table THEN
    -- Create the post_history table if it doesn't exist
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

    RAISE NOTICE 'Created post_history table';
END $$;

-- 3. Update the mark_post_as_posted function
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
BEGIN
    -- Get the user_id from the post
    SELECT user_id INTO v_user_id FROM posts WHERE id = p_post_id;

    IF p_success THEN
        UPDATE posts
        SET
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = p_post_id;

        -- Log success with user_id
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            p_post_id,
            v_user_id,
            'published',
            'Successfully posted: ' || COALESCE(p_platform_response, 'Success'),
            NOW()
        );

    ELSE
        UPDATE posts
        SET
            status = 'failed',
            updated_at = NOW()
        WHERE id = p_post_id;

        -- Log failure with user_id
        INSERT INTO post_history (post_id, user_id, action, details, created_at)
        VALUES (
            p_post_id,
            v_user_id,
            'failed',
            'Failed to post: ' || COALESCE(p_platform_response, 'Unknown error'),
            NOW()
        );
    END IF;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_post_as_posted(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

SELECT 'SUCCESS: All database issues fixed!' as message;
SELECT 'Posts can now be saved and marked as posted properly' as status;
