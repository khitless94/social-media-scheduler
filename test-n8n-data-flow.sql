-- Test script to verify n8n data flow
-- Run this in Supabase SQL Editor to check if data is flowing correctly

-- 1. Check if scheduled_posts table exists and has data
SELECT 'scheduled_posts table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduled_posts' 
ORDER BY ordinal_position;

-- 2. Check current scheduled posts
SELECT 'Current scheduled posts:' as info;
SELECT id, user_id, content, platform, scheduled_time, posted, created_at
FROM scheduled_posts 
WHERE posted = false
ORDER BY scheduled_time ASC
LIMIT 5;

-- 3. Test the exact query that n8n will use
SELECT 'N8N Query Test:' as info;
SELECT id, user_id, content, platform, scheduled_time as scheduled_at, image_url, title, 'scheduled' as status 
FROM scheduled_posts 
WHERE scheduled_time <= NOW() AND posted = false 
ORDER BY scheduled_time ASC 
LIMIT 10;

-- 4. Check oauth_credentials table
SELECT 'OAuth credentials check:' as info;
SELECT user_id, platform, 
       CASE WHEN access_token IS NOT NULL THEN 'Has Token' ELSE 'No Token' END as token_status,
       expires_at
FROM oauth_credentials 
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Check if there are any posts ready to be processed
SELECT 'Posts ready for processing:' as info;
SELECT COUNT(*) as ready_posts_count
FROM scheduled_posts 
WHERE scheduled_time <= NOW() AND posted = false;

-- 6. Show timezone info
SELECT 'Current database time:' as info, NOW() as current_time;
