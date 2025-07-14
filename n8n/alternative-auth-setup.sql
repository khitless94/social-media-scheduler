-- Alternative: Create Real Auth User for Testing
-- This approach maintains foreign key constraints but creates a proper auth user

-- OPTION 2: Create a real auth user (if you want to keep foreign key constraints)

-- 1. First, let's check what auth users exist
SELECT 'Existing auth users' as info, id, email, created_at 
FROM auth.users 
LIMIT 5;

-- 2. Create a test auth user properly
-- Note: This uses Supabase's auth system correctly
DO $$
DECLARE
    test_user_id UUID := '12345678-1234-1234-1234-123456789abc';
    test_email TEXT := 'test-n8n@example.com';
BEGIN
    -- Insert into auth.users (this is the proper way in Supabase)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role,
        aud
    ) VALUES (
        test_user_id,
        '00000000-0000-0000-0000-000000000000',
        test_email,
        crypt('test-password-123', gen_salt('bf')), -- Encrypted password
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Test N8N User", "avatar_url": null}',
        false,
        'authenticated',
        'authenticated'
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    -- Also insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        test_user_id,
        jsonb_build_object('sub', test_user_id::text, 'email', test_email),
        'email',
        NOW(),
        NOW()
    ) ON CONFLICT (provider, user_id) DO UPDATE SET
        updated_at = NOW();

    RAISE NOTICE 'Test user created successfully with ID: %', test_user_id;
END $$;

-- 3. Now create the oauth_credentials table WITH foreign key constraint
DROP TABLE IF EXISTS oauth_credentials CASCADE;

CREATE TABLE oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Keep foreign key
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'instagram')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  platform_user_id TEXT,
  platform_username TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_expires_at ON oauth_credentials(expires_at);

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_oauth_credentials_updated_at ON oauth_credentials;
CREATE TRIGGER update_oauth_credentials_updated_at
    BEFORE UPDATE ON oauth_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert test OAuth credentials (this will now work with the real auth user)
INSERT INTO oauth_credentials (user_id, platform, access_token, refresh_token, expires_at, scope, platform_user_id, platform_username)
VALUES 
  (
    '12345678-1234-1234-1234-123456789abc',
    'twitter',
    'test_twitter_access_token_123',
    'test_twitter_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'tweet.read tweet.write users.read',
    'twitter_user_123',
    'test_twitter_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'facebook',
    'test_facebook_access_token_123',
    'test_facebook_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'pages_manage_posts pages_read_engagement',
    'facebook_user_123',
    'test_facebook_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'linkedin',
    'test_linkedin_access_token_123',
    'test_linkedin_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'w_member_social',
    'linkedin_user_123',
    'test_linkedin_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'reddit',
    'test_reddit_access_token_123',
    'test_reddit_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'submit identity',
    'reddit_user_123',
    'test_reddit_user'
  ),
  (
    '12345678-1234-1234-1234-123456789abc',
    'instagram',
    'test_instagram_access_token_123',
    'test_instagram_refresh_token_123',
    NOW() + INTERVAL '2 hours',
    'instagram_basic instagram_content_publish',
    'instagram_user_123',
    'test_instagram_user'
  )
ON CONFLICT (user_id, platform) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

-- 7. Create helper function for n8n
CREATE OR REPLACE FUNCTION get_user_oauth_credentials(p_user_id UUID, p_platform TEXT)
RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  platform TEXT,
  user_id UUID,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oc.access_token,
    oc.refresh_token,
    oc.expires_at,
    oc.platform,
    oc.user_id,
    (oc.expires_at < NOW()) as is_expired
  FROM oauth_credentials oc
  WHERE oc.user_id = p_user_id 
    AND oc.platform = p_platform
    AND oc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 8. Set up RLS policies
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own credentials
CREATE POLICY "Users can view their own oauth credentials" ON oauth_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth credentials" ON oauth_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth credentials" ON oauth_credentials
  FOR UPDATE USING (auth.uid() = user_id);

-- For n8n testing, we need to allow service role access
CREATE POLICY "Service role can access all oauth credentials" ON oauth_credentials
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Grant permissions
GRANT ALL ON oauth_credentials TO authenticated;
GRANT ALL ON oauth_credentials TO service_role;
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_oauth_credentials(UUID, TEXT) TO service_role;

-- 10. Verification
SELECT 'Auth user created' as status, id, email 
FROM auth.users 
WHERE id = '12345678-1234-1234-1234-123456789abc';

SELECT 'OAuth credentials created' as status, 
       count(*) as record_count,
       array_agg(platform) as platforms
FROM oauth_credentials 
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- 11. Test the helper function
SELECT 'Helper function test' as test_name, * 
FROM get_user_oauth_credentials('12345678-1234-1234-1234-123456789abc', 'twitter');
