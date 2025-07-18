-- 🔧 FIX POST HISTORY TABLE
-- Quick fix for the post_history table column issue

-- Check if post_history table exists and add missing column
DO $$
BEGIN
    -- Add details column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'post_history' AND column_name = 'details'
    ) THEN
        ALTER TABLE post_history ADD COLUMN details TEXT;
        RAISE NOTICE 'Added details column to post_history table';
    ELSE
        RAISE NOTICE 'Details column already exists in post_history table';
    END IF;
    
    -- Ensure other required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'post_history' AND column_name = 'action'
    ) THEN
        ALTER TABLE post_history ADD COLUMN action TEXT;
        RAISE NOTICE 'Added action column to post_history table';
    END IF;
    
EXCEPTION WHEN undefined_table THEN
    -- Create the post_history table if it doesn't exist
    CREATE TABLE post_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_post_history_post_id ON post_history(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_history_created_at ON post_history(created_at);
    
    -- Grant permissions
    GRANT SELECT, INSERT ON post_history TO authenticated;
    
    RAISE NOTICE 'Created post_history table with all required columns';
END $$;

-- Update the mark_post_as_posted function to handle the fixed table
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
BEGIN
    IF p_success THEN
        UPDATE posts 
        SET 
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = p_post_id AND status = 'ready_for_posting';
        
        -- Log success in post_history table
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'published',
            'Successfully posted: ' || COALESCE(p_platform_response, 'Success'),
            NOW()
        );
        
        RAISE NOTICE 'Marked post % as published', p_post_id;
        
    ELSE
        UPDATE posts 
        SET 
            status = 'failed',
            updated_at = NOW()
        WHERE id = p_post_id AND status = 'ready_for_posting';
        
        -- Log failure in post_history table
        INSERT INTO post_history (post_id, action, details, created_at)
        VALUES (
            p_post_id,
            'failed',
            'Failed to post: ' || COALESCE(p_platform_response, 'Unknown error'),
            NOW()
        );
        
        RAISE NOTICE 'Marked post % as failed', p_post_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_post_as_posted(UUID, BOOLEAN, TEXT, TEXT) TO authenticated;

SELECT 'SUCCESS: Post history table fixed!' as message;

-- Show the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_history'
ORDER BY ordinal_position;
