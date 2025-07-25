# 🔧 Media Library Fix Guide

## Problem Identified
The Media Library is showing 401 (Unauthorized) and 400 (Bad Request) errors because:
- Database tables `media_library` and `media_folders` don't exist
- Storage bucket `media-library` is not configured
- Row Level Security (RLS) policies are missing

## 🚀 Quick Fix Steps

### Step 1: Set Up Database Schema
1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny
2. **Navigate to SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Run the Schema**: Copy and paste the entire contents of `setup-media-library-schema.sql` and click "Run"

### Step 2: Verify Setup
After running the SQL, you should see:
- ✅ Tables created: `media_library`, `media_folders`, `media_usage_logs`
- ✅ Storage bucket created: `media-library`
- ✅ RLS policies enabled
- ✅ Indexes and functions created

### Step 3: Test the Media Library
1. **Refresh your application**: Go to http://localhost:8080/media
2. **Try uploading a file**: Click "Upload Media" and select an image
3. **Try creating a folder**: Click "New Folder" and create a test folder

## 🔍 What the Schema Creates

### Database Tables
- **`media_library`**: Stores media files with metadata
- **`media_folders`**: Organizes media into folders
- **`media_usage_logs`**: Tracks when media is used in posts

### Storage Configuration
- **`media-library` bucket**: Stores actual media files
- **User-based folder structure**: Files organized by user ID
- **Public access**: Media URLs are publicly accessible

### Security Features
- **Row Level Security (RLS)**: Users can only access their own media
- **Storage policies**: Users can only upload/access their own files
- **Authentication required**: All operations require valid user session

## 🧪 Testing Commands

If you want to test the setup manually, you can run:

```bash
node setup-media-library.js
```

This will check:
- Database connection
- Table existence
- Storage bucket configuration
- RLS policy functionality

## 🚨 Common Issues & Solutions

### Issue: "Auth session missing"
**Solution**: Make sure you're signed in to the application before testing

### Issue: "Table does not exist"
**Solution**: Run the SQL schema in Supabase Dashboard SQL Editor

### Issue: "Storage bucket not found"
**Solution**: The SQL schema creates the bucket automatically

### Issue: "Permission denied"
**Solution**: RLS policies are working correctly - make sure you're authenticated

## 📋 Manual SQL Commands (if needed)

If you prefer to run commands individually:

```sql
-- Create tables
CREATE TABLE IF NOT EXISTS media_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document')),
  size BIGINT NOT NULL,
  folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own media" ON media_library
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own folders" ON media_folders
  USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;
```

## ✅ Success Indicators

After setup, you should be able to:
- ✅ Navigate to Media Library without errors
- ✅ Upload images, videos, and documents
- ✅ Create and manage folders
- ✅ View media analytics
- ✅ Search and filter media
- ✅ Select media for posts

## 🔗 Quick Links
- **Supabase Dashboard**: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny
- **SQL Editor**: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/sql
- **Storage**: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/storage/buckets
- **Authentication**: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/auth/users
