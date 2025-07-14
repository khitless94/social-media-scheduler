-- Complete Database Setup for n8n Social Media Scheduler
-- Run this in your Supabase SQL Editor

-- 1. Ensure oauth_credentials table exists with correct structure
DROP TABLE IF EXISTS oauth_credentials CASCADE;

CREATE TABLE oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 2. Create scheduled_posts table for future use
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'published', 'failed')),
  platform_post_id TEXT,
  platform_specific_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_expires_at ON oauth_credentials(expires_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- 4. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_oauth_credentials_updated_at ON oauth_credentials;
CREATE TRIGGER update_oauth_credentials_updated_at
    BEFORE UPDATE ON oauth_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert test data for n8n workflow testing
-- First, create a test user if it doesn't exist
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '12345678-1234-1234-1234-123456789abc',
  'test@example.com',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Test User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert test OAuth credentials for all platforms
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

-- 7. Insert test scheduled posts
INSERT INTO scheduled_posts (user_id, platform, content, title, scheduled_for, platform_specific_data)
VALUES 
  (
    '12345678-1234-1234-1234-123456789abc',
    'twitter',
    'This is a test tweet from the n8n social media scheduler! 🚀 #automation #n8n',
    NULL,
    NOW() + INTERVAL '5 minutes',
    '{"hashtags": ["automation", "n8n"], "mentions": []}'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'facebook',
    'Testing the Facebook integration with our n8n workflow. This post should appear on the timeline! 📱',
    'Test Facebook Post',
    NOW() + INTERVAL '10 minutes',
    '{"privacy": "public", "link": null}'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'linkedin',
    'Professional update: Successfully integrated LinkedIn posting with our n8n automation workflow. Great for scheduled content! 💼',
    NULL,
    NOW() + INTERVAL '15 minutes',
    '{"visibility": "PUBLIC"}'
  );

-- 8. Create helper functions for n8n
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

-- 9. Create function to get pending posts (for scheduled workflow)
CREATE OR REPLACE FUNCTION get_pending_scheduled_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  platform TEXT,
  content TEXT,
  title TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  platform_specific_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.platform,
    sp.content,
    sp.title,
    sp.scheduled_for,
    sp.platform_specific_data
  FROM scheduled_posts sp
  WHERE sp.status = 'scheduled'
    AND sp.scheduled_for <= NOW()
  ORDER BY sp.scheduled_for ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 10. Grant necessary permissions
GRANT ALL ON oauth_credentials TO authenticated;
GRANT ALL ON scheduled_posts TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO authenticated;

-- 11. Create RLS policies
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- OAuth credentials policies
CREATE POLICY "Users can view their own oauth credentials" ON oauth_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth credentials" ON oauth_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth credentials" ON oauth_credentials
  FOR UPDATE USING (auth.uid() = user_id);

-- Scheduled posts policies
CREATE POLICY "Users can view their own scheduled posts" ON scheduled_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts" ON scheduled_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts" ON scheduled_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 12. Verification queries
SELECT 'oauth_credentials table created' as status, count(*) as test_records 
FROM oauth_credentials 
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

SELECT 'scheduled_posts table created' as status, count(*) as test_records 
FROM scheduled_posts 
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- Test the helper function
SELECT 'Helper function test' as status, * 
FROM get_user_oauth_credentials('12345678-1234-1234-1234-123456789abc', 'twitter');
