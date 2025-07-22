-- Manual fix for user_preferences RLS
-- Copy and paste this into Supabase SQL Editor

-- Add columns if they don't exist
DO $$ 
BEGIN
    -- Add reddit_subreddits column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'reddit_subreddits'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN reddit_subreddits JSONB DEFAULT '["test"]'::jsonb;
    END IF;
    
    -- Add default_reddit_subreddit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'default_reddit_subreddit'
    ) THEN
        ALTER TABLE user_preferences 
        ADD COLUMN default_reddit_subreddit TEXT DEFAULT 'test';
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they work correctly
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON user_preferences;

-- Create new policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Test the setup
SELECT 'RLS policies created successfully' as status;
