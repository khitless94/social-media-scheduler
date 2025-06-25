# Image Upload Fix Guide

## Quick Fix for "Authentication failed. Please log out and log back in" Error

If you're experiencing image upload issues with the error message "Authentication failed. Please log out and log back in", follow these steps:

### 🔧 Automatic Diagnostic Tool

1. **Go to Settings → Diagnostic Tab**
   - Navigate to the Settings page in your dashboard
   - Click on the "Diagnostic" tab
   - Click "Run Diagnostic" to automatically check your setup
   - Follow the instructions provided by the diagnostic tool

### 🛠️ Manual Fix Steps

#### Step 1: Check Authentication
1. **Log out and log back in**
   - Click your profile menu and select "Sign Out"
   - Sign back in with your credentials
   - Try uploading an image again

#### Step 2: Set Up Storage Bucket (If needed)
1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com) and log in
   - Select your project

2. **Create Storage Bucket**
   - Go to Storage → Buckets
   - Click "New bucket"
   - Name it `user-images`
   - Make it public
   - Set file size limit to 5MB
   - Allow image file types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

3. **Run SQL Setup Script**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `setup-storage.sql` file
   - Click "Run" to execute the script

#### Step 3: Verify Policies
The setup script creates these policies:
- Users can upload their own images
- Users can view their own images  
- Users can delete their own images
- Public access for social media posting

### 🔍 Common Issues and Solutions

#### Issue: "Bucket not found"
**Solution:** Create the `user-images` bucket in Supabase Storage

#### Issue: "Storage access denied"
**Solution:** Run the `setup-storage.sql` script to set up proper RLS policies

#### Issue: "File too large"
**Solution:** Use images smaller than 5MB

#### Issue: "Authentication failed"
**Solution:** 
1. Log out and log back in
2. Check if your session has expired
3. Refresh the page and try again

### 📝 Setup Script Location

The `setup-storage.sql` file is located in the root directory of this project. It contains all the necessary SQL commands to set up the storage bucket and security policies.

### 🆘 Still Having Issues?

1. **Use the Diagnostic Tool** in Settings → Diagnostic tab
2. **Check Browser Console** for detailed error messages
3. **Verify Supabase Project Settings** are correct
4. **Ensure you're logged in** to the application

### ✅ Success Indicators

You'll know everything is working when:
- The diagnostic tool shows all green checkmarks
- You can upload images without errors
- Images appear in your posts
- No authentication errors in the console

### 🔄 Enhanced Error Handling

The application now includes:
- **Automatic session refresh** when authentication fails
- **Better error messages** with specific solutions
- **Bucket existence checks** before upload attempts
- **Retry logic** for duplicate file names
- **Comprehensive logging** for debugging

### 📞 Support

If you continue to experience issues after following this guide:
1. Run the diagnostic tool and note the results
2. Check the browser console for error messages
3. Verify your Supabase project configuration
4. Ensure all environment variables are set correctly
