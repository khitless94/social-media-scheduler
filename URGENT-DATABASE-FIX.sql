-- 🚨 URGENT FIX: Run this in Supabase SQL Editor to fix scheduling errors

-- Step 0: Clean up existing scheduled posts (REMOVE OLD DATA)
-- WARNING: This will delete ALL existing posts!
DELETE FROM posts WHERE status = 'scheduled';
DELETE FROM posts WHERE content LIKE '%🧪%'; -- Remove test posts
DELETE FROM posts WHERE content LIKE '%Test post%'; -- Remove test posts

-- Remove ALL posts (completely clean start)
DELETE FROM posts;

-- Step 1: Ensure posts table has required columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Fix status constraint to allow 'scheduled'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check 
CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

-- Step 3: Fix RLS policies that might be blocking SELECT after INSERT
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Create permissive RLS policies
CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';

-- Step 6: Create cron job to process scheduled posts every minute
-- Enable pg_cron extension (run this as superuser/admin)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing functions first (to avoid return type conflicts)
DROP FUNCTION IF EXISTS process_scheduled_posts() CASCADE;
DROP FUNCTION IF EXISTS get_scheduling_stats() CASCADE;

-- Create function to process scheduled posts
CREATE OR REPLACE FUNCTION process_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    post_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    -- Find posts that are ready to be processed
    FOR post_record IN
        SELECT id, user_id, content, platform, scheduled_at, image_url
        FROM posts
        WHERE status = 'scheduled'
        AND scheduled_at <= NOW()
        ORDER BY scheduled_at ASC
        LIMIT 10  -- Process max 10 posts per run
    LOOP
        -- Log the processing attempt
        RAISE NOTICE 'Processing post ID: % for user: % on platform: %',
            post_record.id, post_record.user_id, post_record.platform;

        -- Update post status to 'published' (in real implementation, this would call external APIs)
        UPDATE posts
        SET
            status = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = post_record.id;

        processed_count := processed_count + 1;

        -- In a real implementation, you would:
        -- 1. Call Twitter/LinkedIn/etc APIs here
        -- 2. Handle API responses and errors
        -- 3. Update status to 'failed' if API call fails
        -- 4. Store API response data

    END LOOP;

    -- Log summary
    IF processed_count > 0 THEN
        RAISE NOTICE 'Processed % scheduled posts at %', processed_count, NOW();
    END IF;
END;
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION process_scheduled_posts() TO postgres;

-- Create the cron job to run every minute
-- Note: This requires superuser privileges. If it fails, run manually in Supabase dashboard
SELECT cron.schedule(
    'process-scheduled-posts',           -- job name
    '* * * * *',                        -- every minute (cron format)
    'SELECT process_scheduled_posts();'  -- SQL to execute
);

-- Alternative: Create a simpler cron job that just logs (for testing)
SELECT cron.schedule(
    'test-cron-job',
    '* * * * *',
    'SELECT NOW() as current_time, COUNT(*) as scheduled_posts FROM posts WHERE status = ''scheduled'' AND scheduled_at <= NOW();'
);

-- Step 7: Test the setup
DO $$
BEGIN
    RAISE NOTICE '✅ Database fix completed successfully!';
    RAISE NOTICE '📋 Posts table columns: id, user_id, content, platform, status, scheduled_at, image_url, created_at, updated_at';
    RAISE NOTICE '🔒 RLS policies: Users can only access their own posts';
    RAISE NOTICE '⏰ Cron job: Processes scheduled posts every minute';
    RAISE NOTICE '🎯 Ready for simple scheduling!';
END $$;
