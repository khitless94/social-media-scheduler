import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    console.log('Request body received:', body);

    let { content, platforms, platform, image } = body;

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

// Twitter posting function
async function postToTwitter(content: string, image?: string, credentials?: any) {
  try {
    const accessToken = credentials.access_token;
    if (!accessToken) {
      throw new Error('No Twitter access token found');
    }

    let mediaId = null;

    // Upload image if provided
    if (image) {
      try {
        console.log('[Twitter] Starting image upload process...');

        // Download image
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        console.log('[Twitter] Image downloaded, size:', imageBuffer.byteLength);

        // For now, skip media upload and post without image
        // TODO: Implement OAuth 1.0a for media upload
        console.log('[Twitter] Media upload requires OAuth 1.0a - posting without image for now');

        // Note: Twitter media upload requires OAuth 1.0a authentication
        // The current OAuth 2.0 Bearer token won't work for media uploads
        // This needs to be implemented with proper OAuth 1.0a flow

      } catch (imageError) {
        console.error('[Twitter] Image upload error:', imageError);
        // Continue without image
      }
    }

    // Post tweet using Twitter API v2
    const tweetData: any = {
      text: content
    };

    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId]
      };
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
      const errorText = await response.text();
      console.error('[Twitter] API Error:', errorText);
      throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[Twitter] Post successful:', result);

    return {
      platform: "twitter",
      success: true,
      postId: result.data.id,
      url: `https://twitter.com/user/status/${result.data.id}`,
      message: `✅ Successfully posted to Twitter! ${mediaId ? 'Image included.' : image ? '⚠️ Posted without image (Twitter media upload requires additional OAuth setup)' : ''}`
    };

  } catch (error) {
    console.error('[Twitter] Error:', error);
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

    // Get Instagram business account ID
    const accountResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);

    if (!accountResponse.ok) {
      throw new Error(`Failed to get Instagram account: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();

    if (!accountData.data || accountData.data.length === 0) {
      throw new Error('No Instagram business account found');
    }

    const instagramAccountId = accountData.data[0].instagram_business_account?.id;
    if (!instagramAccountId) {
      throw new Error('No Instagram business account linked to Facebook page');
    }

    // Create media container
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
      throw new Error(`Instagram container creation failed: ${containerResponse.status} - ${errorText}`);
    }

    const containerResult = await containerResponse.json();
    const containerId = containerResult.id;

    // Publish the media
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
      throw new Error(`Instagram publish failed: ${publishResponse.status} - ${errorText}`);
    }

    const result = await publishResponse.json();
    console.log('[Instagram] Post successful:', result);

    return {
      platform: "instagram",
      success: true,
      postId: result.id,
      url: `https://www.instagram.com/p/${result.id}`,
      message: `✅ Successfully posted to Instagram with image!`
    };

  } catch (error) {
    console.error('[Instagram] Error:', error);
    return {
      platform: "instagram",
      success: false,
      error: error.message
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
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}