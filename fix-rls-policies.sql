-- Fix RLS policies for posts table
-- Run this in Supabase SQL Editor if the app still has RLS issues

-- First, drop all existing policies on posts table (various names)
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Enable read access for users to their own posts" ON posts;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON posts;
DROP POLICY IF EXISTS "Enable update access for users to their own posts" ON posts;
DROP POLICY IF EXISTS "Enable delete access for users to their own posts" ON posts;

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policies
-- Policy for SELECT (viewing posts)
CREATE POLICY "Enable read access for users to their own posts" ON posts
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy for INSERT (creating posts)
CREATE POLICY "Enable insert access for authenticated users" ON posts
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (updating posts)
CREATE POLICY "Enable update access for users to their own posts" ON posts
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (deleting posts)
CREATE POLICY "Enable delete access for users to their own posts" ON posts
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Test the policies by checking if they were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'posts';

-- Also check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'posts';
