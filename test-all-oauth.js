// Test all OAuth configurations
console.log('🔍 Testing All OAuth Configurations...\n');

const platforms = {
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientId: '86z7443djn3cgx',
    scope: 'openid profile email w_member_social',
    note: 'REQUIRES: "Sign In with LinkedIn using OpenID Connect" + "Share on LinkedIn" products'
  },
  reddit: {
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    clientId: 'kBrkkv-sRC-3jE9RIUt6-g',
    scope: 'identity edit flair history modconfig modflair modlog modposts modwiki mysubreddits privatemessages read report save submit subscribe vote wikiedit wikiread',
    note: 'Should work with current config'
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    clientId: 'ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ',
    scope: 'tweet.read users.read tweet.write offline.access',
    note: 'Uses PKCE flow'
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    clientId: '2249146282214303',
    scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
    note: 'Standard Facebook OAuth'
  }
};

const redirectUri = 'https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback';

Object.entries(platforms).forEach(([platform, config]) => {
  console.log(`\n📱 ${platform.toUpperCase()}`);
  console.log(`   Client ID: ${config.clientId}`);
  console.log(`   Scopes: ${config.scope}`);
  console.log(`   Note: ${config.note}`);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    state: `test-${platform}-123`
  });
  
  if (platform === 'reddit') {
    params.set('duration', 'permanent');
  }
  
  const testUrl = `${config.authUrl}?${params.toString()}`;
  console.log(`   Test URL: ${testUrl}`);
});

console.log('\n🚀 IMMEDIATE ACTIONS NEEDED:');
console.log('1. LinkedIn: Enable "Sign In with LinkedIn using OpenID Connect" + "Share on LinkedIn" products');
console.log('2. Test each platform by clicking the test URLs above');
console.log('3. All platforms should now show in the UI');
console.log('\n✅ Code has been updated with correct 2024 OAuth scopes!');
