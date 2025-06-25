// Script to fix storage policies directly on remote Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"; // You need to get this from your Supabase dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixStoragePolicies() {
  console.log('🔧 Fixing storage policies...');
  
  try {
    // SQL to fix storage policies
    const sql = `
      -- Enable RLS on storage.objects if not already enabled
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Drop ALL existing policies for user-images bucket to avoid conflicts
      DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
      DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;
      DROP POLICY IF EXISTS "user_images_upload_policy" ON storage.objects;
      DROP POLICY IF EXISTS "user_images_select_policy" ON storage.objects;
      DROP POLICY IF EXISTS "user_images_delete_policy" ON storage.objects;

      -- Create correct storage policies based on best practices
      -- Policy for uploads (INSERT) - users can upload to their own folder
      CREATE POLICY "Authenticated users can upload files to user-images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'user-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

      -- Policy for reading files (SELECT) - public access for user-images bucket
      CREATE POLICY "Anyone can view files in user-images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'user-images');

      -- Policy for deleting files (DELETE) - users can delete their own files
      CREATE POLICY "Users can delete own files in user-images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'user-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );

      -- Policy for updating files (UPDATE) - users can update their own files
      CREATE POLICY "Users can update own files in user-images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'user-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'user-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }

    console.log('✅ Storage policies fixed successfully!');
    
    // Verify bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    const userImagesBucket = buckets.find(b => b.name === 'user-images');
    if (userImagesBucket) {
      console.log('✅ user-images bucket exists:', userImagesBucket);
    } else {
      console.log('⚠️ user-images bucket not found, creating...');
      
      // Create bucket if it doesn't exist
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('user-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
      } else {
        console.log('✅ user-images bucket created successfully!');
      }
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Alternative approach using direct SQL execution
async function fixStoragePoliciesAlternative() {
  console.log('🔧 Fixing storage policies (alternative approach)...');
  
  const policies = [
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Public can view user images" ON storage.objects;`,
    `DROP POLICY IF EXISTS "user_images_upload_policy" ON storage.objects;`,
    `DROP POLICY IF EXISTS "user_images_select_policy" ON storage.objects;`,
    `DROP POLICY IF EXISTS "user_images_delete_policy" ON storage.objects;`,
    
    // Create new policies
    `CREATE POLICY "Authenticated users can upload files to user-images"
     ON storage.objects
     FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'user-images' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );`,
     
    `CREATE POLICY "Anyone can view files in user-images"
     ON storage.objects
     FOR SELECT
     USING (bucket_id = 'user-images');`,
     
    `CREATE POLICY "Users can delete own files in user-images"
     ON storage.objects
     FOR DELETE
     TO authenticated
     USING (
       bucket_id = 'user-images' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );`
  ];
  
  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.error('❌ Error executing policy:', error);
      } else {
        console.log('✅ Policy executed successfully');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}

// Run the fix
fixStoragePolicies().then(() => {
  console.log('🎉 Storage policy fix completed!');
}).catch(error => {
  console.error('💥 Fix failed:', error);
  console.log('Trying alternative approach...');
  fixStoragePoliciesAlternative();
});
