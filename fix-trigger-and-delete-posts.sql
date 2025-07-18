-- Step 1: Check the current structure of scheduled_posts_queue table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'scheduled_posts_queue' 
ORDER BY ordinal_position;

-- Step 2: Check the trigger function that's causing the error
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'add_to_scheduled_queue';

-- Step 3: TEMPORARY FIX - Drop the problematic trigger
DROP TRIGGER IF EXISTS add_to_scheduled_queue_trigger ON posts;

-- Step 4: Now safely delete/update the scheduled posts
-- Option A: Mark as draft (safer)
UPDATE posts SET status = 'draft', updated_at = NOW() WHERE status = 'scheduled';

-- Option B: Delete permanently (if you're sure)
-- DELETE FROM posts WHERE status = 'scheduled';

-- Step 5: Verify the operation
SELECT COUNT(*) FROM posts WHERE status = 'scheduled';
SELECT COUNT(*) FROM posts WHERE status = 'draft';

-- Step 6: Fix the trigger function (add retry_count column or remove it from trigger)
-- Option A: Add the missing column to scheduled_posts_queue
ALTER TABLE scheduled_posts_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Option B: Fix the trigger function to include all required columns
CREATE OR REPLACE FUNCTION add_to_scheduled_queue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'scheduled' THEN
        INSERT INTO scheduled_posts_queue (
            post_id, user_id, content, platform, image_urls,
            scheduled_for, status, created_at, updated_at, retry_count
        )
        VALUES (
            NEW.id, NEW.user_id, NEW.content, NEW.platform,
            COALESCE(NEW.image_url, '[]'::jsonb), NEW.scheduled_at,
            'pending', NOW(), NOW(), 0
        )
        ON CONFLICT (post_id) DO UPDATE SET
            content = NEW.content,
            platform = NEW.platform,
            image_urls = COALESCE(NEW.image_url, '[]'::jsonb),
            scheduled_for = NEW.scheduled_at,
            status = 'pending',
            updated_at = NOW(),
            error_message = NULL,
            retry_count = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Recreate the trigger
CREATE TRIGGER add_to_scheduled_queue_trigger
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_to_scheduled_queue();
