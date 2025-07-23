# Deploy Reddit Flair Support

## 🚀 **Deploy Updated Edge Function**

Run this command to deploy the updated edge function with flair support:

```bash
supabase functions deploy post-to-social
```

## 🔧 **What Was Added**

### **1. Backend Changes (Edge Function)**
- ✅ Added `flair` parameter extraction from request body
- ✅ Updated `postToReddit` function signature to accept flair
- ✅ Added `flair_id` to Reddit post data
- ✅ Added flair logging for debugging
- ✅ Support for both text and image posts with flair

### **2. Frontend Changes (Already Done)**
- ✅ Added flair selection dropdown in Reddit section
- ✅ Added flair parameter to `PostToSocialParams` interface
- ✅ Updated `useSocialMedia` hook to send flair parameter
- ✅ Added common flairs for test subreddits

## 🧪 **Test After Deployment**

1. **Deploy the function** (command above)
2. **Refresh your browser**
3. **Select "Reddit"** platform
4. **Choose a subreddit** (e.g., "test")
5. **Select a flair** (e.g., "Discussion")
6. **Enter title and content**
7. **Click "Post Now"**

**Expected Result:**
- ✅ **No more "must contain post flair" errors**
- ✅ **Post appears with the selected flair**
- ✅ **Console shows flair being sent to Reddit API**

## 🔍 **Debug Information**

The edge function now logs:
- `[Request] Extracted flair: [flair-value]`
- `[Reddit] Flair parameter received: [flair-value]`
- `[Reddit] Adding flair to post: [flair-value]`

Check the Supabase Functions logs to see these messages.

## 📋 **Reddit API Flair Format**

The function now sends `flair_id` to Reddit API:
```javascript
{
  kind: 'self',
  title: 'Post Title',
  text: 'Post Content',
  sr: 'subreddit',
  flair_id: 'discussion',  // ← NEW: Flair support
  api_type: 'json'
}
```

**Deploy the function and test Reddit posting with flairs!** 🎉
