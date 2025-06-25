# Image Functionality Test Plan

## Test Scenarios

### 1. Image Upload Testing
- [ ] Upload JPG image (< 5MB)
- [ ] Upload PNG image (< 5MB)
- [ ] Upload GIF image (< 5MB)
- [ ] Try to upload file > 5MB (should fail with error)
- [ ] Try to upload non-image file (should fail with error)
- [ ] Verify image appears in preview
- [ ] Verify image URL is generated correctly

### 2. AI Image Generation Testing
- [ ] Enter a prompt and generate AI image
- [ ] Verify DALL-E 3 integration works
- [ ] Check generated image appears in preview
- [ ] Test with different prompt styles
- [ ] Verify error handling for failed generation

### 3. Platform Preview Testing
- [ ] Upload image and verify it appears in Twitter preview
- [ ] Upload image and verify it appears in LinkedIn preview
- [ ] Upload image and verify it appears in Facebook preview
- [ ] Upload image and verify it appears in Instagram preview
- [ ] Upload image and verify it appears in Reddit preview
- [ ] Switch between platforms and verify image persists

### 4. Image Source Switching
- [ ] Switch from "None" to "Upload" - verify UI changes
- [ ] Switch from "None" to "Generate" - verify UI changes
- [ ] Switch from "Upload" to "Generate" - verify previous image is cleared
- [ ] Switch from "Generate" to "Upload" - verify previous image is cleared
- [ ] Switch back to "None" - verify all images are cleared

### 5. Posting with Images
- [ ] Post to Twitter with image - verify image is included
- [ ] Post to LinkedIn with image - verify image is included
- [ ] Post to Facebook with image - verify image is included
- [ ] Post to Instagram with image - verify image is included (required)
- [ ] Post to Reddit with image - verify it becomes a link post
- [ ] Try to post to Instagram without image - should show error

### 6. Error Handling
- [ ] Test with invalid image URL
- [ ] Test with network failure during upload
- [ ] Test with Supabase storage bucket not existing
- [ ] Test with invalid API credentials
- [ ] Verify all error messages are user-friendly

### 7. Multi-Platform Posting
- [ ] Select multiple platforms and post with image
- [ ] Verify image is included in all platform posts
- [ ] Check that Instagram requires image while others don't
- [ ] Verify error handling when some platforms fail

### 8. Image Management
- [ ] Upload image, then replace with another image
- [ ] Generate image, then replace with uploaded image
- [ ] Clear image and verify it's removed from previews
- [ ] Verify image state is reset when form is cleared

## Expected Behaviors

### Image Upload
- Files should be validated for type and size
- Upload progress should be shown
- Success message should appear when upload completes
- Image should appear in all platform previews

### AI Generation
- Should work with any text prompt
- Should show loading state during generation
- Generated image should appear in previews
- Should handle API failures gracefully

### Platform Posting
- **Twitter**: Image attached as media
- **LinkedIn**: Image uploaded via Assets API
- **Facebook**: Image uploaded as photo attachment
- **Instagram**: Image required, posted via media container
- **Reddit**: Image posted as link submission

### Error States
- Clear error messages for all failure scenarios
- Graceful degradation when image upload fails
- Form should remain functional even if image features fail

## Manual Testing Steps

1. **Start the application**: `npm run dev`
2. **Navigate to Create Post page**
3. **Test image upload**:
   - Click "Upload" tab
   - Select an image file
   - Verify upload progress and success message
   - Check image appears in platform previews
4. **Test AI generation**:
   - Click "Generate" tab
   - Enter a prompt
   - Click "Generate AI Image"
   - Verify image generation and preview
5. **Test posting**:
   - Generate some content
   - Select a platform
   - Post with image
   - Verify image is included in the actual post

## Automated Testing (Future)

```typescript
// Example test cases
describe('Image Functionality', () => {
  test('should upload image successfully', async () => {
    // Test image upload
  });
  
  test('should generate AI image', async () => {
    // Test AI generation
  });
  
  test('should include image in platform posts', async () => {
    // Test posting with images
  });
  
  test('should handle upload errors gracefully', async () => {
    // Test error handling
  });
});
```

## Performance Considerations

- Images should be optimized for web delivery
- Upload progress should be shown for large files
- Generated images should be cached appropriately
- Platform API calls should have proper timeout handling

## Security Checklist

- [ ] File type validation on both client and server
- [ ] File size limits enforced
- [ ] User authentication required for uploads
- [ ] Secure storage with proper access controls
- [ ] API credentials properly protected
- [ ] No sensitive data in image metadata
