-- Simple function to get pending scheduled posts for n8n
-- Run this in your Supabase SQL Editor

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_pending_scheduled_posts();
DROP FUNCTION IF EXISTS get_pending_scheduled_posts_json();

-- Create a simple JSON function for n8n workflow
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
      AND p.scheduled_at <= NOW()
      AND (p.n8n_execution_id IS NULL OR p.error_message IS NOT NULL)
      AND (p.retry_count < 3 OR p.retry_count IS NULL)
    ORDER BY p.scheduled_at ASC
    LIMIT 10
  ) posts_data;
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permission to service role and anon
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts_json() TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts_json() TO anon;

-- Test the function
SELECT get_pending_scheduled_posts_json();
