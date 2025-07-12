-- Production Test Script for n8n Scheduled Posting
-- This script only works with real users from auth.users table
-- Replace 'YOUR_REAL_USER_ID' with an actual user ID

-- ============================================================================
-- STEP 1: Get Real User IDs
-- ============================================================================

-- First, let's see what real users exist in your system
SELECT 
    'Available Real Users' as info,
    id as user_id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================================
-- STEP 2: Verify Setup
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 PRODUCTION SETUP VERIFICATION';
    RAISE NOTICE '================================';
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
-- STEP 3: Test Queue Health (Should be empty initially)
-- ============================================================================

SELECT 
    'Initial Queue Health' as test,
    total_pending,
    overdue_posts,
    processing_posts,
    failed_posts_last_hour,
    next_scheduled
FROM get_queue_health();

-- ============================================================================
-- STEP 4: Instructions for Creating Test Posts
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    sample_user_id UUID;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 HOW TO CREATE TEST POSTS';
    RAISE NOTICE '===========================';
    RAISE NOTICE '';
    
    -- Check if any users exist
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count = 0 THEN
        RAISE NOTICE '❌ No users found in auth.users table';
        RAISE NOTICE '   You need to create a user account first';
        RAISE NOTICE '   Sign up through your app to create a real user';
    ELSE
        -- Get a sample user ID
        SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
        
        RAISE NOTICE '✅ Found % users in system', user_count;
        RAISE NOTICE '';
        RAISE NOTICE '🧪 To create a test post, run:';
        RAISE NOTICE '';
        RAISE NOTICE 'SELECT create_production_test_post(';
        RAISE NOTICE '    ''%'',  -- Replace with your real user ID', sample_user_id;
        RAISE NOTICE '    ''Test post from production n8n! 🚀'',';
        RAISE NOTICE '    ARRAY[''twitter''],';
        RAISE NOTICE '    2  -- Minutes from now';
        RAISE NOTICE ');';
        RAISE NOTICE '';
        RAISE NOTICE '📱 For multi-platform test:';
        RAISE NOTICE '';
        RAISE NOTICE 'SELECT create_production_test_post(';
        RAISE NOTICE '    ''%'',  -- Your real user ID', sample_user_id;
        RAISE NOTICE '    ''Multi-platform test! 📱 Testing all platforms.'',';
        RAISE NOTICE '    ARRAY[''twitter'', ''facebook'', ''linkedin''],';
        RAISE NOTICE '    3  -- Minutes from now';
        RAISE NOTICE ');';
    END IF;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: Example Test Post Creation (UNCOMMENT AND MODIFY)
-- ============================================================================

-- IMPORTANT: Replace 'YOUR_REAL_USER_ID' with an actual user ID from auth.users
-- You can get user IDs from the query in STEP 1 above

-- Example 1: Single platform test (UNCOMMENT TO USE)
/*
SELECT create_production_test_post(
    'YOUR_REAL_USER_ID',  -- Replace with real user ID
    'Production test: n8n workflow verification! 🚀 This should publish in 2 minutes.',
    ARRAY['twitter'],
    2  -- 2 minutes from now
);
*/

-- Example 2: Multi-platform test (UNCOMMENT TO USE)
/*
SELECT create_production_test_post(
    'YOUR_REAL_USER_ID',  -- Replace with real user ID
    'Multi-platform production test! 📱 Testing Twitter, Facebook, and LinkedIn integration.',
    ARRAY['twitter', 'facebook', 'linkedin'],
    3  -- 3 minutes from now
);
*/

-- ============================================================================
-- STEP 6: Monitor Functions
-- ============================================================================

-- Function to check what posts are pending for n8n
CREATE OR REPLACE VIEW production_monitoring AS
SELECT 
    p.id as post_id,
    p.user_id,
    u.email as user_email,
    p.content,
    p.platforms,
    p.scheduling_status,
    p.scheduled_for,
    q.status as queue_status,
    q.n8n_execution_id,
    CASE 
        WHEN p.scheduled_for <= NOW() AND p.scheduling_status = 'scheduled' THEN 'DUE NOW'
        WHEN p.scheduled_for <= NOW() + INTERVAL '2 minutes' THEN 'DUE SOON'
        ELSE 'PENDING'
    END as urgency,
    p.created_at
FROM posts p
LEFT JOIN scheduled_posts_queue q ON p.id = q.post_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.scheduling_status IN ('scheduled', 'processing', 'published', 'failed')
ORDER BY p.scheduled_for;

-- Show current monitoring view
SELECT * FROM production_monitoring;

-- ============================================================================
-- STEP 7: Useful Production Queries
-- ============================================================================

-- Query to see pending posts (what n8n will process)
-- SELECT * FROM get_pending_scheduled_posts();

-- Query to check queue health
-- SELECT * FROM get_queue_health();

-- Query to see recent posts by user
-- SELECT 
--     p.content,
--     p.scheduling_status,
--     p.scheduled_for,
--     p.published_at,
--     p.error_message
-- FROM posts p
-- WHERE p.user_id = 'YOUR_USER_ID'
-- AND p.created_at > NOW() - INTERVAL '24 hours'
-- ORDER BY p.created_at DESC;

-- Query to reset stuck posts (if needed)
-- SELECT reset_stuck_processing_posts(30);

-- Query to cleanup old entries (maintenance)
-- SELECT cleanup_old_queue_entries(30);

-- ============================================================================
-- STEP 8: Final Instructions
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRODUCTION TESTING INSTRUCTIONS';
    RAISE NOTICE '==================================';
    RAISE NOTICE '';
    RAISE NOTICE '1. 👤 Get a real user ID:';
    RAISE NOTICE '   SELECT id, email FROM auth.users LIMIT 5;';
    RAISE NOTICE '';
    RAISE NOTICE '2. 🧪 Create test post:';
    RAISE NOTICE '   SELECT create_production_test_post(''user-id'', ''content'', ARRAY[''twitter''], 2);';
    RAISE NOTICE '';
    RAISE NOTICE '3. 📊 Monitor queue:';
    RAISE NOTICE '   SELECT * FROM production_monitoring;';
    RAISE NOTICE '   SELECT * FROM get_queue_health();';
    RAISE NOTICE '';
    RAISE NOTICE '4. 🔧 Set up n8n:';
    RAISE NOTICE '   - Import n8n/complete-production-workflow.json';
    RAISE NOTICE '   - Configure Supabase API credentials';
    RAISE NOTICE '   - Activate workflow';
    RAISE NOTICE '';
    RAISE NOTICE '5. ✅ Verify publishing:';
    RAISE NOTICE '   - Check social media platforms';
    RAISE NOTICE '   - Monitor n8n execution logs';
    RAISE NOTICE '   - Verify database status updates';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Only use real user IDs from auth.users table';
    RAISE NOTICE '⚠️  IMPORTANT: Ensure OAuth credentials exist for test users';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production n8n testing!';
    RAISE NOTICE '';
END $$;
