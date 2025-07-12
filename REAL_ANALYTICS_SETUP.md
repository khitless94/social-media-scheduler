# Real-Time Analytics Setup Guide

This guide explains how to set up real social media API integrations for live engagement data.

## 🔧 Environment Variables Setup

Add these environment variables to your Supabase project settings:

### Twitter API v2
```bash
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### LinkedIn API
```bash
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Facebook/Instagram API
```bash
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### Reddit API
```bash
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

## 📋 API Setup Instructions

### 1. Twitter API v2 Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use existing one
3. Enable OAuth 2.0 with PKCE
4. Add required scopes: `tweet.read`, `users.read`, `tweet.metrics.private`
5. Set callback URL: `https://your-domain.com/oauth/callback/twitter`

### 2. LinkedIn API Setup
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Add required products: "Share on LinkedIn", "Marketing Developer Platform"
4. Request access to analytics APIs
5. Set redirect URL: `https://your-domain.com/oauth/callback/linkedin`

### 3. Facebook/Instagram API Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login and Instagram products
4. Request permissions: `pages_read_engagement`, `instagram_basic`, `instagram_manage_insights`
5. Set OAuth redirect URI: `https://your-domain.com/oauth/callback/facebook`

### 4. Reddit API Setup
1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Create a new app (web app type)
3. Set redirect URI: `https://your-domain.com/oauth/callback/reddit`
4. Note the client ID and secret

## 🚀 Deployment Steps

### 1. Deploy Supabase Function
```bash
# Deploy the token refresh function
supabase functions deploy refresh-oauth-token

# Set environment variables in Supabase dashboard
# Go to Project Settings > Edge Functions > Environment Variables
```

### 2. Update OAuth Callback URLs
Make sure all platform OAuth settings point to your deployed URLs:
- Production: `https://your-domain.com/oauth/callback/{platform}`
- Development: `http://localhost:8080/oauth/callback/{platform}`

### 3. Test Real API Integration
1. Connect your social media accounts
2. Publish a test post
3. Click "Sync Real Engagement Data" in dashboard
4. Check Analytics tab for live data

## 📊 Features Enabled

### Real-Time Metrics
- ✅ Live engagement data from all platforms
- ✅ Automatic token refresh
- ✅ Rate limit handling
- ✅ Error recovery and fallbacks

### Platform-Specific Data
- **Twitter**: Likes, retweets, replies, impressions, profile clicks
- **LinkedIn**: Likes, shares, comments, reach, impressions
- **Instagram**: Likes, comments, reach, impressions, saves
- **Facebook**: Likes, shares, comments, reach, impressions, clicks
- **Reddit**: Upvotes, comments, views

### Automatic Sync
- ✅ Syncs every 15 minutes automatically
- ✅ Manual sync button available
- ✅ Batch processing to respect rate limits
- ✅ Background updates without user intervention

## 🔍 Monitoring & Debugging

### Check Sync Status
```javascript
// Check if real-time sync is running
const isRunning = RealTimeEngagementSync.isRunning(userId);

// Manually trigger sync
await testEngagementService.syncRealData(userId);
```

### View Logs
- Check browser console for sync status
- Monitor Supabase Edge Function logs
- Check database for updated engagement_stats

### Common Issues
1. **Token Expired**: Automatic refresh should handle this
2. **Rate Limits**: Built-in delays and batch processing
3. **Missing Permissions**: Check API app permissions
4. **Invalid Post IDs**: Only published posts with platform IDs are synced

## 🎯 Usage

### Dashboard Controls
- **"Sync Real Engagement Data"**: Manual sync of live data
- **"Add Demo Analytics Data"**: Generate test data for development
- **Analytics Tab**: View real-time engagement metrics

### Automatic Features
- Real-time sync starts when dashboard loads
- Syncs every 15 minutes automatically
- Updates analytics immediately when data changes
- Handles errors gracefully with fallbacks

## 🔒 Security Notes

- All API credentials are stored securely in Supabase
- Tokens are automatically refreshed before expiration
- Rate limits are respected to avoid API blocks
- User data is only accessed with proper permissions

## 📈 Analytics Available

### Overview Metrics
- Total reach across all platforms
- Combined engagement rates
- Growth trends and comparisons
- Platform performance breakdown

### Detailed Analytics
- Individual post performance
- Platform-specific metrics
- Time-based trend analysis
- Top performing content

### Real-Time Updates
- Live data refresh every 15 minutes
- Immediate updates when posts change
- Real-time chart updates
- Live engagement tracking

Your social media analytics are now powered by real API data! 🎉
