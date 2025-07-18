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
    const { post_id, platform, content, image_url, title, access_token }: PostRequest = await req.json()

    console.log(`🚀 Processing post ${post_id} for ${platform}`)

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
  // Twitter API v2 implementation
  const tweetData: any = { text: content };
  
  if (imageUrl) {
    // Upload media first, then attach to tweet
    // Implementation depends on your Twitter API setup
  }
  
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetData)
  });
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.statusText}`);
  }
  
  return await response.json();
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
  // Reddit API implementation
  const postData = {
    sr: 'test', // subreddit name
    kind: 'self',
    title: title,
    text: content
  };
  
  const response = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'SocialMediaScheduler/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData)
  });
  
  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.statusText}`);
  }
  
  return await response.json();
}
