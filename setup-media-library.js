// Script to set up Media Library database schema
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupMediaLibrary() {
  console.log('🚀 Setting up Media Library...');
  
  try {
    // Test connection first
    console.log('📡 Testing connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Authentication error:', authError.message);
      console.log('ℹ️  Please sign in to your application first, then run this script again.');
      return;
    }
    
    if (!user) {
      console.log('⚠️  No user authenticated. Please sign in to your application first.');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Check if tables exist
    console.log('🔍 Checking existing tables...');
    
    // Test media_library table
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ media_library table does not exist or has issues:', error.message);
      } else {
        console.log('✅ media_library table exists');
      }
    } catch (err) {
      console.log('❌ media_library table check failed:', err.message);
    }
    
    // Test media_folders table
    try {
      const { data, error } = await supabase
        .from('media_folders')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ media_folders table does not exist or has issues:', error.message);
      } else {
        console.log('✅ media_folders table exists');
      }
    } catch (err) {
      console.log('❌ media_folders table check failed:', err.message);
    }
    
    // Check storage buckets
    console.log('🗂️  Checking storage buckets...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.log('❌ Storage bucket check failed:', bucketError.message);
      } else {
        const mediaLibraryBucket = buckets.find(b => b.id === 'media-library');
        if (mediaLibraryBucket) {
          console.log('✅ media-library bucket exists');
        } else {
          console.log('❌ media-library bucket does not exist');
          console.log('📋 Available buckets:', buckets.map(b => b.id).join(', '));
        }
      }
    } catch (err) {
      console.log('❌ Storage check failed:', err.message);
    }
    
    // Test folder creation (this will help us understand RLS issues)
    console.log('🧪 Testing folder creation...');
    try {
      const testFolderName = `test-folder-${Date.now()}`;
      const { data, error } = await supabase
        .from('media_folders')
        .insert({
          user_id: user.id,
          name: testFolderName,
          description: 'Test folder created by setup script'
        })
        .select()
        .single();
      
      if (error) {
        console.log('❌ Folder creation test failed:', error.message);
        console.log('🔧 This suggests RLS policies or table structure issues');
      } else {
        console.log('✅ Folder creation test successful');
        
        // Clean up test folder
        await supabase
          .from('media_folders')
          .delete()
          .eq('id', data.id);
        console.log('🧹 Test folder cleaned up');
      }
    } catch (err) {
      console.log('❌ Folder creation test error:', err.message);
    }
    
    // Test storage upload
    console.log('📤 Testing storage upload...');
    try {
      const testFileName = `test-${Date.now()}.txt`;
      const testFile = new Blob(['test content'], { type: 'text/plain' });
      
      const { data, error } = await supabase.storage
        .from('media-library')
        .upload(`${user.id}/${testFileName}`, testFile);
      
      if (error) {
        console.log('❌ Storage upload test failed:', error.message);
        console.log('🔧 This suggests storage bucket or policy issues');
      } else {
        console.log('✅ Storage upload test successful');
        
        // Clean up test file
        await supabase.storage
          .from('media-library')
          .remove([`${user.id}/${testFileName}`]);
        console.log('🧹 Test file cleaned up');
      }
    } catch (err) {
      console.log('❌ Storage upload test error:', err.message);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('If you see errors above, you need to:');
    console.log('1. Run the SQL schema in setup-media-library-schema.sql in your Supabase SQL Editor');
    console.log('2. Make sure RLS policies are properly configured');
    console.log('3. Ensure the media-library storage bucket exists with proper permissions');
    console.log('\n🔗 Go to: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/sql');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
setupMediaLibrary();
