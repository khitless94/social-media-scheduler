-- Debug database structure and add test data for n8n workflow
-- Run this in your Supabase SQL Editor

-- 1. Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check scheduled_posts table structure (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduled_posts' 
ORDER BY ordinal_position;

-- 3. Check posts table structure (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- 4. Check oauth_credentials table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'oauth_credentials' 
ORDER BY ordinal_position;

-- 5. Create scheduled_posts table if it doesn't exist (matching your n8n workflow)
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'instagram')),
    content TEXT NOT NULL,
    image_url TEXT,
    title TEXT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    posted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create oauth_credentials table if it doesn't exist (matching your n8n workflow)
CREATE TABLE IF NOT EXISTS oauth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ,
    scope TEXT,
    platform_user_id TEXT,
    platform_username TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- 7. Create a test user ID (you can replace this with a real user ID from auth.users)
-- First, let's see if there are any users
SELECT id, email FROM auth.users LIMIT 5;

-- 8. Insert test scheduled posts (replace the user_id with an actual user ID)
-- You'll need to update the user_id values below with real UUIDs from your auth.users table

INSERT INTO scheduled_posts (user_id, platform, content, scheduled_time) VALUES
('00000000-0000-0000-0000-000000000001', 'twitter', 'Test tweet scheduled for now!', NOW() - INTERVAL '1 minute'),
('00000000-0000-0000-0000-000000000001', 'linkedin', 'Test LinkedIn post scheduled for now!', NOW() - INTERVAL '2 minutes'),
('00000000-0000-0000-0000-000000000001', 'facebook', 'Test Facebook post scheduled for now!', NOW() - INTERVAL '3 minutes')
ON CONFLICT DO NOTHING;

-- 9. Insert test OAuth credentials (replace user_id with actual user ID)
INSERT INTO oauth_credentials (user_id, platform, access_token, refresh_token) VALUES
('00000000-0000-0000-0000-000000000001', 'twitter', 'test_twitter_token', 'test_twitter_refresh'),
('00000000-0000-0000-0000-000000000001', 'linkedin', 'test_linkedin_token', 'test_linkedin_refresh'),
('00000000-0000-0000-0000-000000000001', 'facebook', 'test_facebook_token', 'test_facebook_refresh')
ON CONFLICT (user_id, platform) DO UPDATE SET
access_token = EXCLUDED.access_token,
refresh_token = EXCLUDED.refresh_token,
updated_at = NOW();

-- 10. Test the exact query your n8n workflow is using
SELECT * FROM scheduled_posts WHERE scheduled_time <= NOW() AND posted = false LIMIT 10;

-- 11. Test the OAuth query your n8n workflow is using
SELECT access_token, refresh_token, platform, token_type, expires_at 
FROM oauth_credentials 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID 
AND platform = 'twitter' 
AND access_token IS NOT NULL 
ORDER BY updated_at DESC 
LIMIT 1;

-- 12. Check if there are any existing posts in any posts-related tables
SELECT 'scheduled_posts' as table_name, COUNT(*) as count FROM scheduled_posts
UNION ALL
SELECT 'posts' as table_name, COUNT(*) as count FROM posts WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts')
UNION ALL
SELECT 'oauth_credentials' as table_name, COUNT(*) as count FROM oauth_credentials;
