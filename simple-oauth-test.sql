-- Simple test OAuth credentials insertion
-- Run this AFTER create-oauth-credentials-function.sql

-- First, let's see what users exist
SELECT 'Current users:' as info;
SELECT id, email FROM auth.users LIMIT 5;

-- Insert test credentials for the first user
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get first user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found. Please create a user account first.';
    END IF;
    
    -- Insert test Twitter credentials
    INSERT INTO user_oauth_credentials (
        user_id, platform, access_token, refresh_token, 
        token_expires_at, platform_username, is_active
    ) VALUES (
        test_user_id, 'twitter', 'test_twitter_token', 'test_refresh',
        NOW() + INTERVAL '1 hour', 'test_user', true
    ) ON CONFLICT (user_id, platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        updated_at = NOW();
    
    -- Insert test LinkedIn credentials  
    INSERT INTO user_oauth_credentials (
        user_id, platform, access_token, refresh_token,
        token_expires_at, platform_username, is_active
    ) VALUES (
        test_user_id, 'linkedin', 'test_linkedin_token', 'test_refresh',
        NOW() + INTERVAL '1 hour', 'test_user', true
    ) ON CONFLICT (user_id, platform) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        updated_at = NOW();
        
    RAISE NOTICE 'Test credentials inserted for user: %', test_user_id;
END;
$$;

-- Test the function
SELECT 'Testing function:' as info;
SELECT * FROM public.get_user_oauth_credentials(
    (SELECT id FROM auth.users LIMIT 1)
);

-- Show what was created
SELECT 'Created credentials:' as info;
SELECT 
    u.email,
    uoc.platform,
    uoc.platform_username,
    uoc.is_active
FROM user_oauth_credentials uoc
JOIN auth.users u ON uoc.user_id = u.id;
