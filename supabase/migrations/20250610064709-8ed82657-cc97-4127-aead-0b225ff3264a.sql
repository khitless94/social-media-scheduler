-- Create /oauth/callback route in the main router
-- This will be handled by adding the route to src/main.tsx

-- But first, let's make sure we have the LinkedIn client secret configured
-- Check if we need to add any missing secrets or update the existing oauth flow

-- Also ensure the oauth_credentials table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state ON oauth_sessions(state);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_platform ON oauth_sessions(user_id, platform);