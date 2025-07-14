// Real Twitter API posting code for n8n
const posts = $input.all();

if (posts.length === 0) {
  console.log('📭 No pending posts to process');
  return [];
}

console.log(`📋 Processing ${posts.length} pending posts for REAL posting`);

const results = [];

for (const post of posts) {
  try {
    const postData = post.json;
    
    // Safely parse platforms
    let platforms = [];
    if (typeof postData.platforms === 'string') {
      try {
        platforms = JSON.parse(postData.platforms);
      } catch (e) {
        console.error('❌ Error parsing platforms JSON:', e.message);
        platforms = ['twitter']; // fallback
      }
    } else if (Array.isArray(postData.platforms)) {
      platforms = postData.platforms;
    } else {
      platforms = ['twitter']; // fallback
    }
    
    console.log(`🚀 REAL posting: "${postData.content.substring(0, 50)}..." to ${platforms.join(', ')}`);
    
    const platformResults = {};
    
    for (const platform of platforms) {
      try {
        if (platform.toLowerCase() === 'twitter') {
          // Real Twitter API call
          const twitterResult = await postToTwitter(postData.content, postData.media_urls || []);
          platformResults[platform] = twitterResult.id;
          console.log(`✅ REAL Twitter post created: ${twitterResult.url}`);
          
        } else if (platform.toLowerCase() === 'facebook') {
          // Real Facebook API call
          const facebookResult = await postToFacebook(postData.content, postData.media_urls || []);
          platformResults[platform] = facebookResult.id;
          console.log(`✅ REAL Facebook post created: ${facebookResult.url}`);
          
        } else {
          // For other platforms, still simulate until you add their APIs
          platformResults[platform] = `${platform}_simulated_${Date.now()}`;
          console.log(`⚠️ ${platform}: Still simulated (API not implemented)`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to post to ${platform}: ${error.message}`);
        platformResults[platform] = `error_${Date.now()}`;
      }
    }
    
    results.push({
      id: postData.id,
      post_id: postData.post_id,
      status: 'completed',
      platform_post_ids: JSON.stringify(platformResults),
      completed_at: new Date().toISOString(),
      platforms_count: platforms.length
    });
    
  } catch (error) {
    console.error('❌ Error processing post:', error.message);
    results.push({
      id: post.json.id,
      post_id: post.json.post_id,
      status: 'failed',
      platform_post_ids: '{}',
      completed_at: new Date().toISOString(),
      error_message: error.message
    });
  }
}

// Real Twitter API function
async function postToTwitter(content, mediaUrls) {
  // You need to configure these credentials in n8n
  const TWITTER_API_KEY = 'your_twitter_api_key';
  const TWITTER_API_SECRET = 'your_twitter_api_secret';
  const TWITTER_ACCESS_TOKEN = 'your_twitter_access_token';
  const TWITTER_ACCESS_TOKEN_SECRET = 'your_twitter_access_token_secret';
  
  // Twitter API v2 endpoint
  const url = 'https://api.twitter.com/2/tweets';
  
  // Create OAuth 1.0a signature (simplified - you might need a library)
  const headers = {
    'Authorization': `Bearer ${TWITTER_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const tweetData = {
    text: content
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(tweetData)
  });
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  return {
    id: result.data.id,
    url: `https://twitter.com/user/status/${result.data.id}`
  };
}

// Real Facebook API function
async function postToFacebook(content, mediaUrls) {
  // You need to configure these credentials
  const FACEBOOK_ACCESS_TOKEN = 'your_facebook_access_token';
  const FACEBOOK_PAGE_ID = 'your_facebook_page_id';
  
  const url = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: content,
      access_token: FACEBOOK_ACCESS_TOKEN
    })
  });
  
  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  return {
    id: result.id,
    url: `https://facebook.com/${result.id}`
  };
}

console.log(`📊 Processed ${results.length} posts with REAL API calls`);
return results.map(item => ({ json: item }));
