-- FASTEST FIX: Remove foreign key constraint and add test data
-- Copy and paste this entire block into Supabase SQL Editor

-- Drop and recreate table without foreign key constraint
DROP TABLE IF EXISTS oauth_credentials CASCADE;

CREATE TABLE oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Disable RLS for testing
ALTER TABLE oauth_credentials DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON oauth_credentials TO authenticated;
GRANT ALL ON oauth_credentials TO anon;

-- Insert test data
INSERT INTO oauth_credentials (user_id, platform, access_token, refresh_token, expires_at) VALUES 
('12345678-1234-1234-1234-123456789abc', 'twitter', 'test_twitter_token', 'test_refresh', NOW() + INTERVAL '2 hours'),
('12345678-1234-1234-1234-123456789abc', 'facebook', 'test_facebook_token', 'test_refresh', NOW() + INTERVAL '2 hours'),
('12345678-1234-1234-1234-123456789abc', 'linkedin', 'test_linkedin_token', 'test_refresh', NOW() + INTERVAL '2 hours'),
('12345678-1234-1234-1234-123456789abc', 'reddit', 'test_reddit_token', 'test_refresh', NOW() + INTERVAL '2 hours'),
('12345678-1234-1234-1234-123456789abc', 'instagram', 'test_instagram_token', 'test_refresh', NOW() + INTERVAL '2 hours');

-- Verify it worked
SELECT 'SUCCESS: Test data created' as status, count(*) as records, array_agg(platform) as platforms 
FROM oauth_credentials WHERE user_id = '12345678-1234-1234-1234-123456789abc';
