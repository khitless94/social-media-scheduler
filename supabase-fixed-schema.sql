-- Fixed Supabase Schema for Cron Polling Social Media Scheduler
-- Run this in your Supabase SQL Editor

-- 1. Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS post_logs CASCADE;
DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- 2. Create scheduled_posts table with exact column names expected by n8n
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'instagram')),
    content TEXT NOT NULL,
    image_url TEXT,
    title TEXT, -- For Reddit posts
    scheduled_time TIMESTAMPTZ NOT NULL,
    posted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create post_logs table for tracking
CREATE TABLE post_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'retry')),
    message TEXT,
    response_data JSONB, -- Store API response for debugging
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX idx_scheduled_posts_pending 
ON scheduled_posts (scheduled_time, posted) 
WHERE posted = FALSE;

CREATE INDEX idx_scheduled_posts_user 
ON scheduled_posts (user_id, created_at DESC);

CREATE INDEX idx_post_logs_post 
ON post_logs (post_id, created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts" 
ON scheduled_posts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts" 
ON scheduled_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts" 
ON scheduled_posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts" 
ON scheduled_posts FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Create RLS policies for post_logs
CREATE POLICY "Users can view their own post logs" 
ON post_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert post logs" 
ON post_logs FOR INSERT 
WITH CHECK (true); -- Allow n8n to insert logs

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger for scheduled_posts
CREATE TRIGGER update_scheduled_posts_updated_at 
    BEFORE UPDATE ON scheduled_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Test the exact query that n8n will use
-- This should return no errors
SELECT * FROM scheduled_posts WHERE scheduled_time <= NOW() AND posted = FALSE LIMIT 10;

-- 11. Insert sample test data (optional - uncomment to test)
-- INSERT INTO scheduled_posts (user_id, platform, content, scheduled_time) VALUES
-- ((SELECT id FROM auth.users LIMIT 1), 'twitter', 'Test post from cron scheduler!', NOW() + INTERVAL '1 minute'),
-- ((SELECT id FROM auth.users LIMIT 1), 'facebook', 'Another test post for Facebook!', NOW() + INTERVAL '2 minutes'),
-- ((SELECT id FROM auth.users LIMIT 1), 'linkedin', 'Professional update via automation!', NOW() + INTERVAL '3 minutes'),
-- ((SELECT id FROM auth.users LIMIT 1), 'reddit', 'Reddit post with automation!', NOW() + INTERVAL '4 minutes'),
-- ((SELECT id FROM auth.users LIMIT 1), 'instagram', 'Instagram post via scheduler!', NOW() + INTERVAL '5 minutes');

-- 12. Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scheduled_posts' 
ORDER BY ordinal_position;

-- 13. Test queries for monitoring
-- View pending posts:
-- SELECT * FROM scheduled_posts WHERE posted = FALSE ORDER BY scheduled_time;

-- View recent logs:
-- SELECT * FROM post_logs ORDER BY created_at DESC LIMIT 20;

-- View posts by platform:
-- SELECT platform, COUNT(*) as total, COUNT(CASE WHEN posted THEN 1 END) as posted 
-- FROM scheduled_posts GROUP BY platform;
