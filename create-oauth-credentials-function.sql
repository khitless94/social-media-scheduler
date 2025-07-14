-- Create function to get user OAuth credentials for n8n
-- Run this in your Supabase SQL Editor

-- First, create the user_oauth_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_oauth_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scope TEXT,
    platform_user_id TEXT,
    platform_username TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Enable RLS on the table
ALTER TABLE user_oauth_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own OAuth credentials" ON user_oauth_credentials;
DROP POLICY IF EXISTS "Users can insert their own OAuth credentials" ON user_oauth_credentials;
DROP POLICY IF EXISTS "Users can update their own OAuth credentials" ON user_oauth_credentials;
DROP POLICY IF EXISTS "Users can delete their own OAuth credentials" ON user_oauth_credentials;

-- Create RLS policies
CREATE POLICY "Users can view their own OAuth credentials" ON user_oauth_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth credentials" ON user_oauth_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth credentials" ON user_oauth_credentials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth credentials" ON user_oauth_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.get_user_oauth_credentials(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_oauth_credentials(UUID);

-- Create the function that n8n is trying to call
CREATE OR REPLACE FUNCTION public.get_user_oauth_credentials(target_user_id UUID, target_platform TEXT DEFAULT NULL)
RETURNS TABLE (
    platform TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scope TEXT,
    platform_user_id TEXT,
    platform_username TEXT,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If platform is specified, return credentials for that platform only
    IF target_platform IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            uoc.platform,
            uoc.access_token,
            uoc.refresh_token,
            uoc.token_expires_at,
            uoc.scope,
            uoc.platform_user_id,
            uoc.platform_username,
            uoc.is_active
        FROM user_oauth_credentials uoc
        WHERE uoc.user_id = target_user_id 
        AND uoc.platform = target_platform
        AND uoc.is_active = true;
    ELSE
        -- Return all active credentials for the user
        RETURN QUERY
        SELECT 
            uoc.platform,
            uoc.access_token,
            uoc.refresh_token,
            uoc.token_expires_at,
            uoc.scope,
            uoc.platform_user_id,
            uoc.platform_username,
            uoc.is_active
        FROM user_oauth_credentials uoc
        WHERE uoc.user_id = target_user_id 
        AND uoc.is_active = true;
    END IF;
END;
$$;

-- Grant permissions to the function
GRANT EXECUTE ON FUNCTION public.get_user_oauth_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_oauth_credentials TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_oauth_credentials TO service_role;

-- Drop existing store function if it exists
DROP FUNCTION IF EXISTS public.store_user_oauth_credentials;

-- Create a function to store OAuth credentials (for when users connect their accounts)
CREATE OR REPLACE FUNCTION public.store_user_oauth_credentials(
    target_user_id UUID,
    target_platform TEXT,
    access_token TEXT,
    refresh_token TEXT DEFAULT NULL,
    token_expires_at TIMESTAMPTZ DEFAULT NULL,
    scope TEXT DEFAULT NULL,
    platform_user_id TEXT DEFAULT NULL,
    platform_username TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    credential_id UUID;
BEGIN
    -- Insert or update OAuth credentials
    INSERT INTO user_oauth_credentials (
        user_id,
        platform,
        access_token,
        refresh_token,
        token_expires_at,
        scope,
        platform_user_id,
        platform_username,
        is_active,
        updated_at
    ) VALUES (
        target_user_id,
        target_platform,
        access_token,
        refresh_token,
        token_expires_at,
        scope,
        platform_user_id,
        platform_username,
        true,
        NOW()
    )
    ON CONFLICT (user_id, platform) 
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        scope = EXCLUDED.scope,
        platform_user_id = EXCLUDED.platform_user_id,
        platform_username = EXCLUDED.platform_username,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO credential_id;
    
    RETURN credential_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.store_user_oauth_credentials TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_user_oauth_credentials TO service_role;

-- Test the function works
DO $$
BEGIN
    RAISE NOTICE '✅ OAuth credentials functions created successfully';
    RAISE NOTICE '🔧 Your n8n workflow should now be able to fetch user OAuth credentials';
    RAISE NOTICE '💡 Users need to connect their social media accounts to populate this table';
END;
$$;
