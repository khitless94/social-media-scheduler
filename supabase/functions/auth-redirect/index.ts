// Enhanced auth-redirect/index.ts with improved logging and error handling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// --- COMPLETE OAUTH CONFIGURATIONS FOR ALL PLATFORMS ---
const oauthConfigs = {
  twitter: {
    authUrl: "https://x.com/i/oauth2/authorize",
    clientId: Deno.env.get("TWITTER_CLIENT_ID") || "cElLTnFibUhINUJpblBRTTA2aFA6MTpjaQ",
    scope: "tweet.read tweet.write users.read offline.access",
    responseType: "code",
    requiresPKCE: true,
  },
  reddit: {
    authUrl: "https://www.reddit.com/api/v1/authorize",
    clientId: Deno.env.get("REDDIT_CLIENT_ID") || "kBrkkv-sRC-3jE9RIUt6-g",
    scope: "identity submit read",
    responseType: "code",
    duration: "permanent",
    requiresPKCE: false,
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientId: Deno.env.get("LINKEDIN_CLIENT_ID") || "86z7443djn3cgx",
    scope: "openid profile email w_member_social",  // Updated to use OpenID Connect scopes
    responseType: "code",
    requiresPKCE: false,  // LinkedIn doesn't require PKCE
  },
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    clientId: Deno.env.get("FACEBOOK_CLIENT_ID") || "772026995163778",
    scope:
      "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,business_management",
    responseType: "code",
    requiresPKCE: false,
  },
  instagram: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    clientId: Deno.env.get("FACEBOOK_CLIENT_ID") || "772026995163778",
    scope:
      "public_profile,email,pages_show_list,instagram_basic,instagram_content_publish,business_management",
    responseType: "code",
    requiresPKCE: false,
  },
};

function generateRandomString(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateCodeVerifier(length = 128): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform");
    const userId = url.searchParams.get("user_id");

    console.log(`[Auth Redirect] Received request for platform: ${platform}, user: ${userId}`);

    if (!platform || !userId) {
      throw new Error("Missing platform or user_id parameter");
    }

    const config = oauthConfigs[platform as keyof typeof oauthConfigs];
    if (!config || !config.clientId) {
      console.error(`[Auth Redirect] Platform ${platform} not configured or missing client ID`);
      throw new Error(`Unsupported or misconfigured platform: ${platform}`);
    }

    console.log(`[Auth Redirect] ${platform} client ID exists: ${!!config.clientId}`);
    console.log(`[Auth Redirect] ${platform} client ID value: ${config.clientId}`);
    console.log(`[Auth Redirect] ${platform} requires PKCE: ${config.requiresPKCE}`);

    const state = generateRandomString(32);
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (config.requiresPKCE) {
      codeVerifier = generateCodeVerifier(128);
      codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log(`[Auth Redirect] Generated PKCE parameters for ${platform}`);
      console.log(`[Auth Redirect] Code verifier length: ${codeVerifier.length}`);
      console.log(`[Auth Redirect] Code challenge: ${codeChallenge}`);
    }

    // Clean up existing sessions for this user/platform
    const { error: deleteError } = await supabase
      .from("oauth_sessions")
      .delete()
      .eq("user_id", userId)
      .eq("platform", platform);

    if (deleteError) {
      console.warn(`[Auth Redirect] Warning: Could not clean up existing sessions:`, deleteError);
    } else {
      console.log(`[Auth Redirect] Cleaned up existing sessions for ${platform}/${userId}`);
    }

    // Insert new session
    const sessionData = {
      state,
      user_id: userId,
      platform,
      code_verifier: codeVerifier,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    };

    console.log(`[Auth Redirect] Creating session with state: ${state}`);
    const { error: insertError } = await supabase.from("oauth_sessions").insert(sessionData);

    if (insertError) {
      console.error("[Auth Redirect] DB Insert Error:", insertError);
      throw new Error("Could not store session");
    }

    // Always use production URL for OAuth redirects - Reddit requires exact match
    const supabaseUrl = "https://eqiuukwwpdiyncahrdny.supabase.co";
    const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
    console.log(`[Auth Redirect] Using redirect URI: ${redirectUri}`);

    const params = new URLSearchParams({
      response_type: config.responseType,
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scope,
      state,
    });

    if (config.requiresPKCE && codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
      console.log(`[Auth Redirect] Added PKCE parameters to authorization URL`);
    }

    if ((config as any).duration) {
      params.set("duration", (config as any).duration);
      console.log(`[Auth Redirect] Added duration parameter: ${(config as any).duration}`);
    }

    const authorizationUrl = `${config.authUrl}?${params.toString()}`;
    console.log(`[Auth Redirect] Authorization URL generated for ${platform}`);
    console.log(`[Auth Redirect] URL parameters: ${Array.from(params.keys()).join(', ')}`);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authorizationUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("[Auth Redirect] Error:", err);
    console.error("[Auth Redirect] Stack trace:", err.stack);
    
    const fallback = Deno.env.get("YOUR_FRONTEND_URL") || "https://scribe-schedule-labs.vercel.app";
    const platform = new URL(req.url).searchParams.get("platform") || "unknown";
    const errorRedirect = `${fallback}/oauth/callback?error=${encodeURIComponent(
      err.message
    )}&platform=${encodeURIComponent(platform)}`;
    
    console.log(`[Auth Redirect] Redirecting to error URL: ${errorRedirect}`);
    
    return new Response(null, {
      status: 302,
      headers: { Location: errorRedirect },
    });
  }
});

