-- Quick Test Script for n8n Scheduled Posting
-- Run this after setup_for_n8n.sql to verify everything works

-- ============================================================================
-- Test 1: Check if tables and functions exist
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 RUNNING QUICK TESTS';
    RAISE NOTICE '====================';
    RAISE NOTICE '';
    
    -- Check if posts table has new columns
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'posts' AND column_name = 'scheduling_status') THEN
        RAISE NOTICE '✅ Posts table has scheduling_status column';
    ELSE
        RAISE NOTICE '❌ Posts table missing scheduling_status column';
    END IF;
    
    -- Check if queue table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'scheduled_posts_queue') THEN
        RAISE NOTICE '✅ Scheduled posts queue table exists';
    ELSE
        RAISE NOTICE '❌ Scheduled posts queue table missing';
    END IF;
    
    -- Check if functions exist
    IF EXISTS (SELECT 1 FROM information_schema.routines 
               WHERE routine_name = 'get_pending_scheduled_posts') THEN
        RAISE NOTICE '✅ get_pending_scheduled_posts function exists';
    ELSE
        RAISE NOTICE '❌ get_pending_scheduled_posts function missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines 
               WHERE routine_name = 'update_scheduled_post_status') THEN
        RAISE NOTICE '✅ update_scheduled_post_status function exists';
    ELSE
        RAISE NOTICE '❌ update_scheduled_post_status function missing';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- Test 2: Create a test post and verify queue entry
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000';
    new_post_id UUID;
    queue_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 Test 2: Creating test post...';
    
    -- Create test post
    SELECT create_test_scheduled_post(
        test_user_id,
        'Test post for n8n verification! 🚀',
        ARRAY['twitter'],
        1  -- 1 minute from now
    ) INTO new_post_id;
    
    -- Check if queue entry was created
    SELECT COUNT(*) INTO queue_count 
    FROM scheduled_posts_queue 
    WHERE post_id = new_post_id;
    
    IF queue_count > 0 THEN
        RAISE NOTICE '✅ Queue entry created automatically for post %', new_post_id;
    ELSE
        RAISE NOTICE '❌ Queue entry NOT created for post %', new_post_id;
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- Test 3: Test n8n functions
-- ============================================================================

DO $$
DECLARE
    pending_count INTEGER;
    health_record RECORD;
BEGIN
    RAISE NOTICE '🧪 Test 3: Testing n8n functions...';
    
    -- Test get_pending_scheduled_posts
    SELECT COUNT(*) INTO pending_count 
    FROM get_pending_scheduled_posts();
    
    RAISE NOTICE 'Pending posts found: %', pending_count;
    
    -- Test get_queue_health
    SELECT * INTO health_record FROM get_queue_health();
    
    RAISE NOTICE 'Queue health:';
    RAISE NOTICE '  Total pending: %', health_record.total_pending;
    RAISE NOTICE '  Overdue posts: %', health_record.overdue_posts;
    RAISE NOTICE '  Processing posts: %', health_record.processing_posts;
    RAISE NOTICE '  Failed posts (last hour): %', health_record.failed_posts_last_hour;
    RAISE NOTICE '  Next scheduled: %', health_record.next_scheduled;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- Test 4: Show current queue status
-- ============================================================================

SELECT 
    'Current Queue Status' as test,
    id,
    post_id,
    scheduled_for,
    status,
    CASE 
        WHEN scheduled_for <= NOW() THEN 'DUE NOW'
        ELSE 'PENDING'
    END as urgency
FROM scheduled_posts_queue 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY scheduled_for;

-- ============================================================================
-- Test 5: Show posts with scheduling info
-- ============================================================================

SELECT 
    'Posts with Scheduling Info' as test,
    id,
    content,
    platforms,
    scheduling_status,
    scheduled_for,
    status,
    created_at
FROM posts 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- ============================================================================
-- Final Summary
-- ============================================================================

DO $$
DECLARE
    total_posts INTEGER;
    total_queue INTEGER;
    pending_posts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_posts FROM posts WHERE created_at > NOW() - INTERVAL '10 minutes';
    SELECT COUNT(*) INTO total_queue FROM scheduled_posts_queue WHERE created_at > NOW() - INTERVAL '10 minutes';
    SELECT COUNT(*) INTO pending_posts FROM get_pending_scheduled_posts();
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 TEST SUMMARY';
    RAISE NOTICE '===============';
    RAISE NOTICE 'Recent posts created: %', total_posts;
    RAISE NOTICE 'Queue entries created: %', total_queue;
    RAISE NOTICE 'Posts ready for n8n: %', pending_posts;
    RAISE NOTICE '';
    
    IF total_posts > 0 AND total_queue > 0 THEN
        RAISE NOTICE '🎉 SUCCESS: Database setup is working correctly!';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Next Steps:';
        RAISE NOTICE '1. Set up n8n Cloud workflow';
        RAISE NOTICE '2. Import: n8n/complete-production-workflow.json';
        RAISE NOTICE '3. Configure Supabase API credentials';
        RAISE NOTICE '4. Activate the workflow';
        RAISE NOTICE '5. Monitor executions';
    ELSE
        RAISE NOTICE '❌ ISSUE: Something is not working correctly';
        RAISE NOTICE 'Check the error messages above';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- Useful monitoring queries
-- ============================================================================

-- Query to check pending posts (run this to see what n8n will process)
-- SELECT * FROM get_pending_scheduled_posts();

-- Query to check queue health
-- SELECT * FROM get_queue_health();

-- Query to see recent activity
-- SELECT 
--     p.content,
--     p.scheduling_status,
--     p.scheduled_for,
--     q.status as queue_status,
--     q.n8n_execution_id
-- FROM posts p
-- LEFT JOIN scheduled_posts_queue q ON p.id = q.post_id
-- WHERE p.created_at > NOW() - INTERVAL '1 hour'
-- ORDER BY p.created_at DESC;
