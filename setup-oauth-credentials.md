# OAuth Setup Guide for Real Social Media Integration

## Current Status
Your app currently has placeholder credentials. To enable real social media posting, you need to:

1. **Create developer apps** for each platform
2. **Update Supabase secrets** with real credentials
3. **Test the OAuth flow**

## Platform Setup Instructions

### 1. Twitter (X) Setup
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or use existing
3. In app settings → Authentication settings:
   - Enable OAuth 2.0
   - Set Callback URI: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
   - Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
4. Get your Client ID and Client Secret

### 2. LinkedIn Setup
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. In Auth tab:
   - Add redirect URL: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
   - Request scopes: `openid`, `profile`, `email`, `w_member_social`
4. Get your Client ID and Client Secret

### 3. Facebook Setup
1. Go to https://developers.facebook.com/apps
2. Create a new app (Business type)
3. Add Facebook Login product
4. In Facebook Login → Settings:
   - Add redirect URI: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
   - Scopes: `pages_manage_posts`, `pages_read_engagement`
5. Get your App ID and App Secret

### 4. Instagram Setup
1. Use the same Facebook app from above
2. Add Instagram Basic Display product
3. Same redirect URI as Facebook
4. Uses same App ID and App Secret

### 5. Reddit Setup
1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (web app type)
3. Set redirect URI: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
4. Get your Client ID and Client Secret

## Update Supabase Secrets

Run these commands with your real credentials:

```bash
# Twitter
supabase secrets set TWITTER_CLIENT_ID="your_twitter_client_id"
supabase secrets set TWITTER_CLIENT_SECRET="your_twitter_client_secret"

# LinkedIn  
supabase secrets set LINKEDIN_CLIENT_ID="your_linkedin_client_id"
supabase secrets set LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"

# Facebook
supabase secrets set FACEBOOK_CLIENT_ID="your_facebook_app_id"
supabase secrets set FACEBOOK_CLIENT_SECRET="your_facebook_app_secret"

# Instagram (same as Facebook)
supabase secrets set INSTAGRAM_CLIENT_ID="your_facebook_app_id"
supabase secrets set INSTAGRAM_CLIENT_SECRET="your_facebook_app_secret"

# Reddit
supabase secrets set REDDIT_CLIENT_ID="your_reddit_client_id"
supabase secrets set REDDIT_CLIENT_SECRET="your_reddit_client_secret"
```

## Testing the OAuth Flow

1. **Start your app**: `npm run dev`
2. **Go to Settings** in your app
3. **Click "Connect"** for any platform
4. **Complete OAuth flow** in popup
5. **Verify connection** shows as connected
6. **Test posting** from Create Post page

## Troubleshooting

### Common Issues:

1. **"Missing authorization header"** - OAuth callback function needs no auth
2. **"Invalid redirect URI"** - Check exact URL in platform settings
3. **"Invalid client credentials"** - Verify Client ID/Secret are correct
4. **"Scope not granted"** - Request proper scopes in platform settings

### Debug Steps:

1. Check Supabase function logs
2. Verify redirect URI matches exactly
3. Test OAuth flow in browser dev tools
4. Check platform developer console for errors

## Current Implementation Status

✅ **OAuth callback function** - Handles all platforms
✅ **Frontend OAuth flow** - Popup-based authentication  
✅ **Token storage** - Secure database storage
✅ **Real API posting** - Twitter, LinkedIn, Facebook, Instagram, Reddit
✅ **Error handling** - Comprehensive error messages
✅ **Token refresh** - Automatic token management

## Next Steps

1. Set up developer apps for platforms you want to use
2. Update Supabase secrets with real credentials
3. Test OAuth connection for each platform
4. Test real posting functionality
5. Monitor for any API rate limits or errors

The implementation is complete and ready for real OAuth credentials!
