-- Migration to support multiple accounts per platform and add subreddit management
-- Run this in your Supabase SQL editor

-- 1. Drop the unique constraint on social_accounts to allow multiple accounts per platform
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_platform_key;

-- 2. Add account_name field to help distinguish between multiple accounts
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 3. Add account_type field for business/personal distinction
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'company'));

-- 4. Create user_subreddits table for Reddit subreddit management
CREATE TABLE IF NOT EXISTS user_subreddits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- subreddit name without r/ prefix
  flairs TEXT[] DEFAULT '{}', -- array of available flairs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name) -- one entry per subreddit per user
);

-- 5. Enable RLS on user_subreddits
ALTER TABLE user_subreddits ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for user_subreddits
CREATE POLICY "Users can view their own subreddits" ON user_subreddits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subreddits" ON user_subreddits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subreddits" ON user_subreddits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subreddits" ON user_subreddits
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subreddits_user_id ON user_subreddits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subreddits_name ON user_subreddits(name);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);

-- 8. Add updated_at trigger for user_subreddits
CREATE TRIGGER update_user_subreddits_updated_at
  BEFORE UPDATE ON user_subreddits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Update social_accounts to have better indexing for multiple accounts
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(user_id, platform, is_active);

-- 10. Add platform_requirements table to store connection requirements
CREATE TABLE IF NOT EXISTS platform_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'facebook', 'reddit')),
  requirement_type TEXT NOT NULL, -- 'business_account', 'admin_permissions', etc.
  requirement_text TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, requirement_type)
);

-- 11. Insert default platform requirements
INSERT INTO platform_requirements (platform, requirement_type, requirement_text, is_mandatory) VALUES
-- Instagram requirements
('instagram', 'business_account', 'Account must be a business account', true),
('instagram', 'facebook_connection', 'Account must be connected to a Facebook business page', true),
('instagram', 'admin_permissions', 'Account must have admin permissions', true),
('instagram', 'business_requirements', 'Account must meet Instagram business requirements', true),

-- Facebook requirements
('facebook', 'business_account', 'Account must be a business account', true),
('facebook', 'page_association', 'Account must have a Facebook page associated', true),
('facebook', 'admin_permissions', 'Account must have admin permissions for the page', true),
('facebook', 'business_policies', 'Account must comply with Facebook''s business policies', true),

-- LinkedIn requirements
('linkedin', 'company_permissions', 'Account must have permissions to manage company pages', true),
('linkedin', 'admin_access', 'Account must have appropriate admin access', true),
('linkedin', 'business_policies', 'Account must comply with LinkedIn''s business policies', true),

-- Twitter/X requirements
('twitter', 'api_access', 'Account must have API access enabled', true),
('twitter', 'developer_policies', 'Account must comply with X''s developer policies', true),
('twitter', 'appropriate_permissions', 'Account must have appropriate permissions', true),
('twitter', 'business_verification', 'Account must be verified for business use', false),

-- Reddit requirements
('reddit', 'api_access', 'Account must have Reddit API access', true),
('reddit', 'subreddit_permissions', 'Account must have posting permissions in target subreddits', true),
('reddit', 'rate_limits', 'Account must comply with Reddit rate limits', true)
ON CONFLICT (platform, requirement_type) DO NOTHING;

-- 12. Enable RLS on platform_requirements (read-only for all authenticated users)
ALTER TABLE platform_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view platform requirements" ON platform_requirements
  FOR SELECT USING (auth.role() = 'authenticated');

-- 13. Create function to get user's active accounts for a platform
CREATE OR REPLACE FUNCTION get_user_active_accounts(user_uuid UUID, platform_name TEXT)
RETURNS TABLE (
  id UUID,
  platform_username TEXT,
  account_name TEXT,
  account_type TEXT,
  is_active BOOLEAN,
  token_expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.platform_username,
    sa.account_name,
    sa.account_type,
    sa.is_active,
    sa.token_expires_at
  FROM social_accounts sa
  WHERE sa.user_id = user_uuid 
    AND sa.platform = platform_name 
    AND sa.is_active = true
  ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to get user's subreddits
CREATE OR REPLACE FUNCTION get_user_subreddits(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  flairs TEXT[],
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.name,
    us.flairs,
    us.is_active,
    us.created_at
  FROM user_subreddits us
  WHERE us.user_id = user_uuid 
    AND us.is_active = true
  ORDER BY us.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_active_accounts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subreddits(UUID) TO authenticated;
