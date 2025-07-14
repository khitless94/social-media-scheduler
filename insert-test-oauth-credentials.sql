-- Insert test OAuth credentials for testing n8n workflow
-- Run this AFTER running create-oauth-credentials-function.sql

-- Insert test OAuth credentials for different platforms
-- Replace the user_id with actual user IDs from your auth.users table

-- You can get user IDs by running: SELECT id, email FROM auth.users;

-- Test Twitter credentials
INSERT INTO user_oauth_credentials (
    user_id,
    platform,
    access_token,
    refresh_token,
    token_expires_at,
    scope,
    platform_user_id,
    platform_username,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111', -- Replace with actual user ID
    'twitter',
    'test_twitter_access_token_123',
    'test_twitter_refresh_token_123',
    NOW() + INTERVAL '1 hour',
    'tweet.read tweet.write users.read',
    'twitter_user_123',
    'test_twitter_user',
    true
) ON CONFLICT (user_id, platform) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = NOW();

-- Test LinkedIn credentials
INSERT INTO user_oauth_credentials (
    user_id,
    platform,
    access_token,
    refresh_token,
    token_expires_at,
    scope,
    platform_user_id,
    platform_username,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111', -- Replace with actual user ID
    'linkedin',
    'test_linkedin_access_token_123',
    'test_linkedin_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'w_member_social',
    'linkedin_user_123',
    'test_linkedin_user',
    true
) ON CONFLICT (user_id, platform) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = NOW();

-- Test Reddit credentials
INSERT INTO user_oauth_credentials (
    user_id,
    platform,
    access_token,
    refresh_token,
    token_expires_at,
    scope,
    platform_user_id,
    platform_username,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111', -- Replace with actual user ID
    'reddit',
    'test_reddit_access_token_123',
    'test_reddit_refresh_token_123',
    NOW() + INTERVAL '1 hour',
    'submit identity',
    'reddit_user_123',
    'test_reddit_user',
    true
) ON CONFLICT (user_id, platform) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = NOW();

-- Test Facebook credentials
INSERT INTO user_oauth_credentials (
    user_id,
    platform,
    access_token,
    refresh_token,
    token_expires_at,
    scope,
    platform_user_id,
    platform_username,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111', -- Replace with actual user ID
    'facebook',
    'test_facebook_access_token_123',
    'test_facebook_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'pages_manage_posts pages_read_engagement',
    'facebook_user_123',
    'test_facebook_user',
    true
) ON CONFLICT (user_id, platform) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = NOW();

-- Test Instagram credentials
INSERT INTO user_oauth_credentials (
    user_id,
    platform,
    access_token,
    refresh_token,
    token_expires_at,
    scope,
    platform_user_id,
    platform_username,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111', -- Replace with actual user ID
    'instagram',
    'test_instagram_access_token_123',
    'test_instagram_refresh_token_123',
    NOW() + INTERVAL '1 hour',
    'instagram_basic instagram_content_publish',
    'instagram_user_123',
    'test_instagram_user',
    true
) ON CONFLICT (user_id, platform) DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = NOW();

-- Verify the data was inserted
SELECT 
    platform,
    platform_username,
    is_active,
    token_expires_at > NOW() as token_valid
FROM user_oauth_credentials 
WHERE user_id = '11111111-1111-1111-1111-111111111111'
ORDER BY platform;

-- Test the function
SELECT * FROM public.get_user_oauth_credentials('11111111-1111-1111-1111-111111111111');

-- Test getting credentials for a specific platform
SELECT * FROM public.get_user_oauth_credentials('11111111-1111-1111-1111-111111111111', 'twitter');

DO $$
BEGIN
    RAISE NOTICE '✅ Test OAuth credentials inserted successfully';
    RAISE NOTICE '🧪 Your n8n workflow should now be able to fetch these credentials';
    RAISE NOTICE '⚠️ Remember to replace the user_id with actual user IDs from your database';
END;
$$;
