-- QUICK FIX: Just disable the trigger and delete the posts

-- Step 1: Drop the problematic trigger completely
DROP TRIGGER IF EXISTS add_to_scheduled_queue_trigger ON posts;

-- Step 2: Also drop the function if you don't need it
DROP FUNCTION IF EXISTS add_to_scheduled_queue();

-- Step 3: Now safely update the scheduled posts to draft
UPDATE posts SET status = 'draft', updated_at = NOW() WHERE status = 'scheduled';

-- Step 4: Verify the operation worked
SELECT 
    status, 
    COUNT(*) as count 
FROM posts 
GROUP BY status 
ORDER BY status;

-- Step 5: Check if there are any records in scheduled_posts_queue that need cleanup
SELECT COUNT(*) FROM scheduled_posts_queue WHERE status = 'pending';

-- Step 6: Optional - Clean up the scheduled_posts_queue table
-- DELETE FROM scheduled_posts_queue WHERE status = 'pending';

-- If you want to completely remove the scheduled_posts_queue table (CAREFUL!)
-- DROP TABLE IF EXISTS scheduled_posts_queue;
