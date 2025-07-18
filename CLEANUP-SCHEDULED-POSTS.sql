-- 🧹 CLEANUP: Remove existing scheduled posts from database
-- Run this in Supabase SQL Editor to clean up old/broken scheduled posts

-- Option 1: Remove only scheduled posts
DELETE FROM posts WHERE status = 'scheduled';

-- Option 2: Remove test posts (posts with test content)
DELETE FROM posts WHERE content LIKE '%🧪%';
DELETE FROM posts WHERE content LIKE '%Test post%';
DELETE FROM posts WHERE content LIKE '%test%' AND content LIKE '%scheduled%';

-- Option 3: Remove posts from specific platforms (if needed)
-- DELETE FROM posts WHERE platform = 'twitter' AND status = 'scheduled';
-- DELETE FROM posts WHERE platform = 'linkedin' AND status = 'scheduled';

-- Option 4: Remove posts older than a certain date
-- DELETE FROM posts WHERE created_at < '2024-01-01' AND status = 'scheduled';

-- Option 5: Remove ALL posts (DANGER: This removes everything!)
-- DELETE FROM posts;

-- Option 6: Remove posts from specific user (replace with actual user_id)
-- DELETE FROM posts WHERE user_id = 'your-user-id-here';

-- Check what will be deleted before running (run this first to see what exists)
SELECT 
    id,
    content,
    platform,
    status,
    scheduled_at,
    created_at,
    user_id
FROM posts 
WHERE status = 'scheduled' 
ORDER BY created_at DESC;

-- Count posts by status
SELECT 
    status,
    COUNT(*) as count
FROM posts 
GROUP BY status;

-- Show recent posts
SELECT 
    content,
    platform,
    status,
    created_at
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;

-- After cleanup, verify the cleanup worked
-- SELECT COUNT(*) as remaining_scheduled_posts FROM posts WHERE status = 'scheduled';
