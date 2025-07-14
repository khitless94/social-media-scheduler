-- Create scheduled posts queue table for n8n workflow
CREATE TABLE IF NOT EXISTS scheduled_posts_queue (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    platforms JSONB NOT NULL DEFAULT '[]',
    media_urls JSONB NOT NULL DEFAULT '[]',
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    platform_post_ids JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_status ON scheduled_posts_queue(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_scheduled_for ON scheduled_posts_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_user_id ON scheduled_posts_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_post_id ON scheduled_posts_queue(post_id);

-- Enable RLS
ALTER TABLE scheduled_posts_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scheduled posts" ON scheduled_posts_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts" ON scheduled_posts_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts" ON scheduled_posts_queue
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for n8n)
CREATE POLICY "Service role full access" ON scheduled_posts_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON scheduled_posts_queue TO service_role;
GRANT SELECT, INSERT, UPDATE ON scheduled_posts_queue TO authenticated;

-- Grant sequence permissions (PostgreSQL auto-generates sequence name)
DO $$
BEGIN
    -- Grant permissions on the auto-generated sequence
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE ' || pg_get_serial_sequence('scheduled_posts_queue', 'id') || ' TO authenticated';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE ' || pg_get_serial_sequence('scheduled_posts_queue', 'id') || ' TO service_role';
EXCEPTION
    WHEN others THEN
        -- If sequence doesn't exist yet, that's okay
        RAISE NOTICE 'Sequence permissions will be set after table creation';
END $$;

-- Test the table
INSERT INTO scheduled_posts_queue (
    post_id, 
    user_id, 
    content, 
    platforms, 
    scheduled_for
) VALUES (
    'test-post-' || extract(epoch from now()),
    '11111111-1111-1111-1111-111111111111',
    'Test post for scheduler queue',
    '["twitter", "facebook"]',
    NOW() + INTERVAL '2 minutes'
) ON CONFLICT (post_id) DO NOTHING;

-- Verify the insert
SELECT * FROM scheduled_posts_queue WHERE post_id LIKE 'test-post-%' ORDER BY created_at DESC LIMIT 1;
