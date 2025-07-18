-- 🔧 QUICK FIX: Update posts status constraint to allow 'ready_for_posting'
-- This fixes the check constraint violation error

-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;

-- Add the updated constraint with 'ready_for_posting' included
ALTER TABLE posts ADD CONSTRAINT posts_status_check 
CHECK (status IN ('draft', 'scheduled', 'ready_for_posting', 'published', 'failed'));

-- Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass 
AND contype = 'c'
AND conname = 'posts_status_check';

-- Show success message
SELECT 'SUCCESS: Status constraint updated to allow ready_for_posting!' as message;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ STATUS CONSTRAINT FIXED!';
    RAISE NOTICE '';
    RAISE NOTICE 'The posts table now allows these status values:';
    RAISE NOTICE '• draft';
    RAISE NOTICE '• scheduled';
    RAISE NOTICE '• ready_for_posting  ← NEW!';
    RAISE NOTICE '• published';
    RAISE NOTICE '• failed';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Now you can:';
    RAISE NOTICE '• Visit /db-test to verify the fix works';
    RAISE NOTICE '• Visit /social-fix to start the processor';
    RAISE NOTICE '• Create posts with ready_for_posting status';
    RAISE NOTICE '';
END $$;
