-- Fix the scheduled posts data and function
-- Run this in your Supabase SQL Editor

-- First, let's update the existing scheduled post to have a proper schedule time
UPDATE posts 
SET 
  scheduled_at = NOW() + INTERVAL '2 minutes',
  scheduled_for = NOW() + INTERVAL '2 minutes',
  user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE id = 'ac239c98-54df-4aa1-ac18-7c8df49568b7';

-- Update the function to be more flexible with the date logic
CREATE OR REPLACE FUNCTION get_pending_scheduled_posts_json()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(posts_data))
  INTO result
  FROM (
    SELECT 
      p.id,
      p.user_id,
      p.content,
      p.platform,
      p.status,
      p.scheduled_at,
      p.image_url,
      p.platform_post_ids,
      p.engagement_stats,
      p.generated_by_ai,
      p.ai_prompt,
      p.error_message,
      p.retry_count,
      p.created_at,
      p.updated_at,
      p.scheduling_status,
      p.scheduled_for,
      p.n8n_execution_id,
      p.last_retry_at
    FROM posts p
    WHERE 
      p.status = 'scheduled' 
      AND (
        p.scheduled_at <= NOW() OR 
        p.scheduled_for <= NOW() OR
        p.scheduled_at IS NULL
      )
      AND (p.n8n_execution_id IS NULL OR p.error_message IS NOT NULL)
      AND (p.retry_count < 3 OR p.retry_count IS NULL)
    ORDER BY 
      COALESCE(p.scheduled_at, p.scheduled_for, p.created_at) ASC
    LIMIT 10
  ) posts_data;
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Create a test scheduled post for immediate processing
INSERT INTO posts (
  id,
  user_id,
  content,
  platform,
  status,
  scheduled_at,
  scheduled_for,
  platform_post_ids,
  engagement_stats,
  generated_by_ai,
  retry_count,
  scheduling_status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  '🧪 Test post from n8n workflow - should be processed immediately!',
  'twitter',
  'scheduled',
  NOW() + INTERVAL '1 minute',
  NOW() + INTERVAL '1 minute',
  '{}',
  '{}',
  false,
  0,
  'draft'
) ON CONFLICT (id) DO NOTHING;

-- Test the function again
SELECT get_pending_scheduled_posts_json();
