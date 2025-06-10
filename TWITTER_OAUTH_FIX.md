# 🐦 Twitter OAuth "unauthorized_client" Fix Guide

## 🚨 Current Issue
You're getting: `"error":"unauthorized_client","error_description":"Missing valid authorization header"`

This means Twitter is rejecting your authentication request due to incorrect credentials or configuration.

## ✅ Step-by-Step Fix

### Step 1: Verify Twitter App Configuration

1. **Go to Twitter Developer Portal**: https://developer.twitter.com/en/portal/dashboard
2. **Find your app** with Client ID: `ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ`
3. **Check App Settings**:
   - App Type: Should be "Web App, Automated App or Bot"
   - OAuth 2.0: Should be ENABLED
   - Type of App: Should be "Confidential client" (not Public client)

### Step 2: Verify Redirect URI

In your Twitter app settings, ensure the **Callback URI** is EXACTLY:
```
https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback
```

⚠️ **CRITICAL**: No trailing slash, exact match required!

### Step 3: Get Correct Client Secret

1. In Twitter Developer Portal → Your App → "Keys and Tokens" tab
2. Under "OAuth 2.0 Client ID and Client Secret"
3. **Copy the Client Secret** (NOT the API Key Secret)
4. It should look like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (50 characters)

### Step 4: Update Supabase Environment Variables

1. Go to: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/settings/functions
2. Click "Environment Variables"
3. Update or add:
   ```
   TWITTER_CLIENT_SECRET = [your_actual_50_character_secret]
   ```

### Step 5: Deploy Updated Functions

Run this command to deploy the fixed functions:
```bash
# Start Docker Desktop first, then:
supabase functions deploy --project-ref eqiuukwwpdiyncahrdny
```

Or use the PowerShell script:
```powershell
.\deploy-functions.ps1
```

## 🔍 Common Twitter OAuth Issues

### Issue: "Invalid Client"
- **Cause**: Client ID doesn't match Client Secret
- **Fix**: Regenerate both Client ID and Secret in Twitter Developer Portal

### Issue: "Invalid Redirect URI"
- **Cause**: Callback URL mismatch
- **Fix**: Ensure exact match: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`

### Issue: "App Not Approved"
- **Cause**: Twitter app needs approval for certain permissions
- **Fix**: Apply for Elevated access in Twitter Developer Portal

## 🧪 Test the Fix

1. Deploy the updated functions
2. Try connecting Twitter again
3. Check browser console for detailed error messages
4. Check Supabase Functions logs for backend errors

## 📞 If Still Not Working

If you're still getting errors, please share:
1. The exact error message from the browser
2. Your Twitter app type (Web App, Native App, etc.)
3. Screenshot of your Twitter app's OAuth 2.0 settings
4. Confirmation that you've set the correct TWITTER_CLIENT_SECRET in Supabase

The updated code now:
- ✅ Uses Basic Authentication for Twitter (required)
- ✅ Properly handles PKCE flow
- ✅ Has better error messages
- ✅ Validates client secrets exist
