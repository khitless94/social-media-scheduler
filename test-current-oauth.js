// Test current OAuth implementation
const https = require('https');
const querystring = require('querystring');

console.log('🔍 TESTING CURRENT TWITTER OAUTH SETUP');
console.log('=====================================\n');

// Test 1: Check if Twitter authorization endpoint is accessible
async function testTwitterEndpoint() {
    console.log('📡 Test 1: Twitter Authorization Endpoint');
    
    const testUrl = 'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ&redirect_uri=https%3A%2F%2Feqiuukwwpdiyncahrdny.supabase.co%2Ffunctions%2Fv1%2Foauth-callback&scope=tweet.read%20users.read%20tweet.write%20offline.access&state=test_123&code_challenge=test_challenge&code_challenge_method=S256';
    
    try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        console.log(`✅ Twitter endpoint accessible: ${response.status}`);
        console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    } catch (error) {
        console.log(`❌ Twitter endpoint error: ${error.message}`);
    }
    console.log('');
}

// Test 2: Check Supabase edge function
async function testSupabaseEdgeFunction() {
    console.log('🔧 Test 2: Supabase Edge Function');
    
    try {
        const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:8081'
            }
        });
        
        console.log(`✅ Edge function accessible: ${response.status}`);
        console.log(`   CORS headers: ${response.headers.get('access-control-allow-origin')}`);
        console.log(`   Methods: ${response.headers.get('access-control-allow-methods')}`);
    } catch (error) {
        console.log(`❌ Edge function error: ${error.message}`);
    }
    console.log('');
}

// Test 3: Simulate OAuth token exchange (without real code)
async function testTokenExchange() {
    console.log('🔑 Test 3: Token Exchange Simulation');
    
    const testData = {
        code: 'test_authorization_code',
        state: 'test_state',
        platform: 'twitter',
        session_data: {
            platform: 'twitter',
            user_id: 'test-user',
            code_verifier: 'test_verifier_123',
            timestamp: Date.now()
        }
    };
    
    try {
        const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:8081'
            },
            body: JSON.stringify(testData)
        });
        
        const responseText = await response.text();
        console.log(`📊 Token exchange test: ${response.status}`);
        console.log(`   Response: ${responseText.substring(0, 200)}...`);
        
        if (!response.ok) {
            console.log(`❌ Expected error (no real auth code): ${responseText}`);
        }
    } catch (error) {
        console.log(`❌ Token exchange error: ${error.message}`);
    }
    console.log('');
}

// Test 4: Check environment variables (indirectly)
async function testEnvironmentVariables() {
    console.log('🔐 Test 4: Environment Variables Check');
    
    // We can't directly check env vars, but we can test if they're working
    const testData = {
        code: 'invalid_code_for_testing',
        state: 'test_state',
        platform: 'twitter',
        session_data: {
            platform: 'twitter',
            user_id: 'test-user',
            code_verifier: 'test_verifier_that_should_fail',
            timestamp: Date.now()
        }
    };
    
    try {
        const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const responseText = await response.text();
        
        if (responseText.includes('TWITTER_CLIENT_SECRET')) {
            console.log('❌ TWITTER_CLIENT_SECRET is missing or not accessible');
        } else if (responseText.includes('unauthorized_client')) {
            console.log('✅ TWITTER_CLIENT_SECRET is set (getting expected auth error)');
        } else if (responseText.includes('invalid_grant')) {
            console.log('✅ Environment variables are working (getting expected grant error)');
        } else {
            console.log(`📊 Unexpected response: ${responseText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`❌ Environment test error: ${error.message}`);
    }
    console.log('');
}

// Run all tests
async function runAllTests() {
    console.log('Starting comprehensive OAuth tests...\n');
    
    await testTwitterEndpoint();
    await testSupabaseEdgeFunction();
    await testTokenExchange();
    await testEnvironmentVariables();
    
    console.log('🎯 SUMMARY:');
    console.log('1. Use the debug tool in your browser for interactive testing');
    console.log('2. Check browser console when trying to connect Twitter');
    console.log('3. Look for specific error messages in the OAuth callback');
    console.log('4. Verify Twitter app settings match our configuration');
    console.log('\n📋 Next Steps:');
    console.log('- Open debug-twitter-oauth.html in your browser');
    console.log('- Try connecting Twitter and check browser console');
    console.log('- Share any specific error messages you see');
}

// Handle both Node.js and browser environments
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    runAllTests().catch(console.error);
} else {
    // Browser environment
    window.runAllTests = runAllTests;
}
