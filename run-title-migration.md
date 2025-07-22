# Add Title Column Migration

To add the title column to the posts table for Reddit post support, run the following SQL in your Supabase dashboard:

## SQL Migration

```sql
-- Add title column to posts table for Reddit posts
-- This migration adds a title field to support Reddit post titles

DO $$ 
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'title') THEN
        ALTER TABLE posts ADD COLUMN title TEXT;
        RAISE NOTICE '✅ Added title column to posts table';
    ELSE
        RAISE NOTICE '✓ title column already exists in posts table';
    END IF;
END $$;

-- Add comment to document the purpose
COMMENT ON COLUMN posts.title IS 'Title for Reddit posts (required for Reddit platform)';
```

## How to Run

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the above SQL code
4. Click "Run" to execute the migration

## Verification

After running the migration, you can verify it worked by running:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'title';
```

This should return one row showing the title column exists.
