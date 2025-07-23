// Supabase Edge Function for Social Media Posting
// Deploy with: supabase functions deploy post-to-social-media

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PostRequest {
  post_id: string;
  platform: string;
  content: string;
  image_url?: string;
  title?: string;
  access_token: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('🚀 [EdgeFunction] Received request:', requestBody)

    // Handle both old and new request formats
    const {
      post_id,
      platform,
      content,
      image_url,
      image,
      title,
      access_token
    } = requestBody

    const finalContent = content || requestBody.content
    const finalPlatform = platform || requestBody.platform
    const finalImage = image_url || image || requestBody.image

    console.log(`🚀 Processing post for ${finalPlatform}`)
    console.log(`📝 Content: ${finalContent?.substring(0, 100)}...`)

    let result;
    
    switch (platform.toLowerCase()) {
      case 'twitter':
        result = await postToTwitter(content, image_url, access_token);
        break;
      case 'linkedin':
        result = await postToLinkedIn(content, image_url, access_token);
        break;
      case 'facebook':
        result = await postToFacebook(content, image_url, access_token);
        break;
      case 'instagram':
        result = await postToInstagram(content, image_url, access_token);
        break;
      case 'reddit':
        result = await postToReddit(title || content, content, access_token);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`✅ Successfully posted to ${platform}:`, result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        platform, 
        result,
        post_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error posting to social media:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        post_id: req.body?.post_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Platform-specific posting functions
async function postToTwitter(content: string, imageUrl?: string, accessToken?: string) {
  console.log('🐦 [Twitter] Starting Twitter API posting...');
  console.log('🐦 [Twitter] Content:', content);
  console.log('🐦 [Twitter] Image URL:', imageUrl);

  // Use the provided access token or fallback to environment Bearer token
  const bearerToken = accessToken || Deno.env.get('TWITTER_BEARER_TOKEN');

  if (!bearerToken) {
    throw new Error('Twitter authentication required. No access token provided.');
  }

  // Validate content length (Twitter limit is 280 characters)
  if (content.length > 280) {
    console.warn('🐦 [Twitter] Content exceeds 280 characters, truncating...');
    content = content.substring(0, 277) + '...';
  }

  // Prepare tweet data
  const tweetData: any = { text: content };

  // Handle media upload if image is provided
  if (imageUrl) {
    console.log('⚠️ [Twitter] Image upload not yet implemented, posting text only');
  }

  console.log('📤 [Twitter] Posting tweet:', tweetData);

  // Use OAuth 2.0 Bearer token for Twitter API v2
  console.log('🔐 [Twitter] Using OAuth 2.0 Bearer token authentication');

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetData)
  });

  console.log('📡 [Twitter] API Response Status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [Twitter] API Error:', errorText);
    throw new Error(`Twitter API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ [Twitter] Tweet posted successfully:', result);

  return {
    success: true,
    data: result.data,
    postId: result.data?.id,
    url: result.data?.id ? `https://twitter.com/user/status/${result.data.id}` : undefined
  };
}

async function postToLinkedIn(content: string, imageUrl?: string, accessToken?: string) {
  // LinkedIn API implementation
  const postData = {
    author: 'urn:li:person:YOUR_PERSON_ID', // You'll need to get this
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
      }
    }
  };
  
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.statusText}`);
  }
  
  return await response.json();
}

async function postToFacebook(content: string, imageUrl?: string, accessToken?: string) {
  // Facebook Graph API implementation
  const postData: any = { message: content };
  
  if (imageUrl) {
    postData.link = imageUrl;
  }
  
  const response = await fetch(`https://graph.facebook.com/me/feed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.statusText}`);
  }
  
  return await response.json();
}

async function postToInstagram(content: string, imageUrl?: string, accessToken?: string) {
  // Instagram Graph API implementation
  if (!imageUrl) {
    throw new Error('Instagram requires an image');
  }
  
  // First create media object
  const mediaResponse = await fetch(`https://graph.instagram.com/me/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: content
    })
  });
  
  if (!mediaResponse.ok) {
    throw new Error(`Instagram media creation error: ${mediaResponse.statusText}`);
  }
  
  const mediaData = await mediaResponse.json();
  
  // Then publish the media
  const publishResponse = await fetch(`https://graph.instagram.com/me/media_publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      creation_id: mediaData.id
    })
  });
  
  if (!publishResponse.ok) {
    throw new Error(`Instagram publish error: ${publishResponse.statusText}`);
  }
  
  return await publishResponse.json();
}

async function postToReddit(title: string, content: string, accessToken?: string) {
  try {
    if (!accessToken) {
      throw new Error('Reddit account not connected. Please connect your Reddit account in Settings.');
    }

    // First, test the token by getting user info
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Reddit authentication failed. Please reconnect your Reddit account in Settings.`);
    }

    const postData = {
      kind: 'self',
      title: title,
      text: content,
      sr: 'test', // Use 'test' subreddit as default
      api_type: 'json'
    };

    const formData = new URLSearchParams();
    Object.keys(postData).forEach(key => {
      formData.append(key, postData[key]);
    });

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 403) {
        throw new Error("Reddit posting forbidden. Please check: 1) Reddit account is connected, 2) You have permission to post to this subreddit, 3) Try 'test' or 'testingground4bots' subreddit.");
      } else if (response.status === 401) {
        throw new Error("Reddit authentication failed. Please reconnect your Reddit account in Settings.");
      }
      throw new Error(`Reddit API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.json?.errors && result.json.errors.length > 0) {
      throw new Error(`Reddit error: ${result.json.errors[0][1]}`);
    }

    return result;
  } catch (error) {
    console.error('[Reddit] Error:', error);
    throw error;
  }
}
