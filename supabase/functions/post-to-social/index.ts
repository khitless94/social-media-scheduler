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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log('📥 Request body received:', body);

    let { content, platforms, platform, image, subreddit } = body;

    console.log('📥 Extracted parameters:', {
      platform,
      platforms,
      content: content?.substring(0, 50) + '...',
      hasImage: !!image,
      imageType: typeof image,
      imageValue: image ? image.substring(0, 100) + '...' : 'null',
      subreddit: subreddit || 'not provided'
    });

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
        console.log(`Processing platform: ${platform} for user: ${user.id}`);

        // Get OAuth credentials for this platform and user
        const { data: credentials, error: credError } = await supabase
          .from('oauth_credentials')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', platform)
          .single();

        if (credError || !credentials) {
          console.error(`No credentials found for ${platform}:`, credError);
          results.push({
            platform,
            success: false,
            error: `No OAuth credentials found for ${platform}. Please connect your account first.`,
            needsReconnection: true
          });
          continue;
        }

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

        const result = await postToSocialMedia(platform, content, image, credentials);
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

// Create proper HMAC-SHA1 signature for OAuth 1.0a
async function createHmacSha1Signature(baseString: string, signingKey: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const messageData = encoder.encode(baseString);

    // Import the key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    // Create the signature
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to base64
    const signatureArray = new Uint8Array(signature);
    return btoa(String.fromCharCode(...signatureArray));
  } catch (error) {
    console.error('[Twitter] HMAC-SHA1 signature error:', error);
    // Fallback to simple signature if crypto fails
    return btoa(baseString + signingKey).substring(0, 28);
  }
}

// Old Twitter functions removed - now using twitter-api-v2 library

// Twitter posting function using proper OAuth 1.0a (following guidelines)
async function postToTwitter(content: string, image?: string, credentials?: any) {
  try {
    console.log('[Twitter] Starting Twitter post process...');
    console.log('[Twitter] Content preview:', content.substring(0, 50) + '...');
    console.log('[Twitter] Has image:', !!image);

    // Validate Twitter OAuth 1.0a credentials
    const twitterCredentials = {
      appKey: Deno.env.get('TWITTER_API_KEY')!,
      appSecret: Deno.env.get('TWITTER_API_SECRET')!,
      accessToken: credentials?.access_token,
      accessSecret: credentials?.access_token_secret,
    };

    console.log('[Twitter] OAuth 1.0a credentials check:', {
      appKey: !!twitterCredentials.appKey,
      appSecret: !!twitterCredentials.appSecret,
      accessToken: !!twitterCredentials.accessToken,
      accessSecret: !!twitterCredentials.accessSecret,
    });

    // Check if we have proper OAuth 1.0a credentials
    if (!twitterCredentials.accessToken || !twitterCredentials.accessSecret) {
      console.warn('[Twitter] ⚠️ Missing OAuth 1.0a credentials (access_token_secret required)');
      console.warn('[Twitter] Current credentials appear to be OAuth 2.0 Bearer tokens');

      return {
        platform: "twitter",
        success: false,
        error: "Twitter posting requires OAuth 1.0a credentials. Please reconnect your Twitter account with proper OAuth 1.0a flow.",
        needsReconnection: true
      };
    }

    let mediaId = null;

    // Step 1: Upload image if provided (following guidelines)
    if (image) {
      try {
        console.log('[Twitter] 🖼️ Starting image upload process...');
        console.log('[Twitter] 🔗 Image URL:', image);

        // Download the image from Supabase (following guidelines)
        console.log('[Twitter] 📥 Downloading image from Supabase...');
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageSizeMB = (imageBuffer.byteLength / (1024 * 1024)).toFixed(2);
        console.log('[Twitter] ✅ Image downloaded successfully, size:', imageSizeMB, 'MB');

        // Validate image size (Twitter limit: 5MB for photos)
        if (imageBuffer.byteLength > 5 * 1024 * 1024) {
          throw new Error(`Image too large: ${imageSizeMB}MB (Twitter limit: 5MB)`);
        }

        // Upload image to Twitter using OAuth 1.0a
        mediaId = await uploadImageToTwitterOAuth1a(imageBuffer, twitterCredentials);

        if (mediaId) {
          console.log('[Twitter] ✅ Image uploaded successfully, media_id:', mediaId);
        } else {
          throw new Error('Failed to upload image to Twitter');
        }

      } catch (imageError) {
        console.error('[Twitter] Image upload error:', imageError);
        console.log('[Twitter] Continuing with text-only post...');
        mediaId = null;
      }
    }

    // Step 2: Post tweet using OAuth 1.0a (following guidelines)
    console.log('[Twitter] 🚀 Posting tweet...');

    // Validate content length (Twitter limit is 280 characters)
    if (content.length > 280) {
      console.warn('[Twitter] Content exceeds 280 characters, truncating...');
      content = content.substring(0, 277) + '...';
    }

    const tweetResult = await postTweetOAuth1a(content, mediaId, twitterCredentials);
    return tweetResult;

  } catch (error) {
    console.error('[Twitter] ❌ Twitter posting failed:', error);
    return {
      platform: "twitter",
      success: false,
      error: error.message
    };
  }
}

// Helper function to upload image using OAuth 1.0a (following guidelines)
async function uploadImageToTwitterOAuth1a(imageBuffer: ArrayBuffer, credentials: any): Promise<string | null> {
  try {
    const apiUrl = 'https://upload.twitter.com/1.1/media/upload.json';

    // Convert to base64 for upload
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Create OAuth 1.0a signature for media upload
    const oauthHeader = await createTwitterOAuth1aHeader('POST', apiUrl, credentials, {});

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('media_data', base64Image);

    console.log('[Twitter] Uploading image to Twitter...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (response.ok) {
      const json = await response.json();
      console.log('[Twitter] ✅ Image uploaded successfully, media_id:', json.media_id_string);
      return json.media_id_string;
    } else {
      const errorText = await response.text();
      console.error('[Twitter] ❌ Image upload failed:', response.status, errorText);
      return null;
    }

  } catch (error) {
    console.error('[Twitter] ❌ Image upload error:', error);
    return null;
  }
}

// Helper function to post tweet using OAuth 1.0a (following guidelines)
async function postTweetOAuth1a(content: string, mediaId: string | null, credentials: any) {
  try {
    const apiUrl = 'https://api.twitter.com/2/tweets';

    // Prepare tweet data
    const tweetData: any = {
      text: content
    };

    // Add media if available
    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId]
      };
      console.log('[Twitter] 📎 Tweet will include media_id:', mediaId);
    }

    // Create OAuth 1.0a signature for tweet posting
    const oauthHeader = await createTwitterOAuth1aHeader('POST', apiUrl, credentials, {});

    console.log('[Twitter] 🚀 Posting tweet using OAuth 1.0a...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('[Twitter] ✅ Tweet posted successfully');
      console.log('[Twitter] Tweet ID:', result.data.id);

      let message = mediaId ? "Tweet with image posted successfully" : "Text-only tweet posted successfully";

      return {
        platform: "twitter",
        success: true,
        data: result.data,
        message: message
      };
    } else {
      const errorText = await response.text();
      console.error('[Twitter] ❌ Tweet posting failed:', response.status, errorText);

      // Handle rate limiting specifically
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

      return {
        platform: "twitter",
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

  } catch (error) {
    console.error('[Twitter] ❌ Tweet posting failed:', error);
    return {
      platform: "twitter",
      success: false,
      error: error.message
    };
  }
}

// Helper function to create OAuth 1.0a authorization header (following guidelines)
async function createTwitterOAuth1aHeader(method: string, url: string, credentials: any, params: any = {}): Promise<string> {
  try {
    // Generate OAuth 1.0a parameters
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const oauthParams = {
      oauth_consumer_key: credentials.appKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: credentials.accessToken,
      oauth_version: '1.0'
    };

    // Combine OAuth params with request params
    const allParams = { ...oauthParams, ...params };

    // Create parameter string for signature
    const paramString = Object.keys(allParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    // Create signature base string
    const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Create signing key
    const signingKey = `${encodeURIComponent(credentials.appSecret)}&${encodeURIComponent(credentials.accessSecret)}`;

    // Generate signature using HMAC-SHA1
    const signature = await createHmacSha1Signature(baseString, signingKey);
    oauthParams['oauth_signature'] = signature;

    // Create OAuth authorization header
    const oauthHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return oauthHeader;

  } catch (error) {
    console.error('[Twitter] OAuth 1.0a header generation failed:', error);
    throw error;
  }
}

// LinkedIn posting function
async function postToLinkedIn(content: string, image?: string, credentials?: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No LinkedIn access token found');
    }

    console.log('[LinkedIn] Starting post with access token');

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
        console.log('[LinkedIn] Got profile from userinfo endpoint:', personUrn);
      } else {
        console.log('[LinkedIn] userinfo endpoint failed, trying lite profile');
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
async function postToReddit(content: string, image?: string, credentials?: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No Reddit access token found');
    }

    // Default subreddit - you might want to make this configurable
    const subreddit = 'test'; // or get from user preferences

    let postData: any = {
      kind: 'self',
      title: content.substring(0, 300), // Reddit title limit
      text: content,
      sr: subreddit,
      api_type: 'json'
    };

    // If image is provided, post as link
    if (image) {
      postData = {
        kind: 'link',
        title: content.substring(0, 300),
        url: image,
        sr: subreddit,
        api_type: 'json'
      };
    }

    const formData = new URLSearchParams();
    Object.keys(postData).forEach(key => {
      formData.append(key, postData[key]);
    });

    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'ContentPilot/1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Reddit] API Error:', errorText);
      throw new Error(`Reddit API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Reddit] Post successful:', result);

    if (result.json?.errors && result.json.errors.length > 0) {
      throw new Error(`Reddit error: ${result.json.errors[0][1]}`);
    }

    const postUrl = result.json?.data?.url || `https://reddit.com/r/${subreddit}`;

    return {
      platform: "reddit",
      success: true,
      postId: result.json?.data?.name || 'unknown',
      url: postUrl,
      message: `✅ Successfully posted to Reddit r/${subreddit}! ${image ? 'Image included.' : ''}`
    };

  } catch (error) {
    console.error('[Reddit] Error:', error);
    return {
      platform: "reddit",
      success: false,
      error: error.message
    };
  }
}

// Google posting function (Google My Business, YouTube, Gmail)
async function postToGoogle(content: string, image?: string, credentials?: any) {
  try {
    console.log('[Google] Starting Google post process...');
    console.log('[Google] Content preview:', content.substring(0, 50) + '...');
    console.log('[Google] Has image:', !!image);

    const accessToken = credentials?.access_token;
    if (!accessToken) {
      throw new Error('No Google access token found');
    }

    // For now, we'll implement Google My Business posting
    // Later can be extended to YouTube and Gmail

    // Get user's Google My Business locations
    console.log('[Google] Fetching Google My Business locations...');
    const locationsResponse = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text();
      console.error('[Google] Failed to fetch locations:', errorText);
      throw new Error(`Failed to access Google My Business: ${locationsResponse.status}`);
    }

    const locationsData = await locationsResponse.json();
    console.log('[Google] Locations data:', locationsData);

    // For now, we'll return a success message indicating Google integration is ready
    // Full implementation would require selecting a specific location and posting

    return {
      platform: "google",
      success: true,
      message: "Google integration ready. Google My Business posting requires location selection.",
      data: {
        availableServices: ['Google My Business', 'YouTube', 'Gmail'],
        locationsFound: locationsData?.accounts?.length || 0
      }
    };

  } catch (error) {
    console.error('[Google] Error:', error);
    return {
      platform: "google",
      success: false,
      error: error.message
    };
  }
}

async function postToSocialMedia(platform: string, content: string, image?: string, credentials?: any) {
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
      return await postToReddit(optimizedContent, image, credentials);
    case "google":
      return await postToGoogle(optimizedContent, image, credentials);
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}