-- Step 1: Check the actual structure of scheduled_posts_queue
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'scheduled_posts_queue' 
ORDER BY ordinal_position;

-- Step 2: Check if the RPC function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'create_scheduled_post_bypass_rls';

-- Step 3: Add missing columns to scheduled_posts_queue if they don't exist
ALTER TABLE scheduled_posts_queue ADD COLUMN IF NOT EXISTS platform VARCHAR(50);
ALTER TABLE scheduled_posts_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Step 4: Create the missing RPC function that your frontend expects
CREATE OR REPLACE FUNCTION create_scheduled_post_bypass_rls(
    p_user_id UUID,
    p_content TEXT,
    p_platform VARCHAR(50),
    p_scheduled_at TIMESTAMP WITH TIME ZONE,
    p_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_post_id UUID;
BEGIN
    -- Insert into posts table
    INSERT INTO posts (
        user_id, content, platform, status, scheduled_at, image_url, created_at, updated_at
    )
    VALUES (
        p_user_id, p_content, p_platform, 'scheduled', p_scheduled_at, p_image_url, NOW(), NOW()
    )
    RETURNING id INTO new_post_id;
    
    -- Also insert into scheduled_posts_queue for n8n workflow
    INSERT INTO scheduled_posts_queue (
        post_id, user_id, content, platform, scheduled_for, status, created_at, updated_at, retry_count
    )
    VALUES (
        new_post_id, p_user_id, p_content, p_platform, p_scheduled_at, 'pending', NOW(), NOW(), 0
    )
    ON CONFLICT (post_id) DO UPDATE SET
        content = p_content,
        platform = p_platform,
        scheduled_for = p_scheduled_at,
        status = 'pending',
        updated_at = NOW();
    
    RETURN new_post_id;
END;
$$;

-- Step 5: Grant permissions to the function
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls TO authenticated;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls TO anon;

-- Step 6: Create a simpler trigger that works with both tables
CREATE OR REPLACE FUNCTION sync_posts_to_queue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'scheduled' THEN
        INSERT INTO scheduled_posts_queue (
            post_id, user_id, content, platform, scheduled_for, status, created_at, updated_at, retry_count
        )
        VALUES (
            NEW.id, NEW.user_id, NEW.content, NEW.platform, NEW.scheduled_at, 'pending', NOW(), NOW(), 0
        )
        ON CONFLICT (post_id) DO UPDATE SET
            content = NEW.content,
            platform = NEW.platform,
            scheduled_for = NEW.scheduled_at,
            status = 'pending',
            updated_at = NOW(),
            retry_count = 0;
    ELSIF NEW.status = 'published' THEN
        UPDATE scheduled_posts_queue 
        SET status = 'completed', updated_at = NOW() 
        WHERE post_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create the trigger
DROP TRIGGER IF EXISTS sync_posts_to_queue_trigger ON posts;
CREATE TRIGGER sync_posts_to_queue_trigger
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION sync_posts_to_queue();

-- Step 8: Test the function
-- SELECT create_scheduled_post_bypass_rls(
--     'a26953d6-0008-4f6c-bf86-e7cf384ff45e'::UUID,
--     'Test post content',
--     'twitter',
--     NOW() + INTERVAL '1 hour'
-- );
