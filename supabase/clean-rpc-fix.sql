-- Clean Fix for Missing RPC Functions
-- This version drops all existing functions first to avoid conflicts

-- 1. Drop all existing functions that might conflict
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, JSONB);
DROP FUNCTION IF EXISTS create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, JSONB);
DROP FUNCTION IF EXISTS get_user_scheduled_posts(UUID);
DROP FUNCTION IF EXISTS update_scheduled_post_status(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_pending_scheduled_posts();
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. Drop and recreate scheduled_posts table to ensure clean state
DROP TABLE IF EXISTS scheduled_posts CASCADE;

CREATE TABLE scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'instagram')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'published', 'failed', 'cancelled')),
  platform_post_id TEXT,
  platform_specific_data JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_platform ON scheduled_posts(platform);

-- 4. Create the main RPC function (the one your frontend is calling)
CREATE FUNCTION create_scheduled_post_bypass_rls(
  p_user_id UUID,
  p_content TEXT,
  p_platform TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_post_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  IF p_content IS NULL OR LENGTH(TRIM(p_content)) = 0 THEN
    RAISE EXCEPTION 'content cannot be empty';
  END IF;
  
  IF p_platform NOT IN ('twitter', 'facebook', 'linkedin', 'reddit', 'instagram') THEN
    RAISE EXCEPTION 'invalid platform: %', p_platform;
  END IF;
  
  IF p_scheduled_for <= NOW() THEN
    RAISE EXCEPTION 'scheduled_for must be in the future';
  END IF;

  -- Insert the scheduled post
  INSERT INTO scheduled_posts (
    user_id,
    content,
    platform,
    scheduled_for,
    status
  ) VALUES (
    p_user_id,
    p_content,
    p_platform,
    p_scheduled_for,
    'scheduled'
  ) RETURNING id INTO new_post_id;

  RETURN new_post_id;
END;
$$;

-- 5. Create function to get user's scheduled posts
CREATE FUNCTION get_user_scheduled_posts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  platform TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT,
  platform_post_id TEXT,
  platform_specific_data JSONB,
  error_message TEXT,
  retry_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.title,
    sp.content,
    sp.platform,
    sp.scheduled_for,
    sp.status,
    sp.platform_post_id,
    sp.platform_specific_data,
    sp.error_message,
    sp.retry_count,
    sp.created_at,
    sp.updated_at
  FROM scheduled_posts sp
  WHERE sp.user_id = p_user_id
  ORDER BY sp.scheduled_for DESC;
END;
$$;

-- 6. Create function to update post status
CREATE FUNCTION update_scheduled_post_status(
  p_post_id UUID,
  p_status TEXT,
  p_platform_post_id TEXT,
  p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE scheduled_posts 
  SET 
    status = p_status,
    platform_post_id = COALESCE(p_platform_post_id, platform_post_id),
    error_message = p_error_message,
    retry_count = CASE 
      WHEN p_status = 'failed' THEN retry_count + 1 
      ELSE retry_count 
    END,
    updated_at = NOW()
  WHERE id = p_post_id;
  
  RETURN FOUND;
END;
$$;

-- 7. Create function to get pending posts for n8n
CREATE FUNCTION get_pending_scheduled_posts()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  platform TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  platform_specific_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.user_id,
    sp.title,
    sp.content,
    sp.platform,
    sp.scheduled_for,
    sp.platform_specific_data
  FROM scheduled_posts sp
  WHERE sp.status = 'scheduled'
    AND sp.scheduled_for <= NOW()
  ORDER BY sp.scheduled_for ASC
  LIMIT 10;
END;
$$;

-- 8. Create updated_at trigger function
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger
CREATE TRIGGER update_scheduled_posts_updated_at
    BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant permissions
GRANT ALL ON scheduled_posts TO authenticated;
GRANT ALL ON scheduled_posts TO anon;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION create_scheduled_post_bypass_rls(UUID, TEXT, TEXT, TIMESTAMP WITH TIME ZONE) TO anon;
GRANT EXECUTE ON FUNCTION get_user_scheduled_posts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_scheduled_posts(UUID) TO anon;
GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_scheduled_post_status(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO anon;

-- 11. Disable RLS for testing
ALTER TABLE scheduled_posts DISABLE ROW LEVEL SECURITY;

-- 12. Test the function
SELECT 'Testing create_scheduled_post_bypass_rls function' as test_name;

SELECT create_scheduled_post_bypass_rls(
  '12345678-1234-1234-1234-123456789abc'::UUID,
  'This is a test post created via RPC function',
  'twitter',
  NOW() + INTERVAL '1 hour'
) as created_post_id;

-- 13. Verify the post was created
SELECT 'Verification: Post created successfully' as status, 
       count(*) as post_count,
       array_agg(platform) as platforms
FROM scheduled_posts 
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- 14. Test getting user posts
SELECT 'Testing get_user_scheduled_posts function' as test_name;
SELECT id, title, content, platform, scheduled_for, status 
FROM get_user_scheduled_posts('12345678-1234-1234-1234-123456789abc');

-- 15. Test getting pending posts
SELECT 'Testing get_pending_scheduled_posts function' as test_name;
SELECT id, user_id, platform, scheduled_for 
FROM get_pending_scheduled_posts();

-- 16. Success message
SELECT '🎉 SUCCESS! All RPC functions created and tested successfully!' as final_status;
