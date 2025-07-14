-- Check current database status for OAuth functionality
-- Run this to see what exists and what's missing

-- 1. Check if the table exists
SELECT 'Checking if user_oauth_credentials table exists...' as status;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_oauth_credentials'
) as table_exists;

-- 2. Check if the function exists
SELECT 'Checking if get_user_oauth_credentials function exists...' as status;
SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'get_user_oauth_credentials'
) as function_exists;

-- 3. Show all functions in public schema (to see what's there)
SELECT 'All functions in public schema:' as status;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. Check if we have any users
SELECT 'Checking users...' as status;
SELECT COUNT(*) as user_count FROM auth.users;

-- 5. If table exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_oauth_credentials') THEN
        RAISE NOTICE 'user_oauth_credentials table structure:';
    ELSE
        RAISE NOTICE 'user_oauth_credentials table does NOT exist - need to create it';
    END IF;
END;
$$;

-- 6. Show table columns if it exists
SELECT 'Table columns (if table exists):' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_oauth_credentials' 
AND table_schema = 'public'
ORDER BY ordinal_position;
