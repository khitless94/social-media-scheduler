-- Fix RLS policies for oauth_credentials and social_tokens tables
-- This will resolve the 401 Unauthorized errors when querying these tables

-- First, drop all existing conflicting policies
DROP POLICY IF EXISTS "Users can view their own oauth credentials" ON oauth_credentials;
DROP POLICY IF EXISTS "Users can insert their own oauth credentials" ON oauth_credentials;
DROP POLICY IF EXISTS "Users can update their own oauth credentials" ON oauth_credentials;
DROP POLICY IF EXISTS "Users can delete their own oauth credentials" ON oauth_credentials;
DROP POLICY IF EXISTS "Service role can manage oauth credentials" ON oauth_credentials;

DROP POLICY IF EXISTS "Users can view their own social tokens" ON social_tokens;
DROP POLICY IF EXISTS "Users can insert their own social tokens" ON social_tokens;
DROP POLICY IF EXISTS "Users can update their own social tokens" ON social_tokens;
DROP POLICY IF EXISTS "Users can delete their own social tokens" ON social_tokens;
DROP POLICY IF EXISTS "Service role can manage social tokens" ON social_tokens;

-- Create new, working RLS policies for oauth_credentials
CREATE POLICY "oauth_credentials_select_policy" ON oauth_credentials
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "oauth_credentials_insert_policy" ON oauth_credentials
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "oauth_credentials_update_policy" ON oauth_credentials
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "oauth_credentials_delete_policy" ON oauth_credentials
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Create new, working RLS policies for social_tokens
CREATE POLICY "social_tokens_select_policy" ON social_tokens
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "social_tokens_insert_policy" ON social_tokens
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "social_tokens_update_policy" ON social_tokens
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

CREATE POLICY "social_tokens_delete_policy" ON social_tokens
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Ensure proper permissions are granted
GRANT ALL ON oauth_credentials TO authenticated;
GRANT ALL ON oauth_credentials TO service_role;
GRANT ALL ON social_tokens TO authenticated;
GRANT ALL ON social_tokens TO service_role;

-- Also fix oauth_sessions policies
DROP POLICY IF EXISTS "Users can view their own oauth sessions" ON oauth_sessions;
DROP POLICY IF EXISTS "Users can insert their own oauth sessions" ON oauth_sessions;
DROP POLICY IF EXISTS "Users can update their own oauth sessions" ON oauth_sessions;
DROP POLICY IF EXISTS "Users can delete their own oauth sessions" ON oauth_sessions;
DROP POLICY IF EXISTS "Service role can manage oauth sessions" ON oauth_sessions;

CREATE POLICY "oauth_sessions_all_policy" ON oauth_sessions
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

GRANT ALL ON oauth_sessions TO authenticated;
GRANT ALL ON oauth_sessions TO service_role;
