-- Quick RLS fix for posts table
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Service role can manage all posts" ON posts;

-- Create new RLS policies
CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything (for n8n and edge functions)
CREATE POLICY "Service role can manage all posts" ON posts
    FOR ALL USING (auth.role() = 'service_role');

-- Test the policies by trying to insert a test post
DO $$
DECLARE
    test_user_id uuid;
    test_post_id uuid;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test insert
        INSERT INTO posts (
            user_id,
            content,
            platform,
            status,
            scheduled_at,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'Test post for RLS verification',
            'twitter',
            'scheduled',
            NOW() + INTERVAL '1 hour',
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

-- Show current policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY policyname;
