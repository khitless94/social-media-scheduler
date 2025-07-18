-- 🎯 SIMPLE SCHEDULING FIX: Clean posts table setup (NO n8n dependencies)
-- This removes all n8n components and creates a simple, reliable scheduling system

-- Step 1: Clean up all n8n-related triggers and functions
DROP TRIGGER IF EXISTS add_to_scheduled_queue_trigger ON posts;
DROP TRIGGER IF EXISTS sync_posts_to_queue_trigger ON posts;
DROP TRIGGER IF EXISTS trigger_add_to_scheduled_queue ON posts;
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;

-- Drop all n8n-related functions
DROP FUNCTION IF EXISTS add_to_scheduled_queue() CASCADE;
DROP FUNCTION IF EXISTS sync_posts_to_queue() CASCADE;
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Ensure posts table has all required columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Update status constraint to include 'scheduled'
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
CHECK (status IN ('draft', 'scheduled', 'published', 'failed'));

-- Step 4: Create simple updated_at trigger (optional but useful)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create simple RLS policies for posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own posts
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
CREATE POLICY "Users can view own posts" ON posts
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own posts
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own posts
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Clean up n8n-related tables (optional - uncomment if you want to remove them)
-- DROP TABLE IF EXISTS scheduled_posts_queue CASCADE;
-- DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- ✅ DONE! Your posts table is now ready for simple scheduling
-- No n8n dependencies, no complex workflows, just simple and reliable scheduling
