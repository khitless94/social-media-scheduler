-- Find your user ID
-- Run this first to get your user ID

SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
