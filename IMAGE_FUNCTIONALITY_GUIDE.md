# Image Functionality Implementation Guide

## Overview
This document outlines the comprehensive image functionality that has been implemented across all social media platforms in the Social Media Scheduler application.

## Features Implemented

### 1. Image Upload & Management
- **File Upload**: Users can upload images (JPG, PNG, GIF) up to 5MB
- **AI Image Generation**: Integration with DALL-E 3 for AI-generated images
- **Image URL Input**: Direct image URL input as fallback option
- **Image Preview**: Real-time preview of uploaded/generated/URL images
- **Image Storage**: Secure storage using Supabase Storage (requires setup)

### 2. Platform-Specific Image Support

#### Twitter/X
- ⚠️ Image upload requires OAuth 1.0a (currently disabled)
- ✅ Image preview in tweet mockup
- ✅ Text posting works without images
- ❌ Media upload needs additional OAuth 1.0a implementation

#### LinkedIn
- ✅ Image upload via LinkedIn Assets API
- ✅ Two-step upload process (register + upload)
- ✅ Image preview in LinkedIn post mockup
- ✅ Professional image formatting

#### Facebook
- ✅ Image upload via Facebook Graph API
- ✅ Page-based posting with images
- ✅ Image preview in Facebook post mockup
- ✅ Proper media attachment handling

#### Instagram
- ✅ Image upload via Instagram Basic Display API
- ✅ **Required**: Instagram posts MUST include an image
- ✅ Business account integration
- ✅ Two-step process (create container + publish)
- ✅ Image preview in Instagram post mockup

#### Reddit
- ✅ Image posts as link submissions
- ✅ Automatic conversion from text to link post when image is included
- ✅ Image preview in Reddit post mockup
- ✅ Subreddit-specific posting

### 3. User Interface Components

#### CreatePost Component
- **Image Source Selection**: None, Upload, or Generate
- **Upload Interface**: Drag-and-drop or click to upload
- **AI Generation**: One-click AI image generation based on post prompt
- **Real-time Previews**: All platform previews show uploaded/generated images
- **Image Management**: Clear, replace, or download images

#### CreatePostModal Component
- **Consistent Interface**: Same image functionality as CreatePost
- **Multi-platform Support**: Single image used across all selected platforms
- **Batch Posting**: Image included in all platform posts simultaneously

### 4. Technical Implementation

#### Frontend (React/TypeScript)
```typescript
// Image state management
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [generatedImage, setGeneratedImage] = useState<string | null>(null);
const [imageSource, setImageSource] = useState<'none' | 'upload' | 'generate'>('none');

// Get current active image
const getCurrentImage = (): string | undefined => {
  if (imageSource === 'upload' && uploadedImage) return uploadedImage;
  if (imageSource === 'generate' && generatedImage) return generatedImage;
  return undefined;
};
```

#### Backend (Supabase Edge Functions)
- **Image Processing**: Download, validate, and upload images to platform APIs
- **Error Handling**: Graceful fallback when image upload fails
- **Platform-Specific Logic**: Different upload mechanisms for each platform
- **Security**: Proper authentication and file validation

### 5. API Integrations

#### Twitter Media Upload
```typescript
// Upload to Twitter media endpoint
const formData = new FormData();
formData.append('media', imageBlob);

const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: formData
});
```

#### LinkedIn Assets API
```typescript
// Register upload
const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
  method: 'POST',
  body: JSON.stringify({
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: personUrn
    }
  })
});

// Upload image
const uploadResponse = await fetch(uploadUrl, {
  method: 'POST',
  body: imageBuffer
});
```

#### Facebook Graph API
```typescript
// Upload photo
const formData = new FormData();
formData.append('source', imageBlob);
formData.append('published', 'false');

const photoResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
  method: 'POST',
  body: formData
});
```

#### Instagram Basic Display API
```typescript
// Create media container
const containerData = new URLSearchParams();
containerData.append('image_url', image);
containerData.append('caption', content);

const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
  method: 'POST',
  body: containerData
});

// Publish media
const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`, {
  method: 'POST',
  body: publishData
});
```

### 6. Error Handling & Validation

#### File Validation
- **File Type**: Only image files (image/*) accepted
- **File Size**: Maximum 5MB limit
- **Format Support**: JPG, PNG, GIF, WebP

#### Platform-Specific Requirements
- **Instagram**: Images are mandatory
- **Twitter**: Images are optional but enhance engagement
- **LinkedIn**: Professional image formatting recommended
- **Facebook**: Images increase post visibility
- **Reddit**: Images posted as link submissions

### 7. User Experience Features

#### Visual Feedback
- **Upload Progress**: Loading indicators during upload
- **Success Messages**: Confirmation when images are ready
- **Error Messages**: Clear error descriptions
- **Preview Updates**: Real-time preview updates

#### Image Management
- **Source Switching**: Easy switching between upload/generate/none
- **Image Replacement**: Replace images without losing other content
- **External Links**: Open images in new tabs for full view
- **Automatic Cleanup**: Clear images when resetting forms

### 8. Security & Performance

#### Security Measures
- **Authentication**: User authentication required for uploads
- **File Validation**: Server-side file type and size validation
- **Secure Storage**: Supabase Storage with proper access controls
- **API Security**: Proper OAuth tokens for all platform APIs

#### Performance Optimizations
- **Image Compression**: Automatic optimization for web delivery
- **Lazy Loading**: Images loaded only when needed
- **Caching**: Efficient caching of uploaded images
- **Error Recovery**: Graceful handling of upload failures

## Usage Instructions

### For Users
1. **Upload Image**: Click "Upload" tab and select/drag image file
2. **Generate Image**: Click "Generate" tab and use AI to create image
3. **Preview**: See how your image will appear on each platform
4. **Post**: Image will be included automatically when posting

### For Developers
1. **Image State**: Use `getCurrentImage()` to get active image URL
2. **Platform APIs**: Each platform has specific image upload requirements
3. **Error Handling**: Always provide fallback for failed image uploads
4. **Testing**: Test with various image formats and sizes

## Troubleshooting

### Common Issues

#### "Error uploading image - headers must have required property 'authorization'"
**Solution**:
1. Run the `setup-storage.sql` script in your Supabase SQL Editor
2. Ensure you're logged in to the application
3. Check that the `user-images` bucket exists in Supabase Storage

#### "Storage bucket 'user-images' not found"
**Solution**:
1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `user-images`
3. Set it to public or configure RLS policies
4. Run the `setup-storage.sql` script for proper policies

#### "Twitter posts without images"
**Current Status**: Twitter media upload requires OAuth 1.0a authentication which is not yet implemented. Text-only posts work fine.

#### "Authentication failed. Please log out and log back in"
**Solution**:
1. Log out of the application
2. Clear browser cache/cookies
3. Log back in
4. Try uploading again

### Workarounds

#### For Image Upload Issues
Use the "URL" option instead of "Upload":
1. Upload your image to any image hosting service (Imgur, etc.)
2. Copy the direct image URL
3. Use the "URL" tab in the image section
4. Paste the URL

#### For Twitter Images
Currently, use other platforms for image posting or wait for OAuth 1.0a implementation.

## Future Enhancements
- Multiple image support for platforms that allow it
- Image editing capabilities (crop, resize, filters)
- Image templates and branding overlays
- Bulk image upload and management
- Advanced AI image generation with style controls
- Complete Twitter OAuth 1.0a implementation for media uploads
