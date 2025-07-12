-- Create the get_pending_scheduled_posts function for n8n workflow
-- Run this in your Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_pending_scheduled_posts();

CREATE OR REPLACE FUNCTION get_pending_scheduled_posts()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  platform text,
  status text,
  scheduled_at timestamptz,
  image_url text,
  platform_post_ids jsonb,
  engagement_stats jsonb,
  generated_by_ai boolean,
  ai_prompt text,
  error_message text,
  retry_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  scheduling_status text,
  scheduled_for timestamptz,
  n8n_execution_id text,
  last_retry_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
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
  ORDER BY p.scheduled_at ASC;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;

-- Also create a simpler version that returns JSON for easier n8n handling
-- Drop existing JSON function if it exists
DROP FUNCTION IF EXISTS get_pending_scheduled_posts_json();

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
  ) posts_data;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts_json() TO service_role;
