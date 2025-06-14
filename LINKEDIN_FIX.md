# 🔗 LinkedIn OAuth Fix Guide

## 🚨 Current Issue
You're seeing LinkedIn API errors:
- `Failed to fetch LinkedIn` with 403 status code
- `serviceError` responses from LinkedIn API
- Profile fetch failures

## 🔍 Root Cause Analysis
The LinkedIn app with Client ID `86z7443djn3cgx` may have one of these issues:
1. **Products not enabled** - LinkedIn requires specific products for different scopes
2. **Incorrect API endpoints** - Using wrong endpoints for the available scopes
3. **Scope authorization issues** - App doesn't have permission for requested scopes

## 🛠️ Step-by-Step Fix

### Step 1: Verify LinkedIn App Configuration

1. **Go to LinkedIn Developer Console:**
   ```
   https://www.linkedin.com/developers/apps
   ```

2. **Find Your App:**
   - Look for app with Client ID: `86z7443djn3cgx`
   - If you can't find it, you'll need to create a new app

3. **Check Auth Settings:**
   - Click on your app → "Auth" tab
   - Verify "Authorized redirect URLs for your app" contains EXACTLY:
   ```
   https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback
   ```

### Step 2: Add Required LinkedIn Products

1. **In your LinkedIn app, go to "Products" tab**
2. **You MUST add these products for OAuth to work:**
   - ✅ **Share on LinkedIn** (for `w_member_social` scope)
   - ✅ **Sign In with LinkedIn using OpenID Connect** (for `r_liteprofile` and `r_emailaddress`)

3. **How to add products:**
   - Click "Request access" for each product
   - Some may require approval (can take 1-2 business days)
   - "Share on LinkedIn" is usually approved instantly

4. **After adding products, check "Auth" tab for available scopes:**
   - `w_member_social` ✅ (from "Share on LinkedIn")
   - `r_liteprofile` ✅ (from "Sign In with LinkedIn")
   - `r_emailaddress` ✅ (from "Sign In with LinkedIn")

### Step 2.5: Code Changes Made (Already Applied)

✅ **Updated OAuth scopes** in the code:
- Changed from `openid profile email w_member_social`
- To `r_liteprofile r_emailaddress w_member_social`

✅ **Updated API endpoint** in backend:
- Changed from `/v2/userinfo` (OpenID Connect)
- To `/v2/people/~` (LinkedIn v2 API)

✅ **Updated profile ID extraction**:
- Changed from `profile.sub` to `profile.id`

### Step 3: Test with Debug Tool

1. **Open the test file:**
   ```
   open scribe-schedule-launch-48-main/linkedin-oauth-test.html
   ```

2. **Click "Test LinkedIn OAuth"**
3. **Check what error you get**

### Step 4: Create New LinkedIn App (RECOMMENDED)

Since the current app has scope issues, create a fresh one:

1. **Go to:** https://www.linkedin.com/developers/apps
2. **Click "Create app"**
3. **Fill in details:**
   - App name: "Social Media Scheduler"
   - LinkedIn Page: (your company page or create one if needed)
   - App logo: (optional)
   - Legal agreement: ✅

4. **After creation, immediately add products:**
   - Go to "Products" tab
   - Request access to "Share on LinkedIn" (usually instant approval)
   - Request access to "Sign In with LinkedIn using OpenID Connect"

5. **Configure Auth settings:**
   - Go to "Auth" tab
   - Add redirect URI: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
   - Copy the new Client ID and Client Secret

6. **Update your app:**
   - Edit `src/lib/appConfig.ts`
   - Replace the LinkedIn clientId with your new one
   - Add the Client Secret to Supabase environment variables

### Step 5: Update Environment Variables

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/settings/environment-variables
   ```

2. **Add/Update:**
   ```
   LINKEDIN_CLIENT_SECRET=your_new_client_secret
   ```

## 🧪 Testing Steps

1. **Clear browser cache and cookies**
2. **Try connecting LinkedIn again**
3. **Check browser console for detailed errors**
4. **Use the test HTML file to debug**

## 🔧 Alternative Quick Fix

If you want to temporarily disable LinkedIn while fixing:

1. **Edit `src/components/Settings.tsx`**
2. **Comment out the LinkedIn connection button:**
   ```tsx
   {/* Temporarily disabled LinkedIn */}
   {/* <SocialMediaCard platform="linkedin" /> */}
   ```

## 📞 Need Help?

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Look at the Network tab** to see the exact OAuth URL being generated
3. **Verify the LinkedIn app status** in the developer console
4. **Try creating a completely new LinkedIn app** with fresh credentials

## 🎯 Expected Result

After fixing, you should see:
- ✅ LinkedIn OAuth popup opens correctly
- ✅ User can authorize the app
- ✅ Successful redirect back to your app
- ✅ "Connected" status in Settings page
