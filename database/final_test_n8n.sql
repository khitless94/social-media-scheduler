-- Final Test Script for n8n Scheduled Posting
-- Run this to create test posts and verify the system

-- ============================================================================
-- STEP 1: Create Test Posts for Immediate Processing
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000';
    post_id_1 UUID;
    post_id_2 UUID;
    post_id_3 UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 CREATING TEST POSTS FOR N8N WORKFLOW';
    RAISE NOTICE '=====================================';
    
    -- Test Post 1: Immediate (1 minute from now)
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
        'URGENT TEST: n8n workflow test post! 🚀 This should publish in 1 minute. Testing immediate scheduling.',
        ARRAY['twitter'],
        'scheduled',
        NOW() + INTERVAL '1 minute',
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO post_id_1;
    
    RAISE NOTICE '✅ Test Post 1 created: % (Twitter, 1 minute)', post_id_1;
    
    -- Test Post 2: Multi-platform (3 minutes from now)
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
        'Multi-platform test! 📱 Testing Twitter, Facebook, and LinkedIn integration. This is a comprehensive test of the n8n workflow system.',
        ARRAY['twitter', 'facebook', 'linkedin'],
        'scheduled',
        NOW() + INTERVAL '3 minutes',
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO post_id_2;
    
    RAISE NOTICE '✅ Test Post 2 created: % (Multi-platform, 3 minutes)', post_id_2;
    
    -- Test Post 3: Error handling test (5 minutes from now)
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
        'Error handling test! ⚠️ This post includes platforms that may not have valid credentials to test error handling and retry logic.',
        ARRAY['twitter', 'instagram', 'reddit'],
        'scheduled',
        NOW() + INTERVAL '5 minutes',
        'scheduled',
        NOW(),
        NOW()
    ) RETURNING id INTO post_id_3;
    
    RAISE NOTICE '✅ Test Post 3 created: % (Error test, 5 minutes)', post_id_3;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 Test Posts Summary:';
    RAISE NOTICE '   Post 1: % - Immediate test (1 min)', post_id_1;
    RAISE NOTICE '   Post 2: % - Multi-platform (3 min)', post_id_2;
    RAISE NOTICE '   Post 3: % - Error handling (5 min)', post_id_3;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: Verify Queue Entries Were Created
-- ============================================================================

SELECT 
    'Queue Verification' as info,
    COUNT(*) as total_queue_entries,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_entries,
    MIN(scheduled_for) as next_scheduled,
    MAX(scheduled_for) as last_scheduled
FROM scheduled_posts_queue 
WHERE created_at > NOW() - INTERVAL '1 minute';

-- ============================================================================
-- STEP 3: Show Pending Posts for n8n
-- ============================================================================

SELECT 
    'Pending Posts for n8n' as info,
    queue_id,
    post_id,
    content,
    platforms,
    scheduled_for,
    (scheduled_for <= NOW()) as is_due_now
FROM get_pending_scheduled_posts()
ORDER BY scheduled_for;

-- ============================================================================
-- STEP 4: Monitor Queue Health
-- ============================================================================

SELECT 
    'Queue Health' as info,
    total_pending,
    overdue_posts,
    processing_posts,
    failed_posts_last_hour
FROM get_queue_health();

-- ============================================================================
-- STEP 5: Show Recent Posts Status
-- ============================================================================

SELECT 
    'Recent Posts Status' as info,
    id,
    content,
    platforms,
    scheduling_status,
    scheduled_for,
    created_at,
    CASE 
        WHEN scheduled_for <= NOW() THEN 'DUE NOW'
        ELSE 'PENDING'
    END as status_check
FROM posts 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY scheduled_for;

-- ============================================================================
-- STEP 6: Test n8n Function Directly
-- ============================================================================

-- Test the exact function n8n will call
DO $$
DECLARE
    pending_count INTEGER;
    result_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 TESTING N8N FUNCTION DIRECTLY';
    RAISE NOTICE '================================';
    
    -- Count pending posts
    SELECT COUNT(*) INTO pending_count 
    FROM get_pending_scheduled_posts();
    
    RAISE NOTICE 'Pending posts found: %', pending_count;
    
    IF pending_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'Pending posts details:';
        FOR result_record IN 
            SELECT queue_id, post_id, content, platforms, scheduled_for
            FROM get_pending_scheduled_posts()
            ORDER BY scheduled_for
        LOOP
            RAISE NOTICE '  📝 %: % (%) - %', 
                result_record.post_id, 
                LEFT(result_record.content, 50),
                array_to_string(result_record.platforms, ', '),
                result_record.scheduled_for;
        END LOOP;
    ELSE
        RAISE NOTICE 'No posts are due for processing yet.';
        RAISE NOTICE 'Next check: Wait for scheduled times to pass.';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 7: Instructions for n8n Testing
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 N8N TESTING INSTRUCTIONS';
    RAISE NOTICE '===========================';
    RAISE NOTICE '';
    RAISE NOTICE '1. 🔧 Setup n8n:';
    RAISE NOTICE '   - Import: n8n/complete-production-workflow.json';
    RAISE NOTICE '   - Add Supabase API credential with service key';
    RAISE NOTICE '   - Configure all HTTP Request nodes';
    RAISE NOTICE '';
    RAISE NOTICE '2. 🧪 Test manually:';
    RAISE NOTICE '   - Click "Test workflow" in n8n';
    RAISE NOTICE '   - Check "Fetch Pending Posts" returns data';
    RAISE NOTICE '   - Verify each node processes correctly';
    RAISE NOTICE '';
    RAISE NOTICE '3. 🚀 Activate workflow:';
    RAISE NOTICE '   - Toggle "Active" switch to ON';
    RAISE NOTICE '   - Workflow runs every minute automatically';
    RAISE NOTICE '   - Monitor in Executions tab';
    RAISE NOTICE '';
    RAISE NOTICE '4. 📊 Monitor results:';
    RAISE NOTICE '   - Check posts table for status updates';
    RAISE NOTICE '   - Verify social media posts appear';
    RAISE NOTICE '   - Review n8n execution logs';
    RAISE NOTICE '';
    RAISE NOTICE '5. 🔍 Troubleshoot if needed:';
    RAISE NOTICE '   - Check OAuth credentials are valid';
    RAISE NOTICE '   - Verify API tokens not expired';
    RAISE NOTICE '   - Review error messages in logs';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 8: Monitoring Queries
-- ============================================================================

-- Query to run every few minutes to check progress
CREATE OR REPLACE VIEW n8n_monitoring AS
SELECT 
    p.id,
    p.content,
    p.platforms,
    p.scheduling_status,
    p.scheduled_for,
    p.published_at,
    p.error_message,
    p.platform_post_ids,
    q.status as queue_status,
    q.n8n_execution_id,
    CASE 
        WHEN p.scheduled_for <= NOW() AND p.scheduling_status = 'scheduled' THEN 'OVERDUE'
        WHEN p.scheduled_for <= NOW() + INTERVAL '2 minutes' THEN 'DUE SOON'
        ELSE 'PENDING'
    END as urgency
FROM posts p
LEFT JOIN scheduled_posts_queue q ON p.id = q.post_id
WHERE p.created_at > NOW() - INTERVAL '1 hour'
ORDER BY p.scheduled_for;

-- Show the monitoring view
SELECT * FROM n8n_monitoring;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
    total_test_posts INTEGER;
    pending_posts INTEGER;
    due_now INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_test_posts 
    FROM posts 
    WHERE created_at > NOW() - INTERVAL '5 minutes';
    
    SELECT COUNT(*) INTO pending_posts 
    FROM get_pending_scheduled_posts();
    
    SELECT COUNT(*) INTO due_now 
    FROM posts 
    WHERE scheduled_for <= NOW() 
    AND scheduling_status = 'scheduled'
    AND created_at > NOW() - INTERVAL '5 minutes';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TEST SETUP COMPLETE!';
    RAISE NOTICE '======================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Test Summary:';
    RAISE NOTICE '   Total test posts created: %', total_test_posts;
    RAISE NOTICE '   Posts ready for n8n: %', pending_posts;
    RAISE NOTICE '   Posts due now: %', due_now;
    RAISE NOTICE '';
    RAISE NOTICE '⏰ Timeline:';
    RAISE NOTICE '   Now: Test posts created';
    RAISE NOTICE '   +1 min: First post should be processed';
    RAISE NOTICE '   +3 min: Multi-platform post should be processed';
    RAISE NOTICE '   +5 min: Error handling test should be processed';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Set up n8n workflow';
    RAISE NOTICE '   2. Activate the workflow';
    RAISE NOTICE '   3. Monitor: SELECT * FROM n8n_monitoring;';
    RAISE NOTICE '   4. Check social media for published posts';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for n8n testing!';
    RAISE NOTICE '';
END $$;
