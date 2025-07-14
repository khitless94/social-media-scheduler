-- Simple fix for n8n function - run this in Supabase SQL Editor

-- First, let's check if the function exists
SELECT routine_name, routine_schema 
FROM information_schema.routines 
WHERE routine_name = 'get_pending_scheduled_posts';

-- Drop and recreate the function in the public schema
DROP FUNCTION IF EXISTS public.get_pending_scheduled_posts();

-- Create a simple version that returns JSON (easier for n8n to handle)
CREATE OR REPLACE FUNCTION public.get_pending_scheduled_posts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Simple query to get scheduled posts that are ready to be published
  SELECT json_agg(row_to_json(posts_data))
  INTO result
  FROM (
    SELECT 
      p.id,
      p.user_id,
      p.content,
      p.platforms,
      p.media_urls,
      p.scheduled_for,
      p.scheduling_status,
      p.status,
      p.created_at,
      p.updated_at
    FROM posts p
    WHERE 
      p.scheduling_status = 'scheduled' 
      AND p.scheduled_for <= NOW()
      AND p.status = 'scheduled'
    ORDER BY p.scheduled_for ASC
    LIMIT 10
  ) posts_data;

  -- Return empty array if no results
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;

  RETURN result;
END;
$$;

-- Grant permissions to all roles that might need it
GRANT EXECUTE ON FUNCTION public.get_pending_scheduled_posts() TO anon;
GRANT EXECUTE ON FUNCTION public.get_pending_scheduled_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_scheduled_posts() TO service_role;

-- Also create the table version for compatibility
CREATE OR REPLACE FUNCTION public.get_pending_scheduled_posts_table()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    content text,
    platforms text[],
    media_urls text[],
    scheduled_for timestamptz,
    scheduling_status text,
    status text
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
        p.platforms,
        p.media_urls,
        p.scheduled_for,
        p.scheduling_status::text,
        p.status
    FROM posts p
    WHERE 
        p.scheduling_status = 'scheduled' 
        AND p.scheduled_for <= NOW()
        AND p.status = 'scheduled'
    ORDER BY p.scheduled_for ASC
    LIMIT 10;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_scheduled_posts_table() TO anon;
GRANT EXECUTE ON FUNCTION public.get_pending_scheduled_posts_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_scheduled_posts_table() TO service_role;

-- Verify the function was created
SELECT 
    routine_name, 
    routine_schema,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name LIKE '%get_pending_scheduled_posts%';

-- Test the function
SELECT public.get_pending_scheduled_posts();
