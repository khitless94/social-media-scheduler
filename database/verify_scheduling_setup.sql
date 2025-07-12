-- Verification script for scheduled posting setup
-- Run this to verify everything is set up correctly

-- Check if enum type exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduling_status_enum') 
        THEN '✅ scheduling_status_enum type exists'
        ELSE '❌ scheduling_status_enum type missing'
    END as enum_check;

-- Check if posts table has required columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('scheduled_for', 'scheduling_status', 'n8n_execution_id', 'retry_count', 'last_retry_at', 'error_message')
        THEN '✅ Required column exists'
        ELSE 'ℹ️ Optional column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('scheduled_for', 'scheduling_status', 'n8n_execution_id', 'retry_count', 'last_retry_at', 'error_message')
ORDER BY column_name;

-- Check if scheduled_posts_queue table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_posts_queue') 
        THEN '✅ scheduled_posts_queue table exists'
        ELSE '❌ scheduled_posts_queue table missing'
    END as queue_table_check;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name IN ('add_to_scheduled_queue', 'get_pending_scheduled_posts', 'update_scheduled_post_status')
        THEN '✅ Required function exists'
        ELSE 'ℹ️ Other function'
    END as status
FROM information_schema.routines 
WHERE routine_name IN ('add_to_scheduled_queue', 'get_pending_scheduled_posts', 'update_scheduled_post_status')
ORDER BY routine_name;

-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'trigger_add_to_scheduled_queue'
        THEN '✅ Required trigger exists'
        ELSE 'ℹ️ Other trigger'
    END as status
FROM information_schema.triggers 
WHERE table_name = 'posts'
AND trigger_name = 'trigger_add_to_scheduled_queue';

-- Check if indexes exist
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname IN ('idx_posts_scheduled_for', 'idx_posts_scheduling_status', 'idx_queue_scheduled_for', 'idx_queue_status', 'idx_queue_user_id')
        THEN '✅ Required index exists'
        ELSE 'ℹ️ Other index'
    END as status
FROM pg_indexes 
WHERE tablename IN ('posts', 'scheduled_posts_queue')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'scheduled_posts_queue'
ORDER BY policyname;

-- Test enum values
SELECT 
    unnest(enum_range(NULL::scheduling_status_enum)) as valid_enum_values;

-- Sample test - create a test scheduled post (will be rolled back)
BEGIN;

-- Test inserting a scheduled post
INSERT INTO posts (
    user_id,
    content,
    platforms,
    scheduling_status,
    scheduled_for,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Test user ID
    'Test scheduled post',
    ARRAY['twitter'],
    'scheduled',
    NOW() + INTERVAL '1 hour',
    NOW(),
    NOW()
) RETURNING id, scheduling_status, scheduled_for;

-- Check if queue entry was created by trigger
SELECT 
    COUNT(*) as queue_entries_created,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ Trigger working - queue entry created'
        ELSE '❌ Trigger not working - no queue entry'
    END as trigger_test
FROM scheduled_posts_queue 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE content = 'Test scheduled post' 
    AND user_id = '00000000-0000-0000-0000-000000000000'
);

-- Test the get_pending_scheduled_posts function
SELECT 
    COUNT(*) as pending_posts_found,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ get_pending_scheduled_posts function working'
        ELSE 'ℹ️ No pending posts found (expected for test)'
    END as function_test
FROM get_pending_scheduled_posts();

ROLLBACK; -- Don't actually save the test data

-- Final summary
SELECT 
    '🎉 Scheduled posting setup verification complete!' as summary,
    'Check the results above for any ❌ errors that need to be fixed.' as instructions;

-- Show current posts table structure
\d posts;

-- Show current scheduled_posts_queue table structure  
\d scheduled_posts_queue;
