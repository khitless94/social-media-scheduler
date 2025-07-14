-- Get actual user IDs from your database
-- Run this to find real user IDs to use in the OAuth credentials

-- Get all users
SELECT 
    id as user_id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- Get user IDs with their post counts (to find active users)
SELECT 
    u.id as user_id,
    u.email,
    COUNT(p.id) as post_count,
    u.created_at
FROM auth.users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.email, u.created_at
ORDER BY post_count DESC, u.created_at DESC;

-- Show current OAuth credentials (if any exist)
SELECT 
    uoc.user_id,
    u.email,
    uoc.platform,
    uoc.platform_username,
    uoc.is_active,
    uoc.token_expires_at > NOW() as token_valid
FROM user_oauth_credentials uoc
JOIN auth.users u ON uoc.user_id = u.id
ORDER BY u.email, uoc.platform;
