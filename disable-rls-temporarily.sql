-- Temporary fix: Disable RLS on posts table for testing
-- Run this in Supabase SQL Editor to temporarily disable RLS

-- Disable RLS on posts table (TEMPORARY - for testing only)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Check if RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'posts';

-- This will allow all operations on posts table without RLS checks
-- IMPORTANT: This is for testing only - re-enable RLS after scheduling works
