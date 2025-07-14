-- Check current database schema to see what columns exist
-- Run this in Supabase SQL Editor to see your actual table structure

-- Check oauth_credentials table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'oauth_credentials' 
ORDER BY ordinal_position;

-- Check posts table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Check if scope column exists in oauth_credentials
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'oauth_credentials' 
    AND column_name = 'scope'
) as scope_column_exists;

-- Check what scheduled time columns exist in posts
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name LIKE '%schedul%';
