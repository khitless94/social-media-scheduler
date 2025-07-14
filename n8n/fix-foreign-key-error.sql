-- Fix Foreign Key Constraint Error for n8n OAuth Credentials
-- This script handles the Supabase auth system properly

-- OPTION 1: Remove foreign key constraint (Recommended for testing)
-- This allows you to use test data without creating actual auth users

-- 1. Drop the existing table and recreate without foreign key
DROP TABLE IF EXISTS oauth_credentials CASCADE;

CREATE TABLE oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Removed foreign key constraint
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'instagram')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  platform_user_id TEXT,
  platform_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_expires_at ON oauth_credentials(expires_at);

-- 3. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_oauth_credentials_updated_at ON oauth_credentials;
CREATE TRIGGER update_oauth_credentials_updated_at
    BEFORE UPDATE ON oauth_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Insert test OAuth credentials (this will now work)
INSERT INTO oauth_credentials (user_id, platform, access_token, refresh_token, expires_at, scope, platform_user_id, platform_username)
VALUES 
  (
    '12345678-1234-1234-1234-123456789abc',
    'twitter',
    'test_twitter_access_token_123',
    'test_twitter_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'tweet.read tweet.write users.read',
    'twitter_user_123',
    'test_twitter_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'facebook',
    'test_facebook_access_token_123',
    'test_facebook_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'pages_manage_posts pages_read_engagement',
    'facebook_user_123',
    'test_facebook_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'linkedin',
    'test_linkedin_access_token_123',
    'test_linkedin_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'w_member_social',
    'linkedin_user_123',
    'test_linkedin_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'reddit',
    'test_reddit_access_token_123',
    'test_reddit_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'submit identity',
    'reddit_user_123',
    'test_reddit_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'instagram',
    'test_instagram_access_token_123',
    'test_instagram_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'instagram_basic instagram_content_publish',
    'instagram_user_123',
    'test_instagram_user'
  )
ON CONFLICT (user_id, platform) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

-- 5. Create helper function for n8n
CREATE OR REPLACE FUNCTION get_user_oauth_credentials(p_user_id UUID, p_platform TEXT)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  platform TEXT,
  user_id UUID,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oc.access_token,
    oc.refresh_token,
    oc.expires_at,
    oc.platform,
    oc.user_id,
    (oc.expires_at < NOW()) as is_expired
  FROM oauth_credentials oc
  WHERE oc.user_id = p_user_id 
    AND oc.platform = p_platform
    AND oc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant permissions (adjust based on your needs)
-- For testing, we'll make it accessible to all authenticated users
GRANT ALL ON oauth_credentials TO authenticated;
GRANT ALL ON oauth_credentials TO anon; -- For testing only
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID, TEXT) TO anon; -- For testing only

-- 7. Disable RLS for testing (enable later for production)
ALTER TABLE oauth_credentials DISABLE ROW LEVEL SECURITY;

-- 8. Verification - this should now work
SELECT 'Test data inserted successfully' as status, 
       count(*) as record_count,
       array_agg(platform) as platforms
FROM oauth_credentials 
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- 9. Test the helper function
SELECT 'Helper function test' as test_name, * 
FROM get_user_oauth_credentials('12345678-1234-1234-1234-123456789abc', 'twitter');

-- 10. Show all test data
SELECT 'All test credentials' as info, user_id, platform, 
       LEFT(access_token, 20) || '...' as token_preview,
       expires_at > NOW() as is_valid
FROM oauth_credentials 
WHERE user_id = '12345678-1234-1234-1234-123456789abc'
ORDER BY platform;
