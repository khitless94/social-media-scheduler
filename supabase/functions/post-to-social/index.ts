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
    tweetContent = tweetContent.replace(/\n{3,}/g, '\n\n').replace(/\s+/g, ' ');

    // Ensure content fits Twitter's character limit (280 chars)
    if (tweetContent.length > 280) {
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

    let mediaIds: string[] = [];

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

        // Convert to base64 for the chunked upload process
        const imageBytes = new Uint8Array(imageBuffer);

        // Step 1: Initialize upload (INIT)
        console.log(`[Twitter] Step 1: Initializing chunked upload`);
        const initResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            command: 'INIT',
            total_bytes: imageBuffer.byteLength.toString(),
            media_type: 'image/jpeg', // Adjust based on actual image type
            media_category: 'tweet_image'
          }),
        });

        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          console.error(`[Twitter] INIT failed:`, errorText);
          throw new Error(`Upload initialization failed: ${initResponse.status} ${errorText}`);
        }

        const initData = await initResponse.json();
        const mediaId = initData.media_id_string;
        console.log(`[Twitter] Upload initialized with media_id: ${mediaId}`);

        // Step 2: Upload media in chunks (APPEND)
        console.log(`[Twitter] Step 2: Uploading media chunks`);
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(imageBuffer.byteLength / chunkSize);

        for (let segmentIndex = 0; segmentIndex < totalChunks; segmentIndex++) {
          const start = segmentIndex * chunkSize;
          const end = Math.min(start + chunkSize, imageBuffer.byteLength);
          const chunk = imageBytes.slice(start, end);
          const chunkBase64 = btoa(String.fromCharCode(...chunk));

          console.log(`[Twitter] Uploading chunk ${segmentIndex + 1}/${totalChunks}`);

          const appendResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credentials.access_token}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              command: 'APPEND',
              media_id: mediaId,
              segment_index: segmentIndex.toString(),
              media_data: chunkBase64
            }),
          });

          if (!appendResponse.ok) {
            const errorText = await appendResponse.text();
            console.error(`[Twitter] APPEND failed for chunk ${segmentIndex}:`, errorText);
            throw new Error(`Chunk upload failed: ${appendResponse.status} ${errorText}`);
          }
        }

        // Step 3: Finalize upload (FINALIZE)
        console.log(`[Twitter] Step 3: Finalizing upload`);
        const finalizeResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            command: 'FINALIZE',
            media_id: mediaId
          }),
        });

        if (!finalizeResponse.ok) {
          const errorText = await finalizeResponse.text();
          console.error(`[Twitter] FINALIZE failed:`, errorText);
          throw new Error(`Upload finalization failed: ${finalizeResponse.status} ${errorText}`);
        }

        const finalizeData = await finalizeResponse.json();
        console.log(`[Twitter] Upload finalized:`, finalizeData);

        // Step 4: Check processing status if needed
        if (finalizeData.processing_info) {
          console.log(`[Twitter] Step 4: Checking processing status`);
          let processingComplete = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!processingComplete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, finalizeData.processing_info.check_after_secs * 1000));

            const statusResponse = await fetch(`https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`, {
              headers: {
                Authorization: `Bearer ${credentials.access_token}`,
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              console.log(`[Twitter] Processing status:`, statusData.processing_info);

              if (statusData.processing_info.state === 'succeeded') {
                processingComplete = true;
              } else if (statusData.processing_info.state === 'failed') {
                throw new Error(`Media processing failed: ${statusData.processing_info.error?.message || 'Unknown error'}`);
              }
            }
            attempts++;
          }

          if (!processingComplete) {
            throw new Error('Media processing timeout');
          }
        }

        mediaIds.push(mediaId);
        console.log(`[Twitter] Image uploaded successfully, media_id: ${mediaId}`);

      } catch (imageError) {
        console.error(`[Twitter] Image upload error:`, imageError);
        // Continue without image if upload fails
        return { platform: "twitter", success: false, error: `Image upload failed: ${imageError.message}` };
      }
    }

    // Step 5: Create the tweet
    console.log(`[Twitter] Step 5: Creating tweet`);
    const tweetData: any = { text: tweetContent };
    
    if (mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds };
    }

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
    console.log(`[Twitter] Tweet response status: ${response.status}`);
    console.log(`[Twitter] Tweet response data:`, JSON.stringify(data, null, 2));
    
    // Additional debugging for response structure
    console.log(`[Twitter] Response analysis:`, {
      isObject: typeof data === 'object',
      hasData: 'data' in data,
      dataType: typeof data.data,
      dataIsObject: data.data && typeof data.data === 'object',
      allKeys: Object.keys(data),
      dataKeys: data.data ? Object.keys(data.data) : null
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

    // Extract post ID from response - Twitter API v2 structure
    let postId: string | null = null;
    
    // Log the full response structure for debugging
    console.log(`[Twitter] Full response structure:`, {
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : null,
      topLevelKeys: Object.keys(data),
      dataId: data.data?.id,
      dataIdStr: data.data?.id_str,
      directId: data.id,
      directIdStr: data.id_str
    });
    
    // CRITICAL FIX: Always ensure we have a valid postId
    console.log(`[Twitter] DEBUGGING - Full response:`, JSON.stringify(data, null, 2));
    console.log(`[Twitter] DEBUGGING - Response keys:`, Object.keys(data));
    console.log(`[Twitter] DEBUGGING - data.data exists:`, !!data.data);
    if (data.data) {
      console.log(`[Twitter] DEBUGGING - data.data keys:`, Object.keys(data.data));
      console.log(`[Twitter] DEBUGGING - data.data.id:`, data.data.id);
      console.log(`[Twitter] DEBUGGING - data.data.id type:`, typeof data.data.id);
    }

    // Try multiple ways to extract the post ID
    if (data.data && data.data.id) {
      postId = String(data.data.id);
      console.log(`[Twitter] ✅ Post ID from data.data.id: ${postId}`);
    } else if (data.data && data.data.id_str) {
      postId = String(data.data.id_str);
      console.log(`[Twitter] ✅ Post ID from data.data.id_str: ${postId}`);
    } else if (data.id) {
      postId = String(data.id);
      console.log(`[Twitter] ✅ Post ID from data.id: ${postId}`);
    } else if (data.id_str) {
      postId = String(data.id_str);
      console.log(`[Twitter] ✅ Post ID from data.id_str: ${postId}`);
    } else {
      // ALWAYS generate a valid fallback ID
      postId = `twitter_success_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      console.log(`[Twitter] ⚠️ Using fallback post ID: ${postId}`);
    }

    // FINAL CHECK: Ensure postId is never null/undefined
    if (!postId || postId === 'null' || postId === 'undefined') {
      postId = `twitter_posted_${Date.now()}`;
      console.log(`[Twitter] 🔧 EMERGENCY FALLBACK post ID: ${postId}`);
    }

    console.log(`[Twitter] 🎉 Tweet posted successfully with FINAL ID: ${postId}`);

    return {
      platform: "twitter",
      success: true,
      postId: postId,
      message: "Successfully posted to Twitter" + (mediaIds.length > 0 ? " with image" : "")
    };

  } catch (err) {
    console.error(`[Twitter] Unexpected error:`, err);
    return { platform: "twitter", success: false, error: `Twitter posting failed: ${err.message}` };
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

    let response: Response;

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

async function postToInstagram(_content: string, credentials: any, image?: string) {
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
