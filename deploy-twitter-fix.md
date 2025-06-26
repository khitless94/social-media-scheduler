# 🚀 Deploy Twitter Image Upload Fix

## 📋 **Manual Deployment Instructions**

Since Docker Desktop is not available, follow these steps to manually deploy the fix:

### Option 1: Copy Function Code to Supabase Dashboard

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/functions
   - Click on the `post-to-social` function

2. **Replace Function Code:**
   - Copy the entire contents of `supabase/functions/post-to-social/index.ts`
   - Paste it into the Supabase function editor
   - Click "Deploy" to update the function

### Option 2: Use Supabase CLI with Docker

1. **Start Docker Desktop** (if available)
2. **Run deployment command:**
   ```bash
   supabase functions deploy post-to-social
   ```

## 🔍 **Key Changes to Verify**

When copying the code, ensure these critical changes are included:

### 1. **Updated uploadImageToTwitter Function Signature**
```typescript
async function uploadImageToTwitter(base64Image: string, userCredentials: any): Promise<string | null>
```

### 2. **User Credentials Usage**
```typescript
const credentials = {
  consumer_key: Deno.env.get('TWITTER_API_KEY')!,
  consumer_secret: Deno.env.get('TWITTER_API_SECRET')!,
  token: userCredentials.access_token,
  token_secret: userCredentials.access_token_secret,
};
```

### 3. **OAuth Credential Detection**
```typescript
if (!credentials?.access_token_secret) {
  console.warn('[Twitter] ⚠️ OAuth 1.0a credentials required for image upload');
  console.warn('[Twitter] Current token type appears to be OAuth 2.0 Bearer token');
  console.warn('[Twitter] Skipping image upload and posting text-only tweet');
  mediaId = null;
} else {
  // Proceed with image upload
}
```

### 4. **Enhanced Success Message**
```typescript
let message = mediaId ? "Tweet with image posted successfully" : "Text-only tweet posted successfully";

if (image && !mediaId && !credentials?.access_token_secret) {
  message += " (Note: Image upload requires OAuth 1.0a credentials. Please reconnect Twitter account for image support.)";
}
```

## ✅ **Verification Steps**

After deployment:

1. **Test Text-Only Tweet:**
   - Should work without issues
   - Check for success message

2. **Test Tweet with Image:**
   - Text should post successfully
   - Should see helpful message about image limitations
   - No errors in logs

3. **Check Function Logs:**
   - Look for OAuth credential detection messages
   - Verify graceful fallback behavior

## 🎯 **Expected Results**

### Before Fix:
```
❌ Image upload error: Error: Failed to upload image to Twitter as postToTwitter
❌ Tweet posting fails completely
```

### After Fix:
```
✅ [Twitter] ⚠️ OAuth 1.0a credentials required for image upload
✅ [Twitter] Skipping image upload and posting text-only tweet
✅ Text-only tweet posted successfully (Note: Image upload requires OAuth 1.0a credentials...)
```

## 📝 **Deployment Checklist**

- [ ] Function code updated in Supabase dashboard
- [ ] Function deployed successfully
- [ ] Test text-only posting
- [ ] Test posting with image
- [ ] Verify logs show proper credential detection
- [ ] Confirm user receives helpful error messages
- [ ] No more "Failed to upload image" errors

## 🔄 **Rollback Plan**

If issues occur, the previous version can be restored by:
1. Reverting the function code in Supabase dashboard
2. Or using git to checkout previous version and redeploy

The fix is designed to be backward compatible and should not break existing functionality.
