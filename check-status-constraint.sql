-- Check the constraint definition for the posts table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass 
AND contype = 'c';

-- Alternative way to check valid status values
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'status';

-- Check what status values currently exist in the table
SELECT DISTINCT status, COUNT(*) 
FROM posts 
GROUP BY status 
ORDER BY status;
