-- Add Reddit subreddit columns to user_preferences table
-- Production-ready migration for subreddit management

-- First, ensure the user_preferences table exists with proper structure
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  marketing_notifications BOOLEAN DEFAULT true,
  security_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add Reddit columns if they don't exist
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS reddit_subreddits JSONB DEFAULT '["testingground4bots"]'::jsonb,
ADD COLUMN IF NOT EXISTS default_reddit_subreddit TEXT DEFAULT 'testingground4bots';

-- Enable RLS if not already enabled
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON user_preferences;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON user_preferences;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_preferences;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_preferences;

-- Create production-ready RLS policies that work with upsert operations
CREATE POLICY "Enable read access for users based on user_id" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create an index on reddit columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_reddit_subreddits ON user_preferences USING GIN (reddit_subreddits);

-- Add a comment to document the table structure
COMMENT ON TABLE user_preferences IS 'User preferences including notification settings and Reddit subreddit preferences';
COMMENT ON COLUMN user_preferences.reddit_subreddits IS 'JSONB array of user''s preferred subreddits for posting';
COMMENT ON COLUMN user_preferences.default_reddit_subreddit IS 'User''s default subreddit for Reddit posts';
