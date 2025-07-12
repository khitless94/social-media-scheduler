-- Test Script for Scheduled Posting System
-- Run this to verify everything is working correctly

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000';
    test_post_id UUID;
    queue_entry_count INTEGER;
    function_result BOOLEAN;
    stats_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 STARTING SCHEDULED POSTING TESTS';
    RAISE NOTICE '===================================';
    
    -- Test 1: Check if all required tables exist
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 1: Checking table structure...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
        RAISE NOTICE '✅ posts table exists';
    ELSE
        RAISE NOTICE '❌ posts table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_posts_queue') THEN
        RAISE NOTICE '✅ scheduled_posts_queue table exists';
    ELSE
        RAISE NOTICE '❌ scheduled_posts_queue table missing';
    END IF;
    
    -- Test 2: Check if enum type exists
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 2: Checking enum type...';
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduling_status_enum') THEN
        RAISE NOTICE '✅ scheduling_status_enum exists';
        RAISE NOTICE '   Valid values: %', array_to_string(enum_range(NULL::scheduling_status_enum), ', ');
    ELSE
        RAISE NOTICE '❌ scheduling_status_enum missing';
    END IF;
    
    -- Test 3: Check if functions exist
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 3: Checking functions...';
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_pending_scheduled_posts') THEN
        RAISE NOTICE '✅ get_pending_scheduled_posts() exists';
    ELSE
        RAISE NOTICE '❌ get_pending_scheduled_posts() missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_scheduled_post_status') THEN
        RAISE NOTICE '✅ update_scheduled_post_status() exists';
    ELSE
        RAISE NOTICE '❌ update_scheduled_post_status() missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_scheduled_posts_stats') THEN
        RAISE NOTICE '✅ get_scheduled_posts_stats() exists';
    ELSE
        RAISE NOTICE '❌ get_scheduled_posts_stats() missing';
    END IF;
    
    -- Test 4: Check if trigger exists
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 4: Checking triggers...';
    
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_add_to_scheduled_queue') THEN
        RAISE NOTICE '✅ trigger_add_to_scheduled_queue exists';
    ELSE
        RAISE NOTICE '❌ trigger_add_to_scheduled_queue missing';
    END IF;
    
    -- Test 5: Test creating a scheduled post
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 5: Testing post creation and queue trigger...';
    
    BEGIN
        INSERT INTO posts (
            id,
            user_id,
            content,
            platforms,
            scheduling_status,
            scheduled_for,
            status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            'Test scheduled post for verification',
            ARRAY['twitter', 'linkedin'],
            'scheduled',
            NOW() + INTERVAL '1 hour',
            'scheduled',
            NOW(),
            NOW()
        ) RETURNING id INTO test_post_id;
        
        RAISE NOTICE '✅ Test post created with ID: %', test_post_id;
        
        -- Check if queue entry was created by trigger
        SELECT COUNT(*) INTO queue_entry_count
        FROM scheduled_posts_queue 
        WHERE post_id = test_post_id;
        
        IF queue_entry_count > 0 THEN
            RAISE NOTICE '✅ Queue entry created automatically by trigger';
        ELSE
            RAISE NOTICE '❌ Queue entry NOT created - trigger may not be working';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create test post: %', SQLERRM;
    END;
    
    -- Test 6: Test get_pending_scheduled_posts function
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 6: Testing get_pending_scheduled_posts()...';
    
    BEGIN
        -- Update the test post to be due now
        UPDATE posts 
        SET scheduled_for = NOW() - INTERVAL '1 minute'
        WHERE id = test_post_id;
        
        -- Test the function
        IF EXISTS (SELECT 1 FROM get_pending_scheduled_posts() WHERE post_id = test_post_id) THEN
            RAISE NOTICE '✅ get_pending_scheduled_posts() returns test post';
        ELSE
            RAISE NOTICE '❌ get_pending_scheduled_posts() does not return test post';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing get_pending_scheduled_posts(): %', SQLERRM;
    END;
    
    -- Test 7: Test update_scheduled_post_status function
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 7: Testing update_scheduled_post_status()...';
    
    BEGIN
        -- Get queue ID for test post
        DECLARE
            test_queue_id UUID;
        BEGIN
            SELECT id INTO test_queue_id 
            FROM scheduled_posts_queue 
            WHERE post_id = test_post_id;
            
            IF test_queue_id IS NOT NULL THEN
                -- Test updating status
                SELECT update_scheduled_post_status(
                    test_queue_id,
                    'processing',
                    'test-execution-123',
                    NULL,
                    NULL
                ) INTO function_result;
                
                IF function_result THEN
                    RAISE NOTICE '✅ update_scheduled_post_status() works correctly';
                ELSE
                    RAISE NOTICE '❌ update_scheduled_post_status() returned false';
                END IF;
            ELSE
                RAISE NOTICE '❌ Could not find queue entry for test post';
            END IF;
        END;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing update_scheduled_post_status(): %', SQLERRM;
    END;
    
    -- Test 8: Test statistics function
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 8: Testing get_scheduled_posts_stats()...';
    
    BEGIN
        SELECT * INTO stats_record 
        FROM get_scheduled_posts_stats(test_user_id);
        
        RAISE NOTICE '✅ Statistics function works:';
        RAISE NOTICE '   Total: %, Pending: %, Processing: %, Completed: %, Failed: %, Cancelled: %',
            stats_record.total_scheduled,
            stats_record.pending,
            stats_record.processing,
            stats_record.completed,
            stats_record.failed,
            stats_record.cancelled;
            
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing get_scheduled_posts_stats(): %', SQLERRM;
    END;
    
    -- Test 9: Test utility functions (if they exist)
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test 9: Testing utility functions...';
    
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_queue_health') THEN
        BEGIN
            DECLARE
                health_record RECORD;
            BEGIN
                SELECT * INTO health_record FROM get_queue_health();
                RAISE NOTICE '✅ Queue health: Pending: %, Overdue: %, Processing: %',
                    health_record.total_pending,
                    health_record.overdue_posts,
                    health_record.processing_posts;
            END;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Error testing get_queue_health(): %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'ℹ️ Utility functions not installed (optional)';
    END IF;
    
    -- Cleanup test data
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Cleaning up test data...';
    
    DELETE FROM scheduled_posts_queue WHERE post_id = test_post_id;
    DELETE FROM posts WHERE id = test_post_id;
    
    RAISE NOTICE '✅ Test data cleaned up';
    
    -- Final summary
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SCHEDULED POSTING TESTS COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Set up n8n workflow';
    RAISE NOTICE '2. Configure OAuth credentials';
    RAISE NOTICE '3. Create a real test post:';
    RAISE NOTICE '   SELECT create_test_scheduled_post(''your-user-id'');';
    RAISE NOTICE '';
    
END $$;

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- Show current queue status
SELECT 
    'Queue Status' as info,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'processing') as processing,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM scheduled_posts_queue;

-- Show recent posts with scheduling info
SELECT 
    p.id,
    p.content,
    p.platforms,
    p.scheduling_status,
    p.scheduled_for,
    p.created_at,
    q.status as queue_status
FROM posts p
LEFT JOIN scheduled_posts_queue q ON p.id = q.post_id
WHERE p.created_at > NOW() - INTERVAL '1 day'
ORDER BY p.created_at DESC
LIMIT 10;

-- Show pending posts ready for processing
SELECT 
    queue_id,
    post_id,
    content,
    platforms,
    scheduled_for,
    (scheduled_for <= NOW()) as is_due
FROM get_pending_scheduled_posts()
ORDER BY scheduled_for;

-- ============================================================================
-- PERFORMANCE TEST QUERIES
-- ============================================================================

-- Test index performance on scheduled_for
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM posts 
WHERE scheduling_status = 'scheduled' 
AND scheduled_for <= NOW();

-- Test index performance on queue status
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM scheduled_posts_queue 
WHERE status = 'pending' 
AND scheduled_for <= NOW();

-- ============================================================================
-- SAMPLE DATA CREATION (OPTIONAL)
-- ============================================================================

-- Uncomment to create sample scheduled posts for testing
/*
DO $$
DECLARE
    sample_user_id UUID := '00000000-0000-0000-0000-000000000000';
    i INTEGER;
BEGIN
    FOR i IN 1..5 LOOP
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
            sample_user_id,
            'Sample scheduled post #' || i || ' 📅',
            ARRAY['twitter', 'linkedin'],
            'scheduled',
            NOW() + INTERVAL '1 hour' * i,
            'scheduled',
            NOW(),
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE 'Created 5 sample scheduled posts';
END $$;
*/
