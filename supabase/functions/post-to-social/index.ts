import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Max-Age": "86400",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('[Auth] Missing authorization header');
      return new Response(JSON.stringify({
        error: 'Missing authorization header. Please sign in to your account.'
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log(`[Auth] Validating token (length: ${token.length})`);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('[Auth] Token validation error:', userError);
      return new Response(JSON.stringify({
        error: 'Authentication failed. Please sign out and sign in again.',
        details: userError.message
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user) {
      console.error('[Auth] No user found for token');
      return new Response(JSON.stringify({
        error: 'User not found. Please sign out and sign in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Auth] ✅ User authenticated: ${user.id} (${user.email})`);
    console.log(`[Auth] User created: ${user.created_at}`);

    const body = await req.json();
    console.log('[Request] Full request body:', JSON.stringify(body, null, 2));
    let { content, platforms, platform, image, subreddit, title, flair } = body;
    console.log('[Request] Extracted subreddit:', subreddit);
    console.log('[Request] Extracted flair:', flair);

    // Handle both old format (platform: "linkedin") and new format (platforms: ["linkedin"])
    if (platform && !platforms) {
      platforms = [platform];
    }

    if (!content || !platforms || platforms.length === 0) {
      return new Response(JSON.stringify({
        error: "Content and platform(s) are required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const platform of platforms) {
      try {
        // Processing platform

        // Get OAuth credentials for this platform and user
        console.log(`[${platform}] Looking for credentials for user: ${user.id}`);
        const { data: credentials, error: credError } = await supabase
          .from('oauth_credentials')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', platform)
          .single();

        if (credError || !credentials) {
          console.error(`[${platform}] No credentials found:`, credError);
          console.error(`[${platform}] Error details:`, {
            code: credError?.code,
            message: credError?.message,
            details: credError?.details
          });
          results.push({
            platform,
            success: false,
            error: `No OAuth credentials found for ${platform}. Please connect your account first.`,
            needsReconnection: true
          });
          continue;
        }

        console.log(`[${platform}] ✅ Credentials found`);
        console.log(`[${platform}] Token expires at: ${credentials.expires_at || 'Never'}`);
        console.log(`[${platform}] Has access token: ${!!credentials.access_token}`);
        console.log(`[${platform}] Has refresh token: ${!!credentials.refresh_token}`);

        // Check if token is expired
        if (credentials.expires_at && new Date(credentials.expires_at) < new Date()) {
          console.error(`Token expired for ${platform}`);
          results.push({
            platform,
            success: false,
            error: `OAuth token expired for ${platform}. Please reconnect your account.`,
            needsReconnection: true
          });
          continue;
        }

        const result = await postToSocialMedia(platform, content, image, credentials, title, subreddit, flair);
        results.push(result);
      } catch (err) {
        console.error(`Error posting to ${platform}:`, err);
        results.push({ platform, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Platform character limits
const PLATFORM_LIMITS = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  reddit: 40000
};

function optimizeContentForPlatform(content: string, platform: string): string {
  const limit = PLATFORM_LIMITS[platform.toLowerCase() as keyof typeof PLATFORM_LIMITS] || 280;

  if (content.length <= limit) {
    return content;
  }

  // For Twitter, be more aggressive with truncation
  if (platform.toLowerCase() === 'twitter') {
    const words = content.split(' ');
    let truncated = '';
    for (const word of words) {
      if ((truncated + ' ' + word).length <= limit - 3) {
        truncated += (truncated ? ' ' : '') + word;
      } else {
        break;
      }
    }
    return truncated + "...";
  }

  // For other platforms, truncate at word boundary
  const truncated = content.substring(0, limit - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
}



// Old Twitter functions removed - now using twitter-api-v2 library

// Twitter posting function using OAuth 2.0 Bearer Token (current standard)
async function postToTwitter(content: string, image?: string, credentials?: any) {
  try {
    console.log('[Twitter] 🐦 Starting Twitter posting process...');
    console.log('[Twitter] Content length:', content.length);
    console.log('[Twitter] Has image:', !!image);

    // Get Twitter Bearer Token from environment or use user's access token
    console.log('[Twitter] Checking for Bearer token...');
    console.log('[Twitter] User credentials available:', !!credentials);
    console.log('[Twitter] User access token available:', !!credentials?.access_token);
    console.log('[Twitter] Environment TWITTER_BEARER_TOKEN available:', !!Deno.env.get('TWITTER_BEARER_TOKEN'));

    const bearerToken = credentials?.access_token || Deno.env.get('TWITTER_BEARER_TOKEN');

    if (!bearerToken) {
      console.error('[Twitter] ❌ No Bearer token available');
      console.error('[Twitter] Credentials object:', credentials);
      return {
        platform: "twitter",
        success: false,
        error: "Twitter authentication required. Please reconnect your Twitter account."
      };
    }

    console.log('[Twitter] ✅ Bearer token available, proceeding with posting...');
    console.log('[Twitter] Token source:', credentials?.access_token ? 'User credentials' : 'Environment variable');
    console.log('[Twitter] Token length:', bearerToken.length);
    console.log('[Twitter] Token prefix:', bearerToken.substring(0, 10) + '...');

    // Validate content length (Twitter limit is 280 characters)
    if (content.length > 280) {
      console.warn('[Twitter] Content exceeds 280 characters, truncating...');
      content = content.substring(0, 277) + '...';
    }

    // Prepare tweet data
    const tweetData: any = {
      text: content
    };

    // Handle image upload if provided
    if (image) {
      console.log('[Twitter] ⚠️ Image posting not yet implemented with OAuth 2.0, posting text only');
    }

    // Post tweet using Twitter API v2
    console.log('[Twitter] 🚀 Posting tweet to Twitter API v2...');
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[Twitter] ✅ Tweet posted successfully');
      console.log('[Twitter] Tweet ID:', result.data?.id);

      return {
        platform: "twitter",
        success: true,
        data: result.data,
        message: "Tweet posted successfully"
      };
    } else {
      const errorText = await response.text();
      console.error('[Twitter] ❌ Tweet posting failed:', response.status, errorText);

      // Handle rate limiting
      if (response.status === 429) {
        const resetTime = response.headers.get('x-rate-limit-reset');
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null;
        const waitMinutes = resetDate ? Math.ceil((resetDate.getTime() - Date.now()) / 60000) : 15;

        return {
          platform: "twitter",
          success: false,
          error: `Rate limit exceeded. Please wait ${waitMinutes} minutes before trying again.`,
          retryAfter: waitMinutes
        };
      }

      // Handle authentication errors
      if (response.status === 401) {
        return {
          platform: "twitter",
          success: false,
          error: "Twitter authentication expired. Please reconnect your Twitter account.",
          needsReconnection: true
        };
      }

      // Parse error response
      let errorMessage = 'Unknown error occurred';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message || errorMessage;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (parseError) {
        errorMessage = errorText || errorMessage;
      }

      return {
        platform: "twitter",
        success: false,
        error: `Twitter API error: ${errorMessage}`
      };
    }

  } catch (error) {
    console.error('[Twitter] ❌ Twitter posting failed:', error);
    return {
      platform: "twitter",
      success: false,
      error: error.message
    };
  }
}







// LinkedIn posting function
async function postToLinkedIn(content: string, image?: string, credentials?: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No LinkedIn access token found');
    }

    // Starting LinkedIn post

    // Try to get user profile using the correct endpoint for available scopes
    let personUrn = null;

    // First try the OpenID Connect userinfo endpoint (if using openid scope)
    try {
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        personUrn = `urn:li:person:${profile.sub}`;
        // Got profile from userinfo endpoint
      } else {
        // userinfo endpoint failed, trying lite profile
        throw new Error('userinfo failed');
      }
    } catch (userinfoError) {
      // Fallback to lite profile endpoint (for r_liteprofile scope)
      try {
        const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          // Ensure the URN format is correct for lite profile
          personUrn = profile.id.startsWith('urn:li:person:') ? profile.id : `urn:li:person:${profile.id}`;
          console.log('[LinkedIn] Got profile from lite profile endpoint:', personUrn);
        } else {
          const errorText = await profileResponse.text();
          console.error('[LinkedIn] Lite profile error:', errorText);
          throw new Error(`Failed to get LinkedIn profile: ${profileResponse.status} - ${errorText}`);
        }
      } catch (liteProfileError) {
        console.error('[LinkedIn] Both profile endpoints failed:', liteProfileError);
        throw new Error('Unable to get LinkedIn profile. Please check your LinkedIn app permissions and scopes.');
      }
    }

    if (!personUrn) {
      throw new Error('Could not determine LinkedIn person URN');
    }

    console.log('[LinkedIn] Person URN:', personUrn);

    let mediaUrn = null;

    // Upload image if provided
    if (image) {
      try {
        // Download image
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // Register upload with LinkedIn
        const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: personUrn,
              serviceRelationships: [{
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent'
              }]
            }
          })
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
          const asset = registerData.value.asset;

          // Upload the actual image
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: imageBuffer
          });

          if (uploadResponse.ok) {
            mediaUrn = asset;
            console.log('[LinkedIn] Image uploaded successfully:', mediaUrn);
          }
        }
      } catch (imageError) {
        console.error('[LinkedIn] Image upload error:', imageError);
        // Continue without image
      }
    }

    // Create the post using LinkedIn's current API format
    // Try the newer Posts API format first, then fall back to UGC if needed
    const postData: any = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: mediaUrn ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Add media if present
    if (mediaUrn) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        description: {
          text: 'Image'
        },
        media: mediaUrn,
        title: {
          text: 'Image'
        }
      }];
    }

    console.log('[LinkedIn] Posting data:', JSON.stringify(postData, null, 2));

    // Try the UGC Posts API first
    let response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    });

    // If UGC API fails with 422, try the newer Posts API format
    if (!response.ok && response.status === 422) {
      console.log('[LinkedIn] UGC API failed, trying newer Posts API format');

      const newPostData = {
        author: personUrn,
        commentary: content,
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED'
      };

      if (mediaUrn) {
        newPostData.content = {
          media: {
            title: 'Image',
            id: mediaUrn
          }
        };
      }

      console.log('[LinkedIn] Trying newer Posts API with data:', JSON.stringify(newPostData, null, 2));

      response = await fetch('https://api.linkedin.com/v2/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': '202304'
        },
        body: JSON.stringify(newPostData)
      });
    }

    console.log('[LinkedIn] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LinkedIn] API Error Response:', errorText);
      console.error('[LinkedIn] Request Data was:', JSON.stringify(postData, null, 2));

      // Try to parse error details
      let errorDetails = '';
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch (e) {
        errorDetails = errorText;
      }

      // Check for specific LinkedIn errors
      if (response.status === 403) {
        throw new Error(`LinkedIn API error: Insufficient permissions. Please ensure your LinkedIn app has the 'w_member_social' scope and 'Share on LinkedIn' product enabled. Status: ${response.status}. Details: ${errorDetails}`);
      } else if (response.status === 401) {
        throw new Error(`LinkedIn API error: Invalid or expired access token. Please reconnect your LinkedIn account. Status: ${response.status}. Details: ${errorDetails}`);
      } else if (response.status === 422) {
        throw new Error(`LinkedIn API error: Invalid post data format. This usually means the post structure doesn't match LinkedIn's requirements. Status: ${response.status}. Details: ${errorDetails}`);
      } else {
        throw new Error(`LinkedIn API error: ${response.status} - ${errorDetails}`);
      }
    }

    const result = await response.json();
    console.log('[LinkedIn] Post successful:', result);

    return {
      platform: "linkedin",
      success: true,
      postId: result.id,
      url: `https://www.linkedin.com/feed/update/${result.id}`,
      message: `✅ Successfully posted to LinkedIn! ${mediaUrn ? 'Image included.' : ''}`
    };

  } catch (error) {
    console.error('[LinkedIn] Error:', error);
    return {
      platform: "linkedin",
      success: false,
      error: error.message
    };
  }
}

// Facebook posting function
async function postToFacebook(content: string, image?: string, credentials?: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No Facebook access token found');
    }

    // Get user's pages (Facebook requires posting to pages, not personal profiles)
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);

    if (!pagesResponse.ok) {
      throw new Error(`Failed to get Facebook pages: ${pagesResponse.status}`);
    }

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found. You need to have a Facebook page to post.');
    }

    // Use the first page
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    let photoId = null;

    // Upload image if provided
    if (image) {
      try {
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBlob = new Blob([imageBuffer]);

        const formData = new FormData();
        formData.append('source', imageBlob);
        formData.append('published', 'false'); // Upload but don't publish yet
        formData.append('access_token', pageAccessToken);

        const photoResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
          method: 'POST',
          body: formData
        });

        if (photoResponse.ok) {
          const photoData = await photoResponse.json();
          photoId = photoData.id;
          console.log('[Facebook] Image uploaded successfully:', photoId);
        } else {
          console.error('[Facebook] Image upload failed:', await photoResponse.text());
        }
      } catch (imageError) {
        console.error('[Facebook] Image upload error:', imageError);
        // Continue without image
      }
    }

    // Create the post
    const postData = new URLSearchParams();
    postData.append('message', content);
    postData.append('access_token', pageAccessToken);

    if (photoId) {
      postData.append('attached_media[0]', JSON.stringify({ media_fbid: photoId }));
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      body: postData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Facebook] API Error:', errorText);
      throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Facebook] Post successful:', result);

    return {
      platform: "facebook",
      success: true,
      postId: result.id,
      url: `https://www.facebook.com/${result.id}`,
      message: `✅ Successfully posted to Facebook page "${page.name}"! ${photoId ? 'Image included.' : ''}`
    };

  } catch (error) {
    console.error('[Facebook] Error:', error);
    return {
      platform: "facebook",
      success: false,
      error: error.message
    };
  }
}

// Instagram posting function
async function postToInstagram(content: string, image?: string, credentials?: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No Instagram access token found');
    }

    // Instagram requires an image for posts
    if (!image) {
      throw new Error('Instagram posts require an image');
    }

    // Get Instagram business account ID using comprehensive detection
    let instagramAccountId = null;

    console.log('[Instagram] Starting Instagram Business account detection...');

    // Method 1: Check if user has direct Instagram Business account
    try {
      const directResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=instagram_business_account&access_token=${accessToken}`);
      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('[Instagram] Direct IG check result:', directData);

        if (directData.instagram_business_account?.id) {
          instagramAccountId = directData.instagram_business_account.id;
          console.log('[Instagram] Found direct Instagram Business account:', instagramAccountId);
        }
      }
    } catch (error) {
      console.log('[Instagram] Direct IG check failed:', error);
    }

    // Method 2: If no direct account, check Facebook pages for linked Instagram accounts
    if (!instagramAccountId) {
      console.log('[Instagram] No direct account found, checking Facebook pages...');

      const accountResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);

      if (!accountResponse.ok) {
        throw new Error(`Failed to get Facebook pages: ${accountResponse.status}`);
      }

      const accountData = await accountResponse.json();
      console.log('[Instagram] Facebook pages response:', accountData);

      if (accountData.data && accountData.data.length > 0) {
        // Check each Facebook page for linked Instagram Business account
        for (const page of accountData.data) {
          try {
            const pageIgResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
            if (pageIgResponse.ok) {
              const pageIgData = await pageIgResponse.json();
              console.log(`[Instagram] Page ${page.name} IG check:`, pageIgData);

              if (pageIgData.instagram_business_account?.id) {
                instagramAccountId = pageIgData.instagram_business_account.id;
                console.log(`[Instagram] Found Instagram account via page ${page.name}:`, instagramAccountId);
                break;
              }
            }
          } catch (error) {
            console.log(`[Instagram] Failed to check page ${page.name}:`, error);
          }
        }
      } else {
        console.log('[Instagram] No Facebook pages found');
      }
    }

    // Final check: if still no Instagram account found
    if (!instagramAccountId) {
      throw new Error('No Instagram Business account found. Please ensure you have:\n1. An Instagram Business or Creator account\n2. The account is linked to a Facebook Page\n3. You have the necessary permissions\n\nVisit https://business.facebook.com to set up your Instagram Business account.');
    }

    console.log('[Instagram] Using Instagram account ID:', instagramAccountId);

    // Create media container
    console.log('[Instagram] Creating media container...');
    const containerData = new URLSearchParams();
    containerData.append('image_url', image);
    containerData.append('caption', content);
    containerData.append('access_token', accessToken);

    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
      method: 'POST',
      body: containerData
    });

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error('[Instagram] Container creation failed:', errorText);

      // Parse error for more specific messaging
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          throw new Error(`Instagram media creation failed: ${errorData.error.message}`);
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
      }

      throw new Error(`Instagram container creation failed: ${containerResponse.status} - ${errorText}`);
    }

    const containerResult = await containerResponse.json();
    console.log('[Instagram] Container created:', containerResult);

    if (!containerResult.id) {
      throw new Error('Instagram container creation succeeded but no container ID returned');
    }

    const containerId = containerResult.id;

    // Publish the media
    console.log('[Instagram] Publishing media container:', containerId);
    const publishData = new URLSearchParams();
    publishData.append('creation_id', containerId);
    publishData.append('access_token', accessToken);

    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`, {
      method: 'POST',
      body: publishData
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error('[Instagram] Publish failed:', errorText);

      // Parse error for more specific messaging
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          throw new Error(`Instagram publish failed: ${errorData.error.message}`);
        }
      } catch (parseError) {
        // If we can't parse the error, use the raw text
      }

      throw new Error(`Instagram publish failed: ${publishResponse.status} - ${errorText}`);
    }

    const result = await publishResponse.json();
    console.log('[Instagram] Post successful:', result);

    if (!result.id) {
      throw new Error('Instagram publish succeeded but no post ID returned');
    }

    return {
      platform: "instagram",
      success: true,
      postId: result.id,
      url: `https://www.instagram.com/p/${result.id}`,
      message: `✅ Successfully posted to Instagram with image!`
    };

  } catch (error) {
    console.error('[Instagram] Error:', error);

    // Provide more helpful error messages
    let errorMessage = error.message;
    if (errorMessage.includes('No Instagram Business account found')) {
      errorMessage += '\n\n🔧 To fix this:\n1. Go to https://business.facebook.com\n2. Connect your Instagram account to a Facebook Page\n3. Convert to Instagram Business or Creator account\n4. Try reconnecting in the app';
    }

    return {
      platform: "instagram",
      success: false,
      error: errorMessage
    };
  }
}

// Reddit posting function
async function postToReddit(content: string, image?: string, credentials?: any, title?: string, subreddit?: string, flair?: string) {
  try {
    console.log('[Reddit] Starting Reddit post process...');
    console.log('[Reddit] Credentials received:', credentials ? 'Yes' : 'No');
    console.log('[Reddit] Title:', title);
    console.log('[Reddit] Subreddit parameter received:', subreddit);
    console.log('[Reddit] Subreddit type:', typeof subreddit);
    console.log('[Reddit] Subreddit truthy?', !!subreddit);
    console.log('[Reddit] Flair parameter received:', flair);
    console.log('[Reddit] Flair type:', typeof flair);
    console.log('[Reddit] Content length:', content.length);

    if (!credentials) {
      throw new Error('Reddit account not connected. Please connect your Reddit account in Settings.');
    }

    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No Reddit access token found. Please reconnect your Reddit account.');
    }

    console.log('[Reddit] Access token found:', accessToken.substring(0, 10) + '...');

    // First, test the token by getting user info
    console.log('[Reddit] Testing access token validity...');
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername'
      }
    });

    if (!userResponse.ok) {
      const userError = await userResponse.text();
      console.error('[Reddit] Token validation failed:', userError);
      throw new Error(`Reddit token invalid: ${userResponse.status} - ${userError}`);
    }

    const userData = await userResponse.json();
    console.log('[Reddit] Token valid for user:', userData.name);

    // Use provided subreddit or fallback to testingground4bots (bot-friendly)
    const targetSubreddit = subreddit || 'testingground4bots';

    // Use provided title or fallback to content substring
    const postTitle = title || content.substring(0, 300);

    let postData: any = {
      kind: 'self',
      title: postTitle, // Use the actual title
      text: content,
      sr: targetSubreddit,
      api_type: 'json'
    };

    // Add flair if provided (using flair_id as per Reddit API documentation)
    if (flair) {
      postData.flair_id = flair;
      console.log('[Reddit] Adding flair_id to post:', flair);
    }

    // If image is provided, post as link
    if (image) {
      postData = {
        kind: 'link',
        title: postTitle, // Use the same title for image posts
        url: image,
        sr: targetSubreddit,
        api_type: 'json'
      };

      // Add flair to image posts too (using flair_id as per Reddit API documentation)
      if (flair) {
        postData.flair_id = flair;
        console.log('[Reddit] Adding flair_id to image post:', flair);
      }
    }

    const formData = new URLSearchParams();
    Object.keys(postData).forEach(key => {
      formData.append(key, postData[key]);
    });

    console.log('[Reddit] Posting to subreddit:', targetSubreddit);
    console.log('[Reddit] Post data:', postData);
    console.log('[Reddit] Form data:', Object.fromEntries(formData));

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    console.log('[Reddit] Response status:', response.status);
    console.log('[Reddit] Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Reddit] API Error Response:', errorText);
      console.error('[Reddit] Request headers:', {
        'Authorization': `Bearer ${accessToken.substring(0, 10)}...`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername',
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      console.error('[Reddit] Request body:', Object.fromEntries(formData));
      console.error('[Reddit] Target subreddit:', targetSubreddit);
      console.error('[Reddit] Post title:', postTitle);

      // Provide helpful error messages for common issues
      let errorMessage = `Reddit posting failed (${response.status})`;

      if (response.status === 403) {
        errorMessage = "Reddit posting forbidden. Please check: 1) Reddit account is connected, 2) You have permission to post to this subreddit, 3) Try 'test' or 'testingground4bots' subreddit.";
      } else if (response.status === 401) {
        errorMessage = "Reddit authentication failed. Please reconnect your Reddit account in Settings.";
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.json?.errors && errorJson.json.errors.length > 0) {
            errorMessage = `Reddit error: ${errorJson.json.errors[0][1]}`;
          }
        } catch (parseError) {
          errorMessage += ` - ${errorText}`;
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('[Reddit] Post successful:', result);

    if (result.json?.errors && result.json.errors.length > 0) {
      throw new Error(`Reddit error: ${result.json.errors[0][1]}`);
    }

    const postUrl = result.json?.data?.url || `https://reddit.com/r/${targetSubreddit}`;

    return {
      platform: "reddit",
      success: true,
      postId: result.json?.data?.name || 'unknown',
      url: postUrl,
      message: `✅ Successfully posted to Reddit r/${targetSubreddit}! ${image ? 'Image included.' : ''}`
    };

  } catch (error) {
    console.error('[Reddit] Error:', error);

    // If Reddit is not connected, provide a helpful message
    if (error.message.includes('not connected') || error.message.includes('No Reddit access token')) {
      return {
        platform: "reddit",
        success: false,
        error: "Reddit account not connected. Please connect your Reddit account in Settings → Social Media Connections.",
        needsConnection: true
      };
    }

    return {
      platform: "reddit",
      success: false,
      error: error.message
    };
  }
}


async function postToSocialMedia(platform: string, content: string, image?: string, credentials?: any, title?: string, subreddit?: string, flair?: string) {
  // Optimize content for the specific platform
  const optimizedContent = optimizeContentForPlatform(content, platform);

  console.log(`[${platform}] Posting with real OAuth credentials`);
  console.log(`[${platform}] Content length: ${optimizedContent.length}`);
  console.log(`[${platform}] Has image: ${!!image}`);

  switch (platform.toLowerCase()) {
    case "twitter":
      return await postToTwitter(optimizedContent, image, credentials);
    case "linkedin":
      return await postToLinkedIn(optimizedContent, image, credentials);
    case "facebook":
      return await postToFacebook(optimizedContent, image, credentials);
    case "instagram":
      return await postToInstagram(optimizedContent, image, credentials);
    case "reddit":
      return await postToReddit(optimizedContent, image, credentials, title, subreddit, flair);
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}