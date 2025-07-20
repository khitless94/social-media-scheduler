-- ⚡ QUICK SETUP: Run this in your Supabase SQL Editor
-- This enables multiple accounts per platform and adds subreddit management

-- Wrap everything in a transaction for safety
BEGIN;

-- 1. Drop the unique constraint to allow multiple accounts per platform
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_platform_key;

-- 2. Add new columns for enhanced account management
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'company'));

-- 3. Create user_subreddits table for Reddit management
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

-- 4. Enable RLS on user_subreddits
ALTER TABLE user_subreddits ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_subreddits (drop existing first)
DROP POLICY IF EXISTS "Users can view their own subreddits" ON user_subreddits;
DROP POLICY IF EXISTS "Users can insert their own subreddits" ON user_subreddits;
DROP POLICY IF EXISTS "Users can update their own subreddits" ON user_subreddits;
DROP POLICY IF EXISTS "Users can delete their own subreddits" ON user_subreddits;

CREATE POLICY "Users can view their own subreddits" ON user_subreddits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subreddits" ON user_subreddits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subreddits" ON user_subreddits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subreddits" ON user_subreddits
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subreddits_user_id ON user_subreddits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subreddits_name ON user_subreddits(name);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(user_id, platform, is_active);

-- 7. Add updated_at trigger for user_subreddits (drop existing first)
DROP TRIGGER IF EXISTS update_user_subreddits_updated_at ON user_subreddits;
CREATE TRIGGER update_user_subreddits_updated_at
  BEFORE UPDATE ON user_subreddits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Create helper functions (CREATE OR REPLACE handles existing functions)
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

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_active_accounts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subreddits(UUID) TO authenticated;

-- Commit the transaction
COMMIT;

-- ✅ Setup complete! Your database now supports:
-- • Multiple accounts per platform (Instagram, Facebook, LinkedIn, Twitter, Reddit)
-- • Reddit subreddit management with flairs
-- • Enhanced account management with business/personal types
-- • Proper security with Row Level Security (RLS)

-- 🚀 Next steps:
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Go to Settings → Connections tab
-- 3. Test the enhanced social media features!
