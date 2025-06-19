-- Fix OAuth Sessions Table Structure
-- Update the oauth_sessions table to match the expected structure

-- First, check if the table exists and update its structure
DO $$ 
BEGIN
    -- Add state column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'oauth_sessions' AND column_name = 'state'
    ) THEN
        ALTER TABLE oauth_sessions ADD COLUMN state TEXT;
    END IF;

    -- Add code_verifier column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'oauth_sessions' AND column_name = 'code_verifier'
    ) THEN
        ALTER TABLE oauth_sessions ADD COLUMN code_verifier TEXT;
    END IF;

    -- Add platform column if it doesn't exist (should already exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'oauth_sessions' AND column_name = 'platform'
    ) THEN
        ALTER TABLE oauth_sessions ADD COLUMN platform TEXT NOT NULL;
    END IF;
END $$;

-- Create social_tokens table if it doesn't exist (for backward compatibility)
CREATE TABLE IF NOT EXISTS social_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Enable RLS on social_tokens
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for social_tokens table
CREATE POLICY "Users can view their own social tokens" ON social_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social tokens" ON social_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social tokens" ON social_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social tokens" ON social_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON oauth_sessions TO authenticated;
GRANT ALL ON social_tokens TO authenticated;
