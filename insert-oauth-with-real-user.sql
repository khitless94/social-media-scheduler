-- Insert test OAuth credentials using the first real user from your database
-- Run this AFTER running create-oauth-credentials-function.sql

DO $$
DECLARE
    real_user_id UUID;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO real_user_id FROM auth.users LIMIT 1;
    
    IF real_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users table. Please create a user account first.';
    END IF;
    
    RAISE NOTICE 'Using user ID: %', real_user_id;
    
    -- Insert test Twitter credentials
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
        real_user_id,
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

    -- Insert test LinkedIn credentials
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
        real_user_id,
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

    -- Insert test Reddit credentials
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
        real_user_id,
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

    -- Insert test Facebook credentials
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
        real_user_id,
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

    -- Insert test Instagram credentials
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
        real_user_id,
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

    RAISE NOTICE '✅ Test OAuth credentials inserted successfully for user: %', real_user_id;
    RAISE NOTICE '🧪 Your n8n workflow should now be able to fetch these credentials';
    
END;
$$;

-- Verify the data was inserted
SELECT 
    u.email,
    uoc.platform,
    uoc.platform_username,
    uoc.is_active,
    uoc.token_expires_at > NOW() as token_valid
FROM user_oauth_credentials uoc
JOIN auth.users u ON uoc.user_id = u.id
ORDER BY u.email, uoc.platform;

-- Test the function with the first user
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    RAISE NOTICE '🧪 Testing get_user_oauth_credentials function...';
    
    -- This will show the results in the query results, not in notices
    PERFORM * FROM public.get_user_oauth_credentials(test_user_id);
    
    RAISE NOTICE '✅ Function test completed - check query results above';
END;
$$;
