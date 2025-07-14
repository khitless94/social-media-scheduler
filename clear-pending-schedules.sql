-- Clear all pending scheduled posts from the database
-- This will allow you to start fresh with new scheduled posts

-- First, let's see what we have
SELECT
    id,
    user_id,
    content,
    platform,
    scheduled_for,
    status,
    created_at
FROM scheduled_posts
WHERE status IN ('pending', 'scheduled')
ORDER BY scheduled_for ASC;

-- Uncomment the line below to delete all pending/scheduled posts
-- DELETE FROM scheduled_posts WHERE status IN ('pending', 'scheduled');

-- Alternative: Delete only old pending posts (older than 1 day)
-- DELETE FROM scheduled_posts 
-- WHERE status IN ('pending', 'scheduled') 
--   AND created_at < NOW() - INTERVAL '1 day';

-- Alternative: Delete pending posts for a specific user
-- DELETE FROM scheduled_posts 
-- WHERE status IN ('pending', 'scheduled') 
--   AND user_id = 'd33d28ea-cc43-4dd0-b971-e896acf853e3';

-- After deletion, verify the cleanup
-- SELECT COUNT(*) as remaining_pending_posts 
-- FROM scheduled_posts 
-- WHERE status IN ('pending', 'scheduled');
