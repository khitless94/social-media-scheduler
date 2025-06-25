// Simple test script to verify authentication works
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testAuth() {
  console.log('Testing authentication...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }
    
    if (session?.user) {
      console.log('✅ User is authenticated:', {
        id: session.user.id,
        email: session.user.email
      });
      
      // Test storage bucket access
      console.log('Testing storage bucket access...');
      
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Storage buckets error:', bucketsError);
      } else {
        console.log('✅ Storage buckets accessible:', buckets.map(b => b.name));
        
        // Check if user-images bucket exists
        const userImagesBucket = buckets.find(b => b.name === 'user-images');
        if (userImagesBucket) {
          console.log('✅ user-images bucket found');
          
          // Test listing files in the bucket
          const { data: files, error: listError } = await supabase.storage
            .from('user-images')
            .list('', { limit: 1 });
            
          if (listError) {
            console.error('❌ List files error:', listError);
          } else {
            console.log('✅ Can list files in user-images bucket');
          }
        } else {
          console.log('❌ user-images bucket not found');
        }
      }
    } else {
      console.log('❌ User is not authenticated');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();
