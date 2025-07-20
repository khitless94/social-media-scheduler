-- 🔧 CLEAN MIGRATION: Handle existing policies and tables
-- Run this in your Supabase SQL Editor to fix conflicts

-- Step 1: Drop existing policies if they exist (ignore errors)
DO $$ 
BEGIN
    -- Drop user_subreddits policies
    DROP POLICY IF EXISTS "Users can view their own subreddits" ON user_subreddits;
    DROP POLICY IF EXISTS "Users can manage their own subreddits" ON user_subreddits;
    
    -- Drop social_accounts policies that might conflict
    DROP POLICY IF EXISTS "Users can view their own social accounts" ON social_accounts;
    DROP POLICY IF EXISTS "Users can manage their own social accounts" ON social_accounts;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some policies did not exist, continuing...';
END $$;

-- Step 2: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS user_subreddits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subreddit_name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    subscriber_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    flairs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, subreddit_name)
);

-- Step 3: Add columns to social_accounts if they don't exist
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

-- Step 4: Drop the unique constraint if it exists
DO $$ 
BEGIN
    ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_user_id_platform_key;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint did not exist, continuing...';
END $$;

-- Step 5: Enable RLS on tables
ALTER TABLE user_subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Step 6: Create fresh policies
-- user_subreddits policies
CREATE POLICY "Users can view their own subreddits" ON user_subreddits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subreddits" ON user_subreddits
    FOR ALL USING (auth.uid() = user_id);

-- social_accounts policies
CREATE POLICY "Users can view their own social accounts" ON social_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own social accounts" ON social_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Step 7: Create helper functions
CREATE OR REPLACE FUNCTION get_user_active_accounts(user_uuid UUID, platform_name TEXT)
RETURNS TABLE (
    id UUID,
    platform TEXT,
    account_name TEXT,
    account_type TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.platform,
        sa.account_name,
        sa.account_type,
        sa.is_active,
        sa.created_at
    FROM social_accounts sa
    WHERE sa.user_id = user_uuid 
    AND sa.platform = platform_name
    AND sa.is_active = true
    ORDER BY sa.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_subreddits(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    subreddit_name TEXT,
    display_name TEXT,
    description TEXT,
    subscriber_count INTEGER,
    is_active BOOLEAN,
    flairs JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.subreddit_name,
        us.display_name,
        us.description,
        us.subscriber_count,
        us.is_active,
        us.flairs,
        us.created_at
    FROM user_subreddits us
    WHERE us.user_id = user_uuid 
    AND us.is_active = true
    ORDER BY us.created_at DESC;
END;
$$;

-- Step 8: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create triggers
DROP TRIGGER IF EXISTS update_user_subreddits_updated_at ON user_subreddits;
CREATE TRIGGER update_user_subreddits_updated_at
    BEFORE UPDATE ON user_subreddits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Insert sample data for testing (optional)
-- This will only insert if no data exists for the current user
DO $$ 
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT auth.uid() INTO current_user_id;
    
    -- Only insert if user is logged in and no subreddits exist
    IF current_user_id IS NOT NULL THEN
        INSERT INTO user_subreddits (user_id, subreddit_name, display_name, description, flairs)
        SELECT 
            current_user_id,
            'webdev',
            'r/webdev',
            'Web Development Community',
            '["Discussion", "Question", "Tutorial", "Showcase"]'::jsonb
        WHERE NOT EXISTS (
            SELECT 1 FROM user_subreddits 
            WHERE user_id = current_user_id AND subreddit_name = 'webdev'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Sample data insertion skipped or failed';
END $$;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '🚀 You can now use the enhanced social media features';
    RAISE NOTICE '📝 Tables created: user_subreddits';
    RAISE NOTICE '🔧 Columns added: account_name, account_type, is_active';
    RAISE NOTICE '🛡️ RLS policies configured';
    RAISE NOTICE '⚡ Helper functions created';
END $$;
