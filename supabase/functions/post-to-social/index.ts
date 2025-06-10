// /functions/post.ts

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPPORTED_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'reddit'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Incoming request: ${req.method} ${req.url}`);

  // Supabase Auth
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    return errorResponse("Invalid or expired token", 401);
  }

  // Safe JSON Parsing
  let requestBody;
  const rawBody = await req.text();
  console.log("Raw Request Body:", rawBody);

  try {
    requestBody = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { platform, content, subreddit } = requestBody;

  if (!platform || typeof platform !== "string") {
    return errorResponse("Missing or invalid 'platform'", 400);
  }

  const platformKey = platform.toLowerCase().trim();
  if (!SUPPORTED_PLATFORMS.includes(platformKey)) {
    return errorResponse(`Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(', ')}`, 400);
  }

  if (!content || typeof content !== "string" || content.trim() === "") {
    return errorResponse("Content is required", 400);
  }

  const { data: credentials, error: credentialError } = await supabaseClient
    .from("oauth_credentials")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", platformKey)
    .single();

  if (credentialError || !credentials) {
    return errorResponse(`No credentials found for ${platformKey}`, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (credentials.expires_at && now >= credentials.expires_at - 60) {
    return errorResponse(`${platformKey} token expired`, 401);
  }

  try {
    const result = await handlePost(platformKey, credentials, content, subreddit);
    return successResponse(result);
  } catch (err) {
    console.error("Posting error:", err);
    return errorResponse(err.message || "Failed to post content", 500);
  }
});

// Platform routing
async function handlePost(platform: string, credentials: any, content: string, subreddit?: string) {
  switch (platform) {
    case "twitter":
      return postToTwitter(credentials, content);
    case "linkedin":
      return postToLinkedIn(credentials, content);
    case "facebook":
      return postToFacebook(credentials, content);
    case "reddit":
      return postToReddit(credentials, content, subreddit || "test");
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Platform implementations

async function postToTwitter(credentials: any, content: string) {
  const resp = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${credentials.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || data.title || "Twitter API failed");

  return {
    platform: "twitter",
    post_id: data.data?.id,
    post_url: `https://twitter.com/user/status/${data.data?.id}`,
  };
}

async function postToLinkedIn(credentials: any, content: string) {
  const author = `urn:li:person:${credentials.provider_user_id}`;
  const body = {
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

  const resp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${credentials.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || "LinkedIn API failed");

  return {
    platform: "linkedin",
    post_urn: data.id || data.urn,
    response: data,
  };
}

async function postToFacebook(credentials: any, content: string) {
  const userId = credentials.provider_user_id;

  const resp = await fetch(`https://graph.facebook.com/${userId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: content,
      access_token: credentials.access_token,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Facebook API failed");

  return {
    platform: "facebook",
    post_id: data.id,
    post_url: `https://www.facebook.com/${data.id.replace('_', '/posts/')}`,
  };
}

async function postToReddit(credentials: any, content: string, subreddit: string) {
  const resp = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${credentials.access_token}`,
      "User-Agent": "MyRedditApp/1.0",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      sr: subreddit,
      kind: "self",
      title: content.slice(0, 300),
      text: content,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || "Reddit API failed");

  return {
    platform: "reddit",
    post_url: `https://reddit.com${data?.json?.data?.url || ''}`,
    response: data,
  };
}

// Response helpers
function successResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
