-- 🔧 FINAL MIGRATION: Handles ALL conflicts
-- Copy and paste this ENTIRE script into your Supabase SQL Editor

-- Wrap everything in a transaction for safety
BEGIN;

-- Step 1: Drop ALL existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop user_subreddits policies
    DROP POLICY IF EXISTS "Users can view their own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Users can insert their own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Users can update their own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Users can delete their own subreddits" ON user_subreddits;
    
    -- Drop any other potential policy names
    DROP POLICY IF EXISTS "Users can manage their own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Enable read access for own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Enable insert for own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Enable update for own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Enable delete for own subreddits" ON user_subreddits;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some policies did not exist, continuing...';
END $$;

-- Step 2: Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_user_subreddits_updated_at ON user_subreddits;
DROP TRIGGER IF EXISTS set_updated_at ON user_subreddits;
DROP TRIGGER IF EXISTS update_updated_at ON user_subreddits;

-- Step 3: Drop the unique constraint to allow multiple accounts per platform
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_platform_key;
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS unique_user_platform;

-- Step 4: Add new columns for enhanced account management (IF NOT EXISTS)
DO $$ 
BEGIN
    -- Add account_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'social_accounts' AND column_name = 'account_name') THEN
        ALTER TABLE social_accounts ADD COLUMN account_name TEXT;
    END IF;
    
    -- Add account_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'social_accounts' AND column_name = 'account_type') THEN
        ALTER TABLE social_accounts ADD COLUMN account_type TEXT DEFAULT 'personal' 
        CHECK (account_type IN ('personal', 'business', 'company'));
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'social_accounts' AND column_name = 'is_active') THEN
        ALTER TABLE social_accounts ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some columns already exist, continuing...';
END $$;

-- Step 5: Create user_subreddits table (IF NOT EXISTS)
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

-- Step 6: Enable RLS on tables
ALTER TABLE user_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Step 7: Create fresh policies
CREATE POLICY "Users can view their own subreddits" ON user_subreddits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subreddits" ON user_subreddits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subreddits" ON user_subreddits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subreddits" ON user_subreddits
  FOR DELETE USING (auth.uid() = user_id);

-- Step 8: Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_subreddits_user_id ON user_subreddits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subreddits_name ON user_subreddits(name);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_accounts(user_id, platform, is_active);

-- Step 9: Create/recreate the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Create the trigger (fresh)
CREATE TRIGGER update_user_subreddits_updated_at
  BEFORE UPDATE ON user_subreddits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create helper functions (CREATE OR REPLACE handles existing)
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

-- Step 12: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_active_accounts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subreddits(UUID) TO authenticated;

-- Commit the transaction
COMMIT;

-- ✅ MIGRATION COMPLETE!
-- 🚀 Next steps:
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Go to: http://localhost:8081/dashboard
-- 3. Navigate to Settings → Connections tab
-- 4. Test all the enhanced social media features!

-- 📋 What this migration added:
-- • Multiple accounts per platform support
-- • Reddit subreddit management with flairs
-- • Account types (personal, business, company)
-- • Proper security with Row Level Security
-- • Performance optimized with indexes
-- • Helper functions for enhanced features
