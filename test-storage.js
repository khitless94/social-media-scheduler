// Test script to verify storage configuration
// Run this with: node test-storage.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorageConfiguration() {
  console.log('🔍 Testing Supabase Storage Configuration...\n');

  try {
    // Test 1: Check if bucket exists
    console.log('1. Checking if user-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const userImagesBucket = buckets.find(bucket => bucket.id === 'user-images');
    if (userImagesBucket) {
      console.log('✅ user-images bucket found:', userImagesBucket);
    } else {
      console.log('❌ user-images bucket not found');
      console.log('Available buckets:', buckets.map(b => b.id));
      return;
    }

    // Test 2: Try to list files in bucket (should work if bucket is public)
    console.log('\n2. Testing bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('user-images')
      .list('', { limit: 1 });

    if (listError) {
      console.log('⚠️ Cannot list files (this might be normal):', listError.message);
    } else {
      console.log('✅ Can list files in bucket');
    }

    // Test 3: Create a test file and try to upload
    console.log('\n3. Testing file upload...');
    
    // Create a small test image (1x1 pixel PNG)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Convert base64 to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();
    
    const fileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.log('❌ Upload failed:', uploadError);
      console.log('This is likely due to RLS policies requiring authentication');
    } else {
      console.log('✅ Upload successful:', uploadData);
      
      // Test 4: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName);
      
      console.log('✅ Public URL generated:', publicUrl);
      
      // Clean up - delete test file
      const { error: deleteError } = await supabase.storage
        .from('user-images')
        .remove([fileName]);
      
      if (!deleteError) {
        console.log('✅ Test file cleaned up');
      }
    }

    console.log('\n📋 Summary:');
    console.log('- Bucket exists: ✅');
    console.log('- Upload test:', uploadError ? '❌ (needs authentication)' : '✅');
    console.log('\n💡 If upload failed, run the fix-storage-final.sql script in your Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStorageConfiguration();
