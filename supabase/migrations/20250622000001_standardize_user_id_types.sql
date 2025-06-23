-- Standardize user_id column types across oauth tables
-- This ensures consistent data types to prevent insertion errors

-- Check and fix oauth_credentials table
DO $$ 
BEGIN
    -- Check if user_id is TEXT and convert to UUID if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'oauth_credentials' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- Drop foreign key constraint if it exists
        ALTER TABLE oauth_credentials DROP CONSTRAINT IF EXISTS oauth_credentials_user_id_fkey;
        
        -- Convert TEXT to UUID
        ALTER TABLE oauth_credentials ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        
        -- Re-add foreign key constraint
        ALTER TABLE oauth_credentials ADD CONSTRAINT oauth_credentials_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and fix social_tokens table
DO $$ 
BEGIN
    -- Check if user_id is TEXT and convert to UUID if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'social_tokens' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- Drop foreign key constraint if it exists
        ALTER TABLE social_tokens DROP CONSTRAINT IF EXISTS social_tokens_user_id_fkey;
        
        -- Convert TEXT to UUID
        ALTER TABLE social_tokens ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        
        -- Re-add foreign key constraint
        ALTER TABLE social_tokens ADD CONSTRAINT social_tokens_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check and fix oauth_sessions table
DO $$ 
BEGIN
    -- Check if user_id is TEXT and convert to UUID if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'oauth_sessions' 
        AND column_name = 'user_id' 
        AND data_type = 'text'
    ) THEN
        -- Drop foreign key constraint if it exists
        ALTER TABLE oauth_sessions DROP CONSTRAINT IF EXISTS oauth_sessions_user_id_fkey;
        
        -- Convert TEXT to UUID
        ALTER TABLE oauth_sessions ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
        
        -- Re-add foreign key constraint
        ALTER TABLE oauth_sessions ADD CONSTRAINT oauth_sessions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure all tables have proper indexes
CREATE INDEX IF NOT EXISTS idx_oauth_credentials_user_platform ON oauth_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_platform ON social_tokens(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_platform ON oauth_sessions(user_id, platform);

-- Ensure proper permissions are still in place
GRANT ALL ON oauth_credentials TO service_role;
GRANT ALL ON social_tokens TO service_role;
GRANT ALL ON oauth_sessions TO service_role;
