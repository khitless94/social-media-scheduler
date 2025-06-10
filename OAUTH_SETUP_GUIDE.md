# OAuth Setup Guide - Fix Authentication Failed Error

## ✅ Environment Variables Added!
Great! You've added the environment variables to Supabase. If you're still getting "Authentication Failed" errors, let's troubleshoot further.

## 🔧 Additional Troubleshooting Steps

### Step 1: ✅ Environment Variables (COMPLETED)
You've already added the environment variables to Supabase Dashboard. Great job!

### Step 2: Verify API Secrets Are Correct
Double-check that the secrets you added match exactly what's in your developer portals:

#### Twitter/X API Keys
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Find your app with Client ID: `ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ`
3. Verify the **Client Secret** matches what you added to Supabase
4. ⚠️ **CRITICAL**: Ensure redirect URI is set to: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`

#### Reddit API Keys
1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Find your app with Client ID: `kBrkkv-sRC-3jE9RIUt6-g`
3. Verify the **Client Secret** matches what you added to Supabase
4. ⚠️ **CRITICAL**: Ensure redirect URI is set to: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`

#### LinkedIn API Keys
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Find your app with Client ID: `78yhh9neso7awt`
3. Verify the **Client Secret** matches what you added to Supabase
4. ⚠️ **CRITICAL**: Ensure redirect URI is set to: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`

#### Facebook/Instagram API Keys
1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Find your app with App ID: `2249146282214303`
3. Verify the **App Secret** matches what you added to Supabase
4. ⚠️ **CRITICAL**: Ensure redirect URI is set to: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`

### Step 3: Redeploy Edge Functions (if needed)

If you make changes to the functions, redeploy them:

```bash
cd scribe-schedule-launch-48-main
supabase functions deploy auth-redirect
supabase functions deploy oauth-callback
```

### Step 4: Test the Authentication

1. Go to your app: http://localhost:8082/debug-auth
2. Click "Check Environment Variables" to verify setup
3. Use the "Test [Platform]" buttons to test each connection
4. If still failing, go to Settings and try connecting each social media account
5. Check browser console for detailed error messages

### Step 5: Common Issues & Solutions

#### Issue: "Invalid Client" Error
- **Cause**: Wrong client secret or client ID
- **Solution**: Double-check the secrets in your developer portals match exactly what's in Supabase

#### Issue: "Invalid Redirect URI" Error
- **Cause**: Redirect URI mismatch
- **Solution**: Ensure ALL platforms have this exact redirect URI: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`

#### Issue: "Access Denied" Error
- **Cause**: Missing permissions or user denied access
- **Solution**: Check app permissions in developer portals, ensure required scopes are enabled

#### Issue: "Authorization Code Expired" Error
- **Cause**: OAuth flow took too long or was interrupted
- **Solution**: Try connecting again immediately after clicking the connect button

## 🔍 Troubleshooting

### If you still get errors:

1. **Check Supabase Logs**: Go to Supabase Dashboard → Logs → Edge Functions
2. **Verify Redirect URIs**: Make sure all platforms have the correct redirect URI
3. **Check API Key Permissions**: Ensure your API keys have the required scopes
4. **Test Individual Platforms**: Try connecting one platform at a time

### Common Issues:

- **Invalid Redirect URI**: The redirect URI in your app settings must exactly match
- **Expired API Keys**: Some platforms require periodic key renewal
- **Scope Issues**: Make sure your apps have the required permissions
- **Rate Limiting**: Some platforms have rate limits for OAuth requests

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Look at the Supabase Edge Function logs
3. Verify each platform's developer console for any warnings
