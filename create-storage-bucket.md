# Create Storage Bucket for User Images

## Manual Setup Instructions

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/storage/buckets

2. **Create New Bucket**
   - Click "New bucket"
   - Name: `user-images`
   - Public bucket: ✅ **Yes** (checked)
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

3. **Set RLS Policies**
   Go to Storage > Policies and add these policies for the `user-images` bucket:

   **Policy 1: Users can upload their own images**
   ```sql
   CREATE POLICY "Users can upload their own images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'user-images' AND 
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Policy 2: Users can view their own images**
   ```sql
   CREATE POLICY "Users can view their own images" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'user-images' AND 
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Policy 3: Users can delete their own images**
   ```sql
   CREATE POLICY "Users can delete their own images" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'user-images' AND 
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

   **Policy 4: Public can view user images**
   ```sql
   CREATE POLICY "Public can view user images" ON storage.objects
   FOR SELECT USING (bucket_id = 'user-images');
   ```

## Alternative: Use SQL Editor

You can also run this SQL in the Supabase SQL Editor:

```sql
-- Create storage bucket for user uploaded images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for user-images bucket
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view user images" ON storage.objects
FOR SELECT USING (bucket_id = 'user-images');
```

After creating the bucket, the image upload feature will work perfectly!
