-- Create posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on posts and post_history tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts table
-- Users can only see, insert, update, and delete their own posts
CREATE POLICY "Users can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for post_history table
-- Users can only see, insert, update, and delete their own post history
CREATE POLICY "Users can view their own post history" ON post_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post history" ON post_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own post history" ON post_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post history" ON post_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create oauth_credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Create oauth_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  session_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Also enable RLS on oauth_credentials and oauth_sessions for security
ALTER TABLE oauth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for oauth_credentials table
CREATE POLICY "Users can view their own oauth credentials" ON oauth_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth credentials" ON oauth_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth credentials" ON oauth_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth credentials" ON oauth_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for oauth_sessions table
CREATE POLICY "Users can view their own oauth sessions" ON oauth_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oauth sessions" ON oauth_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oauth sessions" ON oauth_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth sessions" ON oauth_sessions
  FOR DELETE USING (auth.uid() = user_id);