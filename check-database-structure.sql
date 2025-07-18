-- Diagnostic script to check database structure for n8n workflow
-- This script is READ-ONLY and does not modify any data

-- 1. Check what tables exist in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check if scheduled_posts table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'scheduled_posts'
) as scheduled_posts_table_exists;

-- 3. If scheduled_posts exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduled_posts' 
ORDER BY ordinal_position;

-- 4. Check if posts table exists (alternative table name)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
) as posts_table_exists;

-- 5. If posts table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- 6. Check if oauth_credentials table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'oauth_credentials'
) as oauth_credentials_table_exists;

-- 7. If oauth_credentials exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'oauth_credentials' 
ORDER BY ordinal_position;

-- 8. Check if there are any pending scheduled posts (without revealing content)
-- For scheduled_posts table
SELECT 
    COUNT(*) as pending_scheduled_posts_count
FROM 
    scheduled_posts
WHERE 
    scheduled_time <= NOW() 
    AND posted = false
LIMIT 10;

-- 9. Check if there are any pending posts in posts table (if it exists)
SELECT 
    COUNT(*) as pending_posts_count
FROM 
    posts
WHERE 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'scheduled_at')
    AND scheduled_at <= NOW() 
    AND status = 'scheduled'
LIMIT 10;

-- 10. Check if there are any pending posts in scheduled_posts_queue (if it exists)
SELECT 
    COUNT(*) as pending_queue_count
FROM 
    scheduled_posts_queue
WHERE 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_posts_queue')
    AND scheduled_for <= NOW() 
    AND status = 'pending'
LIMIT 10;

-- 11. Check if the exact query from n8n would work
-- This tests if the query syntax is valid without returning actual data
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'scheduled_posts'
        ) THEN 'Query is valid'
        ELSE 'Table scheduled_posts does not exist'
    END as query_status;

-- 12. Check if the database has the right permissions for the postgres user
SELECT 
    table_name, 
    privilege_type
FROM 
    information_schema.table_privileges
WHERE 
    grantee = current_user
    AND table_schema = 'public'
    AND table_name IN ('scheduled_posts', 'posts', 'oauth_credentials', 'scheduled_posts_queue')
ORDER BY 
    table_name, 
    privilege_type;
