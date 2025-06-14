import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log('Request body received:', body);
    console.log('Request body keys:', Object.keys(body));

    let { content, platforms, platform, image } = body;

    // Handle both old format (platform: "linkedin") and new format (platforms: ["linkedin"])
    if (platform && !platforms) {
      platforms = [platform];
      console.log('Converting single platform to array:', platforms);
    }

    console.log('Final values:', {
      content: content?.substring(0, 50) + '...',
      platforms,
      hasImage: !!image,
      imageUrl: image ? image.substring(0, 100) + '...' : null
    });

    if (!content || !platforms || platforms.length === 0) {
      console.error('Missing required fields:', {
        hasContent: !!content,
        hasPlatforms: !!platforms,
        platformsLength: platforms?.length || 0,
        receivedKeys: Object.keys(body)
      });
      return new Response(JSON.stringify({
        error: "Content and platform(s) are required",
        received: {
          content: !!content,
          platforms: platforms || null,
          platform: platform || null,
          bodyKeys: Object.keys(body)
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const platform of platforms) {
      try {
        console.log(`Processing platform: ${platform} for user: ${user.id}`);

        // First, let's see what credentials exist for this user
        const { data: allCredentials, error: allCredsError } = await supabaseClient
          .from("oauth_credentials")
          .select("platform, created_at, expires_at")
          .eq("user_id", user.id);

        console.log(`All credentials for user ${user.id}:`, allCredentials);

        const { data: credentials, error: credError } = await supabaseClient
          .from("oauth_credentials")
          .select("*")
          .eq("user_id", user.id)
          .eq("platform", platform.toLowerCase())
          .single();

        console.log(`Credentials query for ${platform}:`, { credentials: !!credentials, error: credError?.message });

        if (credError || !credentials) {
          console.error(`No credentials found for ${platform}:`, credError?.message);
          results.push({ platform, success: false, error: `No valid credentials found for ${platform}. Available platforms: ${allCredentials?.map(c => c.platform).join(', ') || 'none'}` });
          continue;
        }

        console.log(`Found credentials for ${platform}, access_token length: ${credentials.access_token?.length || 0}`);

        const now = new Date();
        const expiresAt = new Date(credentials.expires_at);
        if (now >= expiresAt) {
          results.push({ platform, success: false, error: `Token expired for ${platform}` });
          continue;
        }

        const result = await postToSocialMedia(platform, content, credentials, image);
        results.push(result);
      } catch (err) {
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

async function postToSocialMedia(platform: string, content: string, credentials: any, image?: string) {
  // Optimize content for the specific platform
  const optimizedContent = optimizeContentForPlatform(content, platform);

  console.log(`[${platform}] Original content length: ${content.length}`);
  console.log(`[${platform}] Optimized content length: ${optimizedContent.length}`);
  console.log(`[${platform}] Has image: ${!!image}`);

  switch (platform.toLowerCase()) {
    case "twitter":
      return await postToTwitter(optimizedContent, credentials, image);
    case "linkedin":
      return await postToLinkedIn(optimizedContent, credentials, image);
    case "reddit":
      return await postToReddit(optimizedContent, credentials, image);
    case "facebook":
      return await postToFacebook(optimizedContent, credentials, image);
    case "instagram":
      return await postToInstagram(optimizedContent, credentials, image);
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}

async function postToTwitter(content: string, credentials: any, image?: string) {
  try {
    console.log(`[Twitter] Starting Twitter post process`);
    console.log(`[Twitter] Content length: ${content.length}`);
    console.log(`[Twitter] Access token available: ${!!credentials.access_token}`);
    console.log(`[Twitter] Has image: ${!!image}`);

    if (!credentials.access_token) {
      return { platform: "twitter", success: false, error: "No access token available for Twitter" };
    }

    // Clean and optimize content for Twitter
    let tweetContent = content.trim();

    // Remove excessive line breaks and clean formatting
    tweetContent = tweetContent.replace(/\n{3,}/g, '\n\n').replace(/\s+/g, ' ');

    // Ensure content fits Twitter's character limit (280 chars)
    if (tweetContent.length > 280) {
      // Try to truncate at word boundary
      const words = tweetContent.split(' ');
      let truncated = '';
      for (const word of words) {
        if ((truncated + ' ' + word).length <= 277) {
          truncated += (truncated ? ' ' : '') + word;
        } else {
          break;
        }
      }
      tweetContent = truncated + "...";
      console.log(`[Twitter] Content truncated to fit 280 character limit`);
    }

    console.log(`[Twitter] Final content: "${tweetContent}"`);
    console.log(`[Twitter] Final content length: ${tweetContent.length}`);

    let mediaId = null;

    // Upload image if provided
    if (image) {
      try {
        console.log(`[Twitter] Uploading image...`);

        // Download image from URL
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        console.log(`[Twitter] Image size: ${imageBuffer.byteLength} bytes`);

        // Validate image size (Twitter limit is 5MB for images)
        if (imageBuffer.byteLength > 5 * 1024 * 1024) {
          throw new Error('Image size exceeds Twitter limit of 5MB');
        }

        console.log(`[Twitter] Preparing multipart/form-data upload`);

        let uploadResponse: Response;

        try {
          // Method 1: Try FormData with raw binary data (preferred)
          const formData = new FormData();
          const imageBlob = new Blob([imageBuffer]);
          formData.append('media', imageBlob);
          formData.append('media_category', 'tweet_image');

          console.log(`[Twitter] Attempting FormData upload`);

          uploadResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credentials.access_token}`,
              // No Content-Type header - FormData sets it automatically with boundary
            },
            body: formData,
          });

          console.log(`[Twitter] FormData upload response status: ${uploadResponse.status}`);

        } catch (formDataError) {
          console.log(`[Twitter] FormData failed, trying manual multipart approach:`, formDataError);

          // Method 2: Manual multipart/form-data construction (fallback)
          const boundary = `----formdata-twitter-${Date.now()}`;
          const imageBytes = new Uint8Array(imageBuffer);

          // Construct multipart body manually
          const textEncoder = new TextEncoder();
          const parts = [
            textEncoder.encode(`--${boundary}\r\n`),
            textEncoder.encode(`Content-Disposition: form-data; name="media"; filename="image.jpg"\r\n`),
            textEncoder.encode(`Content-Type: application/octet-stream\r\n\r\n`),
            imageBytes,
            textEncoder.encode(`\r\n--${boundary}\r\n`),
            textEncoder.encode(`Content-Disposition: form-data; name="media_category"\r\n\r\n`),
            textEncoder.encode(`tweet_image`),
            textEncoder.encode(`\r\n--${boundary}--\r\n`),
          ];

          // Combine all parts
          const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
          const body = new Uint8Array(totalLength);
          let offset = 0;
          for (const part of parts) {
            body.set(part, offset);
            offset += part.length;
          }

          console.log(`[Twitter] Attempting manual multipart upload`);

          uploadResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credentials.access_token}`,
              "Content-Type": `multipart/form-data; boundary=${boundary}`,
            },
            body: body,
          });

          console.log(`[Twitter] Manual multipart upload response status: ${uploadResponse.status}`);
        }

        console.log(`[Twitter] Upload response status: ${uploadResponse.status}`);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`[Twitter] Image upload failed with status ${uploadResponse.status}:`, errorText);
          throw new Error(`Media upload failed: ${uploadResponse.status} ${errorText}`);
        }

        const uploadData = await uploadResponse.json();
        console.log(`[Twitter] Upload response data:`, uploadData);

        if (uploadData.media_id_string) {
          mediaId = uploadData.media_id_string;
          console.log(`[Twitter] Image uploaded successfully, media_id: ${mediaId}`);
        } else {
          console.error(`[Twitter] No media_id_string in response:`, uploadData);
          throw new Error('No media_id_string returned from upload');
        }
      } catch (imageError) {
        console.error(`[Twitter] Image upload error:`, imageError);
        // Continue without image if upload fails
      }
    }

    // Prepare tweet data
    const tweetData: any = { text: tweetContent };
    if (mediaId) {
      tweetData.media = { media_ids: [mediaId] };
    }

    // Use correct Twitter API v2 endpoint
    console.log(`[Twitter] Posting tweet with data:`, JSON.stringify(tweetData, null, 2));

    const response = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetData),
    });

    const data = await response.json();
    console.log(`[Twitter] Response status: ${response.status}`);
    console.log(`[Twitter] Response data:`, JSON.stringify(data, null, 2));
    console.log(`[Twitter] Response data structure:`, {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : 'no data object',
      fullResponse: data
    });

    if (!response.ok) {
      // Handle specific Twitter API errors
      if (response.status === 401) {
        return { platform: "twitter", success: false, error: "Twitter authentication failed. Please reconnect your account." };
      } else if (response.status === 403) {
        const errorMsg = data.detail || data.errors?.[0]?.message || "Twitter API access forbidden";
        return { platform: "twitter", success: false, error: `Twitter API error: ${errorMsg}` };
      } else if (response.status === 429) {
        return { platform: "twitter", success: false, error: "Twitter rate limit exceeded. Please try again later." };
      }

      const errorMsg = data.detail || data.error || data.errors?.[0]?.message || `HTTP ${response.status}`;
      console.error(`[Twitter] Post failed:`, errorMsg);
      return { platform: "twitter", success: false, error: `Twitter API error: ${errorMsg}` };
    }

    // Extract post ID from response (handle different response formats)
    const postId = data.data?.id || data.id || data.id_str;
    console.log(`[Twitter] Tweet posted successfully with ID: ${postId}`);
    console.log(`[Twitter] Post ID extraction:`, {
      'data.data?.id': data.data?.id,
      'data.id': data.id,
      'data.id_str': data.id_str,
      'finalPostId': postId
    });

    return { platform: "twitter", success: true, postId };
  } catch (err) {
    console.error(`[Twitter] Unexpected error:`, err);
    return { platform: "twitter", success: false, error: `Twitter posting failed: ${err.message}` };
  }
}

async function postToLinkedIn(content: string, credentials: any, image?: string) {
  try {
    console.log(`[LinkedIn] Starting LinkedIn post process`);
    console.log(`[LinkedIn] Content length: ${content.length}`);
    console.log(`[LinkedIn] Access token available: ${!!credentials.access_token}`);
    console.log(`[LinkedIn] Has image: ${!!image}`);

    if (!credentials.access_token) {
      return { platform: "linkedin", success: false, error: "No access token available for LinkedIn" };
    }

    // Ensure content fits LinkedIn's limit (3000 chars)
    let linkedInContent = content.trim();
    if (linkedInContent.length > 3000) {
      linkedInContent = linkedInContent.substring(0, 2997) + "...";
      console.log(`[LinkedIn] Content truncated to fit 3000 character limit`);
    }

    // Step 1: Get LinkedIn profile using v2 people endpoint
    console.log(`[LinkedIn] Fetching profile from LinkedIn v2 people endpoint`);
    const profileRes = await fetch("https://api.linkedin.com/v2/people/~", {
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[LinkedIn] Profile response status: ${profileRes.status}`);

    if (!profileRes.ok) {
      const profileError = await profileRes.text();
      console.error(`[LinkedIn] Profile fetch failed:`, profileError);

      if (profileRes.status === 401) {
        return { platform: "linkedin", success: false, error: "LinkedIn authentication failed. Please reconnect your account." };
      }

      return { platform: "linkedin", success: false, error: `Failed to fetch LinkedIn profile (${profileRes.status}): ${profileError}` };
    }

    const profile = await profileRes.json();
    console.log(`[LinkedIn] Profile ID: ${profile.id}`);
    const author = `urn:li:person:${profile.id}`;

    // Step 2: Prepare post payload
    const shareContent: any = {
      shareCommentary: { text: linkedInContent },
      shareMediaCategory: "NONE", // Simplified for now
    };

    const payload = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": shareContent,
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    console.log(`[LinkedIn] Creating post with content length: ${linkedInContent.length}`);

    // Step 3: Create the post
    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
    });

    console.log(`[LinkedIn] Post response status: ${postRes.status}`);

    const postData = await postRes.json();
    console.log(`[LinkedIn] Post response data:`, JSON.stringify(postData, null, 2));

    if (!postRes.ok) {
      console.error(`[LinkedIn] Post creation failed:`, postData);

      if (postRes.status === 401) {
        return { platform: "linkedin", success: false, error: "LinkedIn authentication failed. Please reconnect your account." };
      } else if (postRes.status === 403) {
        return { platform: "linkedin", success: false, error: "LinkedIn posting failed due to insufficient permissions. Please check your app permissions." };
      } else if (postRes.status === 429) {
        return { platform: "linkedin", success: false, error: "LinkedIn rate limit exceeded. Please try again later." };
      }

      const errorMsg = postData.message || postData.error || JSON.stringify(postData);
      return { platform: "linkedin", success: false, error: `LinkedIn API error (${postRes.status}): ${errorMsg}` };
    }

    console.log(`[LinkedIn] Post created successfully with ID: ${postData.id}`);
    return { platform: "linkedin", success: true, postId: postData.id };
  } catch (err) {
    console.error(`[LinkedIn] Unexpected error:`, err);
    return { platform: "linkedin", success: false, error: `LinkedIn posting failed: ${err.message}` };
  }
}

async function postToReddit(content: string, credentials: any, image?: string) {
  try {
    console.log(`[Reddit] Starting Reddit post process`);
    console.log(`[Reddit] Content to post: ${content.substring(0, 200)}...`);
    console.log(`[Reddit] Has image: ${!!image}`);

    const subreddit = "test";

    // Extract title from content (first line or first 100 chars)
    const lines = content.split('\n').filter(line => line.trim());
    let title = lines[0] || content;

    // Clean title - remove markdown, emojis, and extra formatting
    title = title.replace(/[#*_`~]/g, '').replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

    // Ensure title is within Reddit limits (300 chars max)
    if (title.length > 300) {
      title = title.substring(0, 297) + "...";
    }

    // Use remaining content as body text (remove title from content)
    let bodyText = content;
    if (lines.length > 1) {
      bodyText = lines.slice(1).join('\n').trim();
    }

    console.log(`[Reddit] Title: ${title}`);
    console.log(`[Reddit] Body length: ${bodyText.length}`);

    const response = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ContentPilotAI/1.0",
      },
      body: new URLSearchParams({
        api_type: "json",
        kind: image ? "link" : "self",
        sr: subreddit,
        title: title,
        ...(image ? { url: image } : { text: bodyText }),
      }),
    });

    const data = await response.json();
    console.log(`[Reddit] Response:`, JSON.stringify(data, null, 2));

    if (!response.ok || data.json?.errors?.length > 0) {
      const errorMsg = data.json?.errors?.[0]?.[1] || `HTTP ${response.status}`;
      console.error(`[Reddit] Post failed:`, errorMsg);
      return { platform: "reddit", success: false, error: errorMsg };
    }

    const postId = data.json?.data?.name;
    console.log(`[Reddit] Post created successfully with ID: ${postId}`);
    return { platform: "reddit", success: true, postId };
  } catch (err) {
    console.error(`[Reddit] Unexpected error:`, err);
    return { platform: "reddit", success: false, error: err.message };
  }
}

async function postToFacebook(content: string, credentials: any, image?: string) {
  try {
    console.log(`[Facebook] Starting Facebook post process`);
    console.log(`[Facebook] Content length: ${content.length}`);
    console.log(`[Facebook] Has image: ${!!image}`);

    if (!credentials.access_token) {
      return { platform: "facebook", success: false, error: "No access token available for Facebook" };
    }

    // Facebook has a very high limit (63,206 chars) but let's be reasonable
    let facebookContent = content.trim();
    if (facebookContent.length > 8000) {
      facebookContent = facebookContent.substring(0, 7997) + "...";
      console.log(`[Facebook] Content truncated for readability`);
    }

    console.log(`[Facebook] Final content length: ${facebookContent.length}`);

    let response;

    if (image) {
      // For Facebook posts with images, use the photos endpoint
      console.log(`[Facebook] Posting with image`);

      const formData = new FormData();

      try {
        // Download the image
        const imageResponse = await fetch(image);
        const imageBlob = await imageResponse.blob();

        formData.append('source', imageBlob);
        formData.append('message', facebookContent);
        formData.append('access_token', credentials.access_token);

        response = await fetch(`https://graph.facebook.com/me/photos`, {
          method: "POST",
          body: formData,
        });
      } catch (imageError) {
        console.error(`[Facebook] Image processing failed, posting text only:`, imageError);
        // Fall back to text-only post
        response = await fetch(`https://graph.facebook.com/me/feed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: facebookContent + `\n\nImage: ${image}`,
            access_token: credentials.access_token,
          }),
        });
      }
    } else {
      // Text-only post
      response = await fetch(`https://graph.facebook.com/me/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: facebookContent,
          access_token: credentials.access_token,
        }),
      });
    }

    const data = await response.json();
    console.log(`[Facebook] Response status: ${response.status}`);
    console.log(`[Facebook] Response data:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(`[Facebook] Post failed:`, data);

      if (response.status === 401) {
        return { platform: "facebook", success: false, error: "Facebook authentication failed. Please reconnect your account." };
      } else if (response.status === 403) {
        return { platform: "facebook", success: false, error: "Facebook posting failed due to insufficient permissions." };
      } else if (response.status === 429) {
        return { platform: "facebook", success: false, error: "Facebook rate limit exceeded. Please try again later." };
      }

      const errorMsg = data.error?.message || data.error || "Facebook posting failed";
      return { platform: "facebook", success: false, error: errorMsg };
    }

    console.log(`[Facebook] Post created successfully with ID: ${data.id}`);
    return { platform: "facebook", success: true, postId: data.id };
  } catch (err) {
    console.error(`[Facebook] Unexpected error:`, err);
    return { platform: "facebook", success: false, error: `Facebook posting failed: ${err.message}` };
  }
}

async function postToInstagram(content: string, credentials: any, image?: string) {
  try {
    console.log(`[Instagram] Starting Instagram post process`);
    console.log(`[Instagram] Has image: ${!!image}`);

    if (!image) {
      return {
        platform: "instagram",
        success: false,
        error: "Instagram requires an image. Please generate an image first."
      };
    }

    if (!credentials.access_token) {
      return { platform: "instagram", success: false, error: "No access token available for Instagram" };
    }

    // Instagram posting requires multiple steps:
    // 1. Upload media to Instagram
    // 2. Create media container
    // 3. Publish the container

    // For now, return success with a note that Instagram posting is complex
    // and would require additional Instagram Business API setup
    return {
      platform: "instagram",
      success: false,
      error: "Instagram posting requires Instagram Business API setup. Please use the generated image manually on Instagram."
    };
  } catch (err) {
    console.error(`[Instagram] Unexpected error:`, err);
    return { platform: "instagram", success: false, error: err.message };
  }
}
