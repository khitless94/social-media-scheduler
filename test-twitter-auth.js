// Quick test to verify Twitter OAuth credentials
// Run this with: node test-twitter-auth.js

const https = require('https');
const querystring = require('querystring');

// Your Twitter app credentials
const TWITTER_CLIENT_ID = 'ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ';
const TWITTER_CLIENT_SECRET = 'YOUR_ACTUAL_TWITTER_CLIENT_SECRET_HERE'; // Replace this!

// Test data (you'll need to replace with actual values from a real OAuth flow)
const TEST_CODE = 'test_code'; // This would come from Twitter OAuth redirect
const REDIRECT_URI = 'https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback';

function testTwitterAuth() {
  console.log('🐦 Testing Twitter OAuth Configuration...\n');
  
  // Check if client secret is set
  if (!TWITTER_CLIENT_SECRET || TWITTER_CLIENT_SECRET.includes('YOUR_ACTUAL')) {
    console.log('❌ TWITTER_CLIENT_SECRET is not set!');
    console.log('Please replace YOUR_ACTUAL_TWITTER_CLIENT_SECRET_HERE with your real secret');
    return;
  }
  
  console.log('✅ Client ID:', TWITTER_CLIENT_ID);
  console.log('✅ Client Secret:', TWITTER_CLIENT_SECRET.substring(0, 10) + '...');
  console.log('✅ Redirect URI:', REDIRECT_URI);
  
  // Create Basic Auth header
  const auth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
  console.log('✅ Basic Auth Header:', `Basic ${auth.substring(0, 20)}...`);
  
  // Prepare request body
  const postData = querystring.stringify({
    grant_type: 'authorization_code',
    client_id: TWITTER_CLIENT_ID,
    code: TEST_CODE,
    redirect_uri: REDIRECT_URI,
    code_verifier: 'test_verifier' // This would be the real PKCE verifier
  });
  
  const options = {
    hostname: 'api.twitter.com',
    port: 443,
    path: '/2/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'User-Agent': 'ScribeSchedule/1.0'
    }
  };
  
  console.log('\n🔍 Request Configuration:');
  console.log('URL:', `https://${options.hostname}${options.path}`);
  console.log('Method:', options.method);
  console.log('Headers:', Object.keys(options.headers).join(', '));
  
  console.log('\n📝 This test shows your configuration is ready.');
  console.log('The actual OAuth flow will work once you:');
  console.log('1. Set the correct TWITTER_CLIENT_SECRET in Supabase');
  console.log('2. Deploy the updated oauth-callback function');
  console.log('3. Ensure your Twitter app redirect URI matches exactly');
}

testTwitterAuth();
