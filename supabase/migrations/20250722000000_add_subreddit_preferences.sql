-- Add subreddit preferences to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS reddit_subreddits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS default_reddit_subreddit TEXT DEFAULT 'testingground4bots';

-- Update existing rows to have default values
UPDATE user_preferences 
SET 
  reddit_subreddits = '[]'::jsonb,
  default_reddit_subreddit = 'testingground4bots'
WHERE 
  reddit_subreddits IS NULL 
  OR default_reddit_subreddit IS NULL;
