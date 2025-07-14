-- Fix RLS policies for scheduled posts
-- Run this in your Supabase SQL Editor

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('posts', 'scheduled_posts_queue');

-- Fix RLS policies for posts table
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create comprehensive RLS policies for posts
CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage all posts" ON posts
    FOR ALL USING (auth.role() = 'service_role');

-- Fix RLS policies for scheduled_posts_queue table
DROP POLICY IF EXISTS "Users can view their own scheduled posts queue" ON scheduled_posts_queue;
DROP POLICY IF EXISTS "Users can insert their own scheduled posts queue" ON scheduled_posts_queue;
DROP POLICY IF EXISTS "Users can update their own scheduled posts queue" ON scheduled_posts_queue;
DROP POLICY IF EXISTS "Service role can manage all queue entries" ON scheduled_posts_queue;

-- Create comprehensive RLS policies for scheduled_posts_queue
CREATE POLICY "Users can insert their own queue entries" ON scheduled_posts_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own queue entries" ON scheduled_posts_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries" ON scheduled_posts_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entries" ON scheduled_posts_queue
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage all queue entries" ON scheduled_posts_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Make sure the trigger function has proper permissions
CREATE OR REPLACE FUNCTION add_to_scheduled_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- If post is being scheduled, add to queue
    IF NEW.scheduling_status = 'scheduled' AND NEW.scheduled_for IS NOT NULL THEN
        INSERT INTO scheduled_posts_queue (post_id, user_id, scheduled_for)
        VALUES (NEW.id, NEW.user_id, NEW.scheduled_for)
        ON CONFLICT (post_id) DO UPDATE SET
            scheduled_for = NEW.scheduled_for,
            status = 'pending',
            updated_at = NOW(),
            error_message = NULL,
            retry_count = 0;

        RAISE NOTICE 'Added post % to scheduled queue for %', NEW.id, NEW.scheduled_for;
    END IF;

    -- If post is cancelled, update queue
    IF NEW.scheduling_status = 'cancelled' THEN
        UPDATE scheduled_posts_queue 
        SET status = 'cancelled', updated_at = NOW()
        WHERE post_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the trigger function
GRANT EXECUTE ON FUNCTION add_to_scheduled_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_scheduled_queue() TO service_role;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_add_to_scheduled_queue ON posts;
CREATE TRIGGER trigger_add_to_scheduled_queue
    AFTER INSERT OR UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION add_to_scheduled_queue();

-- Test inserting a post to make sure RLS works
DO $$
DECLARE
    test_user_id uuid;
    test_post_id uuid;
BEGIN
    -- Get a user ID for testing (use the first available user)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test insert
        INSERT INTO posts (
            user_id,
            content,
            platforms,
            scheduling_status,
            scheduled_for,
            status,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'Test post for RLS verification',
            ARRAY['twitter'],
            'scheduled',
            NOW() + INTERVAL '1 hour',
            'scheduled',
            NOW(),
            NOW()
        ) RETURNING id INTO test_post_id;
        
        RAISE NOTICE 'Test post created successfully with ID: %', test_post_id;
        
        -- Clean up test post
        DELETE FROM posts WHERE id = test_post_id;
        RAISE NOTICE 'Test post cleaned up';
    ELSE
        RAISE NOTICE 'No users found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'RLS test failed: %', SQLERRM;
END $$;

-- Verify policies are in place
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename IN ('posts', 'scheduled_posts_queue')
ORDER BY tablename, policyname;
