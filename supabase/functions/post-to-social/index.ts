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

    let { content, platforms, platform } = body;

    // Handle both old format (platform: "linkedin") and new format (platforms: ["linkedin"])
    if (platform && !platforms) {
      platforms = [platform];
      console.log('Converting single platform to array:', platforms);
    }

    console.log('Final values:', { content: content?.substring(0, 50) + '...', platforms });

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

        const result = await postToSocialMedia(platform, content, credentials);
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

async function postToSocialMedia(platform: string, content: string, credentials: any) {
  switch (platform.toLowerCase()) {
    case "twitter":
      return await postToTwitter(content, credentials);
    case "linkedin":
      return await postToLinkedIn(content, credentials);
    case "reddit":
      return await postToReddit(content, credentials);
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}

async function postToTwitter(content: string, credentials: any) {
  try {
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { platform: "twitter", success: false, error: data.detail || data.error };
    }

    return { platform: "twitter", success: true, postId: data.data?.id };
  } catch (err) {
    return { platform: "twitter", success: false, error: err.message };
  }
}

async function postToLinkedIn(content: string, credentials: any) {
  try {
    console.log(`[LinkedIn] Starting LinkedIn post process`);
    console.log(`[LinkedIn] Content length: ${content.length}`);
    console.log(`[LinkedIn] Access token length: ${credentials.access_token?.length || 0}`);

    // Step 1: Get LinkedIn profile using OpenID Connect userinfo endpoint
    let profile: any;
    let author: string;

    console.log(`[LinkedIn] Attempting to fetch profile from LinkedIn OpenID Connect /userinfo endpoint`);
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[LinkedIn] Profile response status: ${profileRes.status}`);

    if (!profileRes.ok) {
      const profileError = await profileRes.text();
      console.error(`[LinkedIn] Profile fetch failed:`, profileError);
      console.log(`[LinkedIn] Current token scopes: openid profile email w_member_social`);
      console.log(`[LinkedIn] Using OpenID Connect userinfo endpoint`);
      throw new Error(`Failed to fetch LinkedIn profile via userinfo endpoint (${profileRes.status}): ${profileError}`);
    }

    profile = await profileRes.json();
    console.log(`[LinkedIn] Profile fetched successfully:`, JSON.stringify(profile, null, 2));
    console.log(`[LinkedIn] Profile sub (user ID): ${profile.sub}`);
    author = `urn:li:person:${profile.sub}`;

    console.log(`[LinkedIn] Using OpenID Connect approach`);
    console.log(`[LinkedIn] Profile access via /userinfo, posting via /v2/ugcPosts`);

    // Step 2: Prepare post payload
    const payload = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    console.log(`[LinkedIn] Posting payload:`, JSON.stringify(payload, null, 2));

    // Step 3: Create the post
    console.log(`[LinkedIn] Creating post via LinkedIn API`);
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

      // Check if it's a permissions error
      if (postRes.status === 403 && postData.message && postData.message.includes('permissions')) {
        return {
          platform: "linkedin",
          success: false,
          error: `LinkedIn posting failed due to insufficient permissions. Make sure your LinkedIn app has "Share on LinkedIn" product enabled. Current scopes: openid profile email w_member_social. Error: ${postData.message}`
        };
      }

      return {
        platform: "linkedin",
        success: false,
        error: `LinkedIn API error (${postRes.status}): ${postData.message || JSON.stringify(postData)}`
      };
    }

    console.log(`[LinkedIn] Post created successfully with ID: ${postData.id}`);
    return { platform: "linkedin", success: true, postId: postData.id };
  } catch (err) {
    console.error(`[LinkedIn] Unexpected error:`, err);
    return { platform: "linkedin", success: false, error: err.message };
  }
}

async function postToReddit(content: string, credentials: any) {
  try {
    const subreddit = "test";
    const response = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ContentPilotAI/1.0",
      },
      body: new URLSearchParams({
        api_type: "json",
        kind: "self",
        sr: subreddit,
        title: content.substring(0, 100),
        text: content,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.json?.errors?.length > 0) {
      return { platform: "reddit", success: false, error: data.json?.errors?.[0]?.[1] };
    }

    return { platform: "reddit", success: true, postId: data.json?.data?.name };
  } catch (err) {
    return { platform: "reddit", success: false, error: err.message };
  }
}
