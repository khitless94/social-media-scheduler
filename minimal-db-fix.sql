-- Minimal Database Fix for OAuth Token Storage Issues
-- This creates clean tables without trying to migrate existing problematic data

-- 1. Drop existing tables completely (this will remove all data but fix the structure)
DROP TABLE IF EXISTS oauth_credentials CASCADE;
DROP TABLE IF EXISTS social_tokens CASCADE;
DROP TABLE IF EXISTS oauth_sessions CASCADE;

-- 2. Create oauth_credentials table with proper structure
CREATE TABLE oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 3. Create social_tokens table with proper structure
CREATE TABLE social_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 4. Create oauth_sessions table with proper structure
CREATE TABLE oauth_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  code_verifier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on all tables
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies that work for both service role and authenticated users
CREATE POLICY "oauth_credentials_policy" ON oauth_credentials
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.uid() = user_id
  );

CREATE POLICY "social_tokens_policy" ON social_tokens
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.uid() = user_id
  );

CREATE POLICY "oauth_sessions_policy" ON oauth_sessions
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.uid() = user_id
  );

-- 7. Grant permissions
GRANT ALL ON oauth_credentials TO service_role, authenticated;
GRANT ALL ON social_tokens TO service_role, authenticated;
GRANT ALL ON oauth_sessions TO service_role, authenticated;

-- 8. Create indexes for performance
CREATE INDEX idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX idx_social_tokens_user_platform ON social_tokens(user_id, platform);
CREATE INDEX idx_oauth_sessions_state ON oauth_sessions(state);
CREATE INDEX idx_oauth_sessions_expires_at ON oauth_sessions(expires_at);

-- 9. Verify the setup
SELECT 'Database tables recreated successfully' as status;
