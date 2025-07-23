# Reddit Subreddit Management - Production Setup

## 🚀 Quick Setup (2 minutes)

### Step 1: Run Database Migration
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/sql)
2. Copy and paste the contents of `production-reddit-setup.sql`
3. Click "Run" to execute the migration
4. You should see success messages: ✅ columns exist, ✅ RLS enabled, etc.

### Step 2: Test the Functionality
1. Go to your app at `localhost:8080`
2. Sign in to your account
3. Go to **Settings → Social Media Connections**
4. Find Reddit section, click **"Subreddits"** button
5. Add your preferred subreddits, set default
6. Go to **Create Post** page
7. Select **Reddit** as platform
8. See the subreddit dropdown with your saved subreddits

## ✅ What This Implements

### Database Structure
- **`reddit_subreddits`** (JSONB): Array of user's preferred subreddits
- **`default_reddit_subreddit`** (TEXT): User's default subreddit choice
- **RLS Policies**: Secure access control for user data
- **Indexes**: Optimized for performance

### Frontend Features
- **Settings Page**: Full subreddit management interface
- **Create Post Page**: Subreddit selection dropdown
- **Default Values**: Bot-friendly subreddits for testing
- **Custom Input**: Option to enter any subreddit name

### Backend Integration
- **Reddit Posting**: Uses selected subreddit for posts
- **Fallback Logic**: Defaults to 'testingground4bots'
- **Error Handling**: Proper validation and logging

## 🎯 User Experience

### In Settings:
1. User clicks "Subreddits" button in Reddit section
2. Modal opens with current subreddit list
3. User can add/remove subreddits
4. User can set default subreddit
5. Changes save to database immediately

### In Create Post:
1. User selects Reddit as platform
2. Reddit Post Details section appears
3. Title input (required for Reddit)
4. Subreddit dropdown with user's saved subreddits
5. Option to enter custom subreddit
6. Link to manage subreddits in settings

## 🔧 Technical Details

### Database Schema
```sql
ALTER TABLE user_preferences 
ADD COLUMN reddit_subreddits JSONB DEFAULT '["testingground4bots"]'::jsonb,
ADD COLUMN default_reddit_subreddit TEXT DEFAULT 'testingground4bots';
```

### RLS Policies
```sql
CREATE POLICY "Enable read access for users based on user_id" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users based on user_id" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Frontend Components
- **`SubredditManagementModal.tsx`**: Subreddit management interface
- **`CreatePost.tsx`**: Subreddit selection in posting flow
- **`SocialMediaConfig.tsx`**: Integration in settings page

### Backend Functions
- **`post-to-social/index.ts`**: Updated Reddit posting with subreddit support

## 🛡️ Security & Performance

### Security
- **RLS Policies**: Users can only access their own preferences
- **Input Validation**: Subreddit names are sanitized
- **Authentication**: All operations require valid user session

### Performance
- **Indexes**: Optimized queries on user_id and reddit_subreddits
- **JSONB**: Efficient storage and querying of subreddit arrays
- **Caching**: Frontend caches user preferences

## 🧪 Default Subreddits

### Bot-Friendly Testing Subreddits
- **`testingground4bots`**: Primary default (bot-friendly)
- **`test`**: General testing subreddit
- **`SandBoxTest`**: Sandbox for testing

### User Management
- Users can add any subreddit they have access to
- Users can set their preferred default
- Custom subreddit input for one-off posts

## 🚨 Troubleshooting

### If subreddit dropdown doesn't appear:
1. Make sure you selected Reddit as the platform
2. Check browser console for errors
3. Verify you're signed in

### If saving fails:
1. Run the database migration again
2. Check Supabase logs for RLS policy errors
3. Verify user authentication

### If posts fail:
1. Check if you have permission to post in the subreddit
2. Verify Reddit account is connected
3. Check Supabase function logs

## 📝 Files Modified

### Database
- `supabase/migrations/20250723000000_add_reddit_columns.sql`
- `production-reddit-setup.sql`

### Frontend
- `src/components/modals/SubredditManagementModal.tsx`
- `src/components/CreatePost.tsx`
- `src/components/settings/SocialMediaConfig.tsx`

### Backend
- `supabase/functions/post-to-social/index.ts`

## ✅ Production Ready

This implementation is production-ready with:
- ✅ Proper database migrations
- ✅ Secure RLS policies
- ✅ Error handling and validation
- ✅ Performance optimizations
- ✅ User-friendly interface
- ✅ No breaking changes to existing functionality

The subreddit management system is now fully integrated and ready for production use.
