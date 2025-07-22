# Reddit Posting Debug Guide

## Current Error Analysis
The error "HTTP 500 ('success':false,'error':'reddit API error: forbidden')" indicates a permissions issue with the Reddit API.

## Potential Causes & Solutions

### 1. **Subreddit Permissions**
**Issue**: The 'test' subreddit might not exist or might not allow posts from your app.
**Solution**: ✅ Updated to use 'testingground4bots' - a subreddit specifically for testing bots.

### 2. **OAuth Scopes**
**Current scopes**: `identity submit read`
**Required for posting**: `submit` ✅ (already included)
**Status**: Scopes appear correct.

### 3. **Reddit App Configuration**
**Check these settings in your Reddit app**:
- App type should be "web app" or "script"
- Redirect URI must match exactly: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
- App should be approved and not in development mode

### 4. **Access Token Issues**
**Possible problems**:
- Token expired (Reddit tokens expire after 1 hour)
- Token not properly refreshed
- User revoked permissions

### 5. **User-Agent Header**
**Issue**: Reddit requires a specific User-Agent format
**Solution**: ✅ Updated to `SocialMediaScheduler/1.0 by YourUsername`

## Debugging Steps

### Step 1: Check Reddit App Status
1. Go to https://www.reddit.com/prefs/apps
2. Find your app (Client ID: kBrkkv-sRC-3jE9RIUt6-g)
3. Verify it's approved and active
4. Check redirect URI matches exactly

### Step 2: Test OAuth Flow
1. Disconnect Reddit in your app
2. Reconnect Reddit
3. Check browser console for any OAuth errors
4. Verify you get redirected back successfully

### Step 3: Check Token Validity
The updated code now includes detailed logging. Check the Supabase logs for:
- Token format and length
- Exact error response from Reddit
- Request headers and body

### Step 4: Test with Different Subreddit
If 'testingground4bots' doesn't work, try:
- Your own user profile: `u/yourusername`
- A subreddit you moderate
- r/test (if it exists and allows posts)

## Code Changes Made

### 1. Added Title Support
- ✅ Extract title from request body
- ✅ Pass title to postToReddit function
- ✅ Use title in Reddit post data

### 2. Improved Error Handling
- ✅ Added detailed logging
- ✅ Log request/response details
- ✅ Better error messages

### 3. Updated Subreddit
- ✅ Changed from 'test' to 'testingground4bots'

## Next Steps

1. **Deploy the updated function**:
   ```bash
   supabase functions deploy post-to-social
   ```

2. **Test the posting again** and check logs in Supabase dashboard

3. **If still failing**, check the specific error details in the logs

4. **Consider testing with a different Reddit account** that has posting permissions

## Alternative Solutions

If the issue persists:

1. **Create your own test subreddit**
2. **Use user profile posting** (u/username)
3. **Check Reddit API status** at https://www.redditstatus.com/
4. **Verify Reddit app permissions** in Reddit developer console
