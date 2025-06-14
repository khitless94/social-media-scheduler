# Image Posting Fix - Test Plan

## Changes Made

### 1. Backend Changes (supabase/functions/post-to-social/index.ts)
- ✅ Added `image` parameter to request body extraction
- ✅ Updated `postToSocialMedia` function to accept image parameter
- ✅ Updated all platform-specific functions to handle images:
  - **Twitter**: Upload image to Twitter media API, attach to tweet
  - **LinkedIn**: Add image to ShareContent media array
  - **Reddit**: Switch between text post and link post based on image presence
  - **Facebook**: Add image as link attachment
  - **Instagram**: Require image for posting (Instagram needs media)

### 2. Frontend Changes
- ✅ Updated `PostToSocialParams` interface to include optional `image` field
- ✅ Updated `postToSocial` function to accept and pass image parameter
- ✅ Updated `postToMultiplePlatforms` function to accept and pass image parameter
- ✅ Updated `CreatePostModal` to pass generated image when posting
- ✅ Updated `postToPlatform` client function to handle image parameter

## Testing Steps

### 1. Generate Content with Image
1. Open the Create Post modal
2. Enter a prompt (e.g., "Tips for productivity in remote work")
3. Select target platforms (Twitter, LinkedIn, Facebook)
4. Check "Generate Image" option
5. Click "Generate AI Image" button
6. Verify image is generated and displayed

### 2. Post with Image
1. After generating content and image, proceed to Step 3 (Review & Publish)
2. Select platforms to post to
3. Click "Publish to Selected Platforms"
4. Verify posts are created with images attached

### 3. Platform-Specific Verification
- **Twitter**: Check if tweet includes the image
- **LinkedIn**: Check if LinkedIn post shows the image
- **Facebook**: Check if Facebook post includes the image
- **Reddit**: Check if Reddit post is created as a link post with image
- **Instagram**: Should show appropriate message about requiring image

## Expected Behavior

### Before Fix
- ❌ Posts were created with text only
- ❌ Generated images were not included in social media posts
- ❌ Instagram posts failed due to missing media

### After Fix
- ✅ Posts should include both text and generated images
- ✅ Each platform handles images according to their API requirements
- ✅ Instagram provides clear feedback about image requirement
- ✅ Users can see image preview before posting

## Technical Implementation Details

### Twitter Image Upload
- Downloads image from URL
- Converts to base64
- Uploads to Twitter media API
- Attaches media_id to tweet

### LinkedIn Image Handling
- Adds image URL to ShareContent media array
- Sets shareMediaCategory to "IMAGE"
- Includes image metadata

### Facebook Image Handling
- Adds image as link attachment
- Facebook automatically generates preview

### Reddit Image Handling
- Switches post type from "self" to "link"
- Uses image URL as the link target

### Instagram Handling
- Requires proper Instagram Business API setup
- Currently provides informative error message
- Users can manually post generated image

## Deployment Notes
- Edge function needs to be redeployed with image handling changes
- Frontend changes are ready for testing
- All image processing happens server-side for security
