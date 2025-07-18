-- First, let's check the database structure and triggers
SELECT COUNT(*) FROM posts WHERE status = 'scheduled';

-- Check the scheduled_posts_queue table structure
\d scheduled_posts_queue;

-- Check what triggers exist on the posts table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'posts';

-- TEMPORARY FIX: Disable the trigger before updating
DROP TRIGGER IF EXISTS add_to_scheduled_queue_trigger ON posts;

-- Now safely update the posts
UPDATE posts SET status = 'draft', updated_at = NOW() WHERE status = 'scheduled';

-- Verify the update worked
SELECT COUNT(*) FROM posts WHERE status = 'scheduled';

-- Check if we need to recreate the trigger (you may want to fix it first)
-- CREATE TRIGGER add_to_scheduled_queue_trigger
--     AFTER INSERT OR UPDATE ON posts
--     FOR EACH ROW
--     EXECUTE FUNCTION add_to_scheduled_queue();
