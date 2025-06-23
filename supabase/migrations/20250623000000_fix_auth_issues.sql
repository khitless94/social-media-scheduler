-- Fix authentication and RLS issues
-- This migration fixes the 401 errors by properly setting up RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "oauth_credentials_select_policy" ON oauth_credentials;
DROP POLICY IF EXISTS "oauth_credentials_insert_policy" ON oauth_credentials;
DROP POLICY IF EXISTS "oauth_credentials_update_policy" ON oauth_credentials;
DROP POLICY IF EXISTS "oauth_credentials_delete_policy" ON oauth_credentials;

DROP POLICY IF EXISTS "social_tokens_select_policy" ON social_tokens;
DROP POLICY IF EXISTS "social_tokens_insert_policy" ON social_tokens;
DROP POLICY IF EXISTS "social_tokens_update_policy" ON social_tokens;
DROP POLICY IF EXISTS "social_tokens_delete_policy" ON social_tokens;

DROP POLICY IF EXISTS "post_history_select_policy" ON post_history;
DROP POLICY IF EXISTS "post_history_insert_policy" ON post_history;
DROP POLICY IF EXISTS "post_history_update_policy" ON post_history;
DROP POLICY IF EXISTS "post_history_delete_policy" ON post_history;

-- Ensure tables exist with correct structure
CREATE TABLE IF NOT EXISTS oauth_credentials (
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

CREATE TABLE IF NOT EXISTS post_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'posted',
  post_id TEXT,
  post_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Create simple, working RLS policies for oauth_credentials
CREATE POLICY "oauth_credentials_policy" ON oauth_credentials
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Create simple, working RLS policies for social_tokens  
CREATE POLICY "social_tokens_policy" ON social_tokens
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Create simple, working RLS policies for post_history
CREATE POLICY "post_history_policy" ON post_history
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Grant necessary permissions to authenticated users
GRANT ALL ON oauth_credentials TO authenticated, service_role;
GRANT ALL ON social_tokens TO authenticated, service_role;
GRANT ALL ON post_history TO authenticated, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_platform ON social_tokens(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_created_at ON post_history(created_at DESC);

-- Verify the fix by selecting a test query (this will help debug)
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reset and simplified';
  RAISE NOTICE 'Tables: oauth_credentials, social_tokens, post_history';
  RAISE NOTICE 'All tables now allow access for authenticated users and service role';
END $$;
