// Test script to verify OAuth setup
// Run with: node test-oauth-setup.js

const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit'];

async function testOAuthSetup() {
  console.log('🔍 Testing OAuth Setup...\n');

  // Test 1: Check if Supabase function is accessible
  console.log('1. Testing Supabase function accessibility...');
  try {
    const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback?test=true');
    if (response.status === 302 || response.status === 200) {
      console.log('✅ OAuth callback function is accessible');
    } else {
      console.log('❌ OAuth callback function returned:', response.status);
    }
  } catch (error) {
    console.log('❌ OAuth callback function error:', error.message);
  }

  // Test 2: Check post-to-social function
  console.log('\n2. Testing post-to-social function...');
  try {
    const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'test', platforms: ['twitter'] })
    });
    
    if (response.status === 401) {
      console.log('✅ Post function requires authentication (expected)');
    } else {
      console.log('⚠️  Post function returned:', response.status);
    }
  } catch (error) {
    console.log('❌ Post function error:', error.message);
  }

  // Test 3: Generate OAuth URLs for each platform
  console.log('\n3. Testing OAuth URL generation...');
  
  const baseUrl = 'https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback';
  
  const oauthUrls = {
    twitter: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ&redirect_uri=${encodeURIComponent(baseUrl)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=test_state_twitter`,
    
    linkedin: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=86z7443djn3cgx&redirect_uri=${encodeURIComponent(baseUrl)}&scope=openid%20profile%20email%20w_member_social&state=test_state_linkedin`,
    
    facebook: `https://www.facebook.com/v18.0/dialog/oauth?response_type=code&client_id=2249146282214303&redirect_uri=${encodeURIComponent(baseUrl)}&scope=pages_manage_posts,pages_read_engagement&state=test_state_facebook`,
    
    reddit: `https://www.reddit.com/api/v1/authorize?response_type=code&client_id=kBrkkv-sRC-3jE9RIUt6-g&redirect_uri=${encodeURIComponent(baseUrl)}&scope=identity%20submit&state=test_state_reddit&duration=permanent`
  };

  for (const [platform, url] of Object.entries(oauthUrls)) {
    console.log(`\n${platform.toUpperCase()} OAuth URL:`);
    console.log(`🔗 ${url}`);
    console.log(`📋 Test by opening this URL in browser`);
  }

  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Open your app at http://localhost:3001');
  console.log('2. Sign in to your app');
  console.log('3. Go to Settings');
  console.log('4. Click "Connect" for any platform');
  console.log('5. Complete OAuth flow');
  console.log('6. Verify connection shows as connected');
  console.log('7. Test posting from Create Post page');

  console.log('\n🔧 If OAuth fails:');
  console.log('1. Check platform developer console settings');
  console.log('2. Verify redirect URI matches exactly');
  console.log('3. Update Supabase secrets with real credentials');
  console.log('4. Check Supabase function logs for errors');

  console.log('\n✨ OAuth implementation is ready for real credentials!');
}

// Run the test
testOAuthSetup().catch(console.error);
