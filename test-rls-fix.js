// Test script to verify RLS fix is working
// Run this with: node test-rls-fix.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSFix() {
  console.log('🧪 Testing RLS fix...');
  
  try {
    // Test the bypass function
    const testData = {
      p_user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      p_content: 'Test post from RLS fix verification',
      p_platforms: ['twitter'],
      p_scheduled_for: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      p_media_urls: []
    };
    
    console.log('📤 Testing RLS bypass function with:', testData);
    
    const { data: postId, error } = await supabase
      .rpc('create_scheduled_post_bypass_rls', testData);
    
    if (error) {
      console.error('❌ RLS bypass function failed:', error);
      console.log('💡 Please run the complete-rls-fix.sql script in Supabase SQL editor');
      return false;
    }
    
    if (postId) {
      console.log('✅ RLS bypass function succeeded! Post ID:', postId);
      
      // Clean up the test post
      console.log('🧹 Cleaning up test post...');
      await supabase.from('posts').delete().eq('id', postId);
      await supabase.from('scheduled_posts_queue').delete().eq('post_id', postId);
      
      console.log('✅ Test completed successfully!');
      console.log('🎉 Your scheduling should work now!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

// Run the test
testRLSFix().then(success => {
  if (success) {
    console.log('\n🎯 RESULT: RLS fix is working correctly!');
  } else {
    console.log('\n❌ RESULT: RLS fix needs attention. Please run complete-rls-fix.sql');
  }
  process.exit(success ? 0 : 1);
});
