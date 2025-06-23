// Enhanced oauth-callback/index.ts with comprehensive fixes for all platforms
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const tokenConfigs = {
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId: Deno.env.get('LINKEDIN_CLIENT_ID') || '78yhh9neso7awt',
    clientSecret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
    grantType: 'authorization_code',
    requiresFormEncoding: true
  },
  reddit: {
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    clientId: Deno.env.get('REDDIT_CLIENT_ID') || 'kBrkkv-sRC-3jE9RIUt6-g',
    clientSecret: Deno.env.get('REDDIT_CLIENT_SECRET'),
    grantType: 'authorization_code',
    requiresBasicAuth: true
  },
  twitter: {
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    clientId: Deno.env.get('TWITTER_CLIENT_ID') || 'ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ',
    clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET'),
    grantType: 'authorization_code',
    requiresPKCE: true
  },
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientId: Deno.env.get('FACEBOOK_CLIENT_ID') || '2249146282214303',
    clientSecret: Deno.env.get('FACEBOOK_CLIENT_SECRET'),
    grantType: 'authorization_code'
  },
  instagram: {
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    clientId: Deno.env.get('INSTAGRAM_CLIENT_ID') || '2249146282214303',
    clientSecret: Deno.env.get('INSTAGRAM_CLIENT_SECRET'),
    grantType: 'authorization_code'
  }
};

async function exchangeCodeForToken(platform: string, code: string, redirectUri: string, codeVerifier?: string) {
  const config = tokenConfigs[platform as keyof typeof tokenConfigs];
  if (!config) throw new Error(`Token config not found for platform: ${platform}`);

  console.log(`[OAuth Callback] Exchanging code for token on ${platform}`);
  console.log(`[OAuth Callback] Using redirect URI: ${redirectUri}`);
  console.log(`[OAuth Callback] Using client ID: ${config.clientId}`);
  console.log(`[OAuth Callback] Client secret exists: ${!!config.clientSecret}`);
  console.log(`[OAuth Callback] Code verifier exists: ${!!codeVerifier}`);

  // Check if required secrets are missing
  if (!config.clientSecret) {
    if (platform === 'twitter') {
      throw new Error(`Twitter authentication failed: Missing TWITTER_CLIENT_SECRET environment variable.

Please set your Twitter Client Secret in Supabase:
1. Go to https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/settings/environment-variables
2. Add TWITTER_CLIENT_SECRET with your actual Twitter app's Client Secret
3. Get your Client Secret from: https://developer.twitter.com/en/portal/dashboard

Your Twitter Client ID: ${config.clientId}`);
    }
    throw new Error(`${platform} authentication failed: Missing client secret. Please configure ${platform.toUpperCase()}_CLIENT_SECRET in your Supabase environment variables.`);
  }

  // Validate that we have the client secret
  if (!config.clientSecret || config.clientSecret.includes('your_') || config.clientSecret.length < 10) {
    throw new Error(`${platform} authentication failed: Invalid client secret. Please set the actual ${platform.toUpperCase()}_CLIENT_SECRET in your Supabase environment variables.`);
  }
  
  if (codeVerifier) {
    console.log(`[OAuth Callback] Code verifier length: ${codeVerifier.length}`);
    console.log(`[OAuth Callback] Code verifier (first 10 chars): ${codeVerifier.substring(0, 10)}...`);
  }
  console.log(`[OAuth Callback] Authorization code (first 10 chars): ${code.substring(0, 10)}...`);
  console.log(`[OAuth Callback] Authorization code length: ${code.length}`);

  const body = new URLSearchParams({
    grant_type: config.grantType,
    client_id: config.clientId,
    code: code,
    redirect_uri: redirectUri
  });

  // For PKCE flows, include code_verifier
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
    console.log(`[OAuth Callback] Added code_verifier for PKCE flow on ${platform}`);
  } else if (platform === 'twitter') {
    // Twitter requires PKCE, so code_verifier is mandatory
    throw new Error(`Twitter OAuth Error: Missing code_verifier. Twitter requires PKCE (Proof Key for Code Exchange). Please try connecting again.`);
  }

  // Add client_secret for platforms that need it (will be removed later for Basic Auth platforms)
  if (config.clientSecret) {
    body.append('client_secret', config.clientSecret);
    console.log(`[OAuth Callback] Added client_secret for ${platform}`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'User-Agent': 'ScribeSchedule/1.0'
  };

  // Platform-specific authentication handling
  if (platform === 'reddit') {
    // Reddit requires Basic Auth header instead of client_secret in body
    const auth = btoa(`${config.clientId}:${config.clientSecret}`);
    headers['Authorization'] = `Basic ${auth}`;
    // Remove client_secret from body for Reddit as it uses Basic Auth
    body.delete('client_secret');
    console.log(`[OAuth Callback] Using Basic Auth for Reddit`);
  } else if (platform === 'twitter') {
    // Twitter OAuth 2.0 with PKCE - Always use Basic Auth for Twitter
    const auth = btoa(`${config.clientId}:${config.clientSecret}`);
    headers['Authorization'] = `Basic ${auth}`;
    // Remove client_secret from body for Twitter as it uses Basic Auth
    body.delete('client_secret');
    console.log(`[OAuth Callback] Using Basic Auth for Twitter with PKCE`);
  } else if (platform === 'linkedin') {
    // LinkedIn uses client_secret in body (already added above)
    console.log(`[OAuth Callback] Using client_secret in body for LinkedIn`);
  }

  console.log(`[OAuth Callback] ${platform} request body parameters: ${Array.from(body.keys()).join(', ')}`);
  console.log(`[OAuth Callback] ${platform} request headers: ${Object.keys(headers).join(', ')}`);

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: headers,
    body: body.toString()
  });

  const responseText = await response.text();
  console.log(`[OAuth Callback] ${platform} response status: ${response.status}`);
  console.log(`[OAuth Callback] ${platform} response headers:`, Object.fromEntries(response.headers.entries()));
  console.log(`[OAuth Callback] ${platform} response body: ${responseText}`);

  if (!response.ok) {
    console.error(`[OAuth Callback] Token exchange failed for ${platform}:`, responseText);
    
    // Enhanced error handling for common OAuth errors
    if (responseText.includes('unauthorized_client') || responseText.includes('Missing valid authorization header')) {
      if (platform === 'twitter') {
        throw new Error(`Twitter OAuth Error: Invalid client credentials. This usually means:

🔧 TWITTER CONFIGURATION CHECKLIST:
1. ❌ TWITTER_CLIENT_SECRET is missing or incorrect in Supabase
2. ❌ Client ID/Secret mismatch in Twitter Developer Console
3. ❌ Redirect URI not configured correctly in Twitter app
4. ❌ Twitter app type is incorrect (should be "Web App, Automated App or Bot")

✅ TO FIX:
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Find your app with Client ID: ${config.clientId}
3. Copy the Client Secret from "Keys and tokens" tab
4. Set TWITTER_CLIENT_SECRET in Supabase environment variables
5. Ensure redirect URI is: http://127.0.0.1:54321/functions/v1/oauth-callback
6. Ensure app type is "Confidential client" (not Public client)

Original error: ${responseText}`);
      }
      throw new Error(`${platform} OAuth Error: Invalid client credentials or missing authorization. This usually means:
1. The ${platform.toUpperCase()}_CLIENT_SECRET is incorrect or missing
2. The client ID doesn't match the client secret
3. The app configuration in ${platform}'s developer portal is incorrect

Please verify:
- Your ${platform.toUpperCase()}_CLIENT_SECRET is correctly set in Supabase environment variables
- Your client ID (${config.clientId}) matches your app in ${platform}'s developer portal
- Your app has the correct redirect URI: http://127.0.0.1:54321/functions/v1/oauth-callback

Original error: ${responseText}`);
    }

    if (responseText.includes('external member binding exists')) {
      throw new Error(`${platform} OAuth Error: The account appears to be already connected. Please disconnect the account from ${platform}'s app settings and try again. Original error: ${responseText}`);
    }

    if (responseText.includes('invalid_grant') || responseText.includes('authorization_code')) {
      throw new Error(`${platform} OAuth Error: Authorization code expired or invalid. Please try connecting again. Original error: ${responseText}`);
    }

    if (responseText.includes('invalid_client')) {
      throw new Error(`${platform} OAuth Error: Invalid client credentials. Please check your ${platform} app configuration. Original error: ${responseText}`);
    }

    if (responseText.includes('invalid_request')) {
      throw new Error(`${platform} OAuth Error: Invalid request parameters. This might be a configuration issue. Original error: ${responseText}`);
    }

    if (responseText.includes('access_denied')) {
      throw new Error(`${platform} OAuth Error: User denied access or insufficient permissions. Original error: ${responseText}`);
    }

    // LinkedIn-specific error handling
    if (platform === 'linkedin') {
      if (responseText.includes('invalid_redirect_uri')) {
        throw new Error(`LinkedIn OAuth Error: Invalid redirect URI. Please ensure your LinkedIn app has this exact redirect URI configured: https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback

Go to https://www.linkedin.com/developers/apps → Your App → Auth tab → Authorized redirect URLs

Original error: ${responseText}`);
      }

      if (responseText.includes('invalid_client_id')) {
        throw new Error(`LinkedIn OAuth Error: Invalid Client ID. Please verify:
1. Your LinkedIn app Client ID is correct: ${config.clientId}
2. The app exists and is active in LinkedIn Developer Console
3. Go to https://www.linkedin.com/developers/apps to check your app

Original error: ${responseText}`);
      }

      if (responseText.includes('Bummer, something went wrong')) {
        throw new Error(`LinkedIn OAuth Error: LinkedIn is experiencing issues or your app configuration needs attention. Please:
1. Check your LinkedIn app status at https://www.linkedin.com/developers/apps
2. Verify your app has the correct scopes: r_liteprofile, r_emailaddress, w_member_social
3. Ensure your app is approved for production use
4. Try again in a few minutes

Original error: ${responseText}`);
      }
    }

    throw new Error(`${platform} token exchange failed: ${response.status} ${response.statusText}. Details: ${responseText}`);
  }

  let tokenData;
  try {
    tokenData = JSON.parse(responseText);
  } catch (e) {
    console.error(`[OAuth Callback] Failed to parse response as JSON:`, responseText);
    throw new Error(`Invalid JSON response from ${platform}: ${responseText}`);
  }

  console.log(`[OAuth Callback] Token exchange successful for ${platform}`);
  console.log(`[OAuth Callback] Token data keys: ${Object.keys(tokenData).join(', ')}`);
  return tokenData;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let code, state, error, errorDescription, platformFromUrl, sessionData;

    // Handle both GET (redirect) and POST (fetch) requests
    if (req.method === 'POST') {
      const body = await req.json();
      code = body.code;
      state = body.state;
      error = body.error;
      errorDescription = body.error_description;
      platformFromUrl = body.platform;
      sessionData = body.session_data;
      console.log('[OAuth Callback] POST request received:', { platform: platformFromUrl, code: code ? 'present' : 'missing', state: state ? 'present' : 'missing' });
    } else {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      state = url.searchParams.get('state');
      error = url.searchParams.get('error');
      errorDescription = url.searchParams.get('error_description');
      platformFromUrl = url.searchParams.get('platform');
      console.log('[OAuth Callback] GET request received:', { platform: platformFromUrl, code: code ? 'present' : 'missing', state: state ? 'present' : 'missing' });
    }

    console.log(`[OAuth Callback] Received callback with state: ${state}`);
    console.log(`[OAuth Callback] Code exists: ${!!code}`);
    console.log(`[OAuth Callback] Error: ${error}`);
    console.log(`[OAuth Callback] Platform from URL: ${platformFromUrl}`);

    if (error) {
      console.error(`[OAuth Callback] OAuth error: ${error} - ${errorDescription}`);
      const frontendUrl = Deno.env.get('YOUR_FRONTEND_URL') || 'https://social-media-scheduler-khitless94s-projects.vercel.app';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}&platform=${encodeURIComponent(platformFromUrl || '')}`
        }
      });
    }

    if (!code || !state) {
      throw new Error('Missing required parameters: code or state');
    }

    console.log(`[OAuth Callback] Processing OAuth callback for state: ${state}`);

    let platform, user_id, code_verifier;

    // Use session data from request if available (POST method), otherwise decode from state (GET method)
    if (sessionData && req.method === 'POST') {
      console.log(`[OAuth Callback] Using session data from request`);
      platform = sessionData.platform || platformFromUrl;
      user_id = sessionData.user_id;
      code_verifier = sessionData.code_verifier;

      // Validate timestamp (session should be recent)
      const sessionAge = Date.now() - sessionData.timestamp;
      if (sessionAge > 10 * 60 * 1000) { // 10 minutes
        throw new Error('OAuth session has expired. Please try connecting again.');
      }
    } else {
      console.log(`[OAuth Callback] Trying to decode session data from state parameter`);

      // Try to decode session data from state parameter (for GET requests)
      let decodedSessionData = null;
      if (state && state.includes('|')) {
        try {
          // URL decode the state parameter first (LinkedIn might URL-encode it)
          const decodedState = decodeURIComponent(state);
          console.log(`[OAuth Callback] Original state: ${state}`);
          console.log(`[OAuth Callback] URL decoded state: ${decodedState}`);

          const [originalState, encodedData] = decodedState.split('|');
          console.log(`[OAuth Callback] Attempting to decode state. Original: ${originalState}, Encoded length: ${encodedData?.length}`);

          if (!encodedData) {
            throw new Error('No encoded data found in state parameter');
          }

          const decodedString = atob(encodedData);
          console.log(`[OAuth Callback] Decoded string: ${decodedString}`);

          decodedSessionData = JSON.parse(decodedString);
          console.log(`[OAuth Callback] Decoded session data from state:`, decodedSessionData);

          platform = decodedSessionData.platform || platformFromUrl;
          user_id = decodedSessionData.user_id;
          code_verifier = decodedSessionData.code_verifier;

          // Validate timestamp
          const sessionAge = Date.now() - decodedSessionData.timestamp;
          if (sessionAge > 10 * 60 * 1000) { // 10 minutes
            throw new Error('OAuth session has expired. Please try connecting again.');
          }
        } catch (e) {
          console.error(`[OAuth Callback] Failed to decode session data from state:`, e);
          console.error(`[OAuth Callback] Raw state parameter: ${state}`);
          console.error(`[OAuth Callback] State parts:`, state.split('|'));

          // Try without URL decoding as fallback
          try {
            const [originalState, encodedData] = state.split('|');
            if (encodedData) {
              const decodedString = atob(encodedData);
              decodedSessionData = JSON.parse(decodedString);
              console.log(`[OAuth Callback] Fallback decoding successful:`, decodedSessionData);

              platform = decodedSessionData.platform || platformFromUrl;
              user_id = decodedSessionData.user_id;
              code_verifier = decodedSessionData.code_verifier;
            }
          } catch (fallbackError) {
            console.error(`[OAuth Callback] Fallback decoding also failed:`, fallbackError);
          }
        }
      }

      // If we couldn't decode from state, fall back to database lookup
      if (!decodedSessionData) {
        console.log(`[OAuth Callback] Falling back to database session lookup`);

        const { data: dbSessionData, error: sessionError } = await supabase
          .from('oauth_sessions')
          .select('*')
          .eq('state', state.split('|')[0] || state) // Use original state if encoded
          .single();

        if (sessionError || !dbSessionData) {
          console.error(`[OAuth Callback] State validation failed:`, sessionError);
          throw new Error(`OAuth session not found. Please try connecting your account again.`);
        }

        const now = new Date();
        const expiresAt = new Date(dbSessionData.expires_at);
        if (now > expiresAt) {
          console.error(`[OAuth Callback] Session expired for state: ${state}`);
          throw new Error('OAuth session has expired. Please try connecting again.');
        }

        platform = dbSessionData.platform;
        user_id = dbSessionData.user_id;
        code_verifier = dbSessionData.code_verifier;
      }
    }

    // Final platform validation and fallback detection
    if (!platform) {
      // Try to detect platform from the authorization code or other clues
      if (code && code.length > 50) {
        // Twitter codes are typically longer
        platform = 'twitter';
        console.log(`[OAuth Callback] Detected platform as Twitter based on code length`);
      } else if (code && code.length < 50) {
        // Reddit codes are typically shorter
        platform = 'reddit';
        console.log(`[OAuth Callback] Detected platform as Reddit based on code length`);
      } else {
        // If we still can't detect, check the referrer or other clues
        const referer = req.headers.get('referer') || '';
        if (referer.includes('reddit.com')) {
          platform = 'reddit';
          console.log(`[OAuth Callback] Detected platform as Reddit based on referrer`);
        } else if (referer.includes('twitter.com') || referer.includes('x.com')) {
          platform = 'twitter';
          console.log(`[OAuth Callback] Detected platform as Twitter based on referrer`);
        } else {
          // Default to reddit if we can't determine (since that's what we're testing)
          platform = 'reddit';
          console.log(`[OAuth Callback] Defaulting to Reddit platform`);
        }
      }
    }

    console.log(`[OAuth Callback] Valid session found for platform: ${platform}, user: ${user_id}`);
    console.log(`[OAuth Callback] Session code_verifier exists: ${!!code_verifier}`);
    console.log(`[OAuth Callback] Session created at: ${sessionData?.created_at || 'unknown'}`);
    console.log(`[OAuth Callback] Session expires at: ${sessionData?.expires_at || 'unknown'}`);
    
    // Check if user already has an account connected for this platform
    const { data: existingAccount, error: checkError } = await supabase
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', user_id)
      .eq('platform', platform)
      .single();
    
    if (existingAccount && !checkError) {
      console.log(`[OAuth Callback] ${platform} account already exists for user ${user_id}, will update`);
    } else {
      console.log(`[OAuth Callback] No existing ${platform} account found for user ${user_id}, will create new`);
    }

    // Always use production URL and consistent format - Reddit requires exact match
    const supabaseUrl = "https://eqiuukwwpdiyncahrdny.supabase.co";
    const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
    console.log(`[OAuth Callback] Using redirect URI: ${redirectUri}`);

    const tokenData = await exchangeCodeForToken(platform, code, redirectUri, code_verifier);

    // Prepare the data for upserting to oauth_credentials table
    const credentialsData = {
      user_id: user_id, // This should be a UUID string
      platform: platform,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      scope: tokenData.scope || null,
      updated_at: new Date().toISOString()
    };

    console.log(`[OAuth Callback] Storing credentials for ${platform}/${user_id}`);
    console.log(`[OAuth Callback] Credentials data:`, JSON.stringify(credentialsData, null, 2));

    // Try to store in oauth_credentials first (primary table)
    const oauthResult = await supabase
      .from('oauth_credentials')
      .upsert(credentialsData, { onConflict: 'user_id,platform' });

    if (oauthResult.error) {
      console.error(`[OAuth Callback] Failed to store in oauth_credentials:`, oauthResult.error);

      // Try social_tokens as fallback
      const socialTokensResult = await supabase
        .from('social_tokens')
        .upsert(credentialsData, { onConflict: 'user_id,platform' });

      if (socialTokensResult.error) {
        console.error(`[OAuth Callback] Failed to store in social_tokens:`, socialTokensResult.error);
        throw new Error(`Failed to store authentication tokens: ${oauthResult.error.message}`);
      } else {
        console.log(`[OAuth Callback] Successfully stored in social_tokens (fallback)`);
      }
    } else {
      console.log(`[OAuth Callback] Successfully stored in oauth_credentials`);

      // Also try to store in social_tokens for backward compatibility (but don't fail if it errors)
      const socialTokensResult = await supabase
        .from('social_tokens')
        .upsert(credentialsData, { onConflict: 'user_id,platform' });

      if (socialTokensResult.error) {
        console.warn(`[OAuth Callback] Failed to store in social_tokens (non-critical):`, socialTokensResult.error);
      }
    }



    // Clean up the oauth session (use original state if encoded)
    const originalState = state.includes('|') ? state.split('|')[0] : state;
    await supabase
      .from('oauth_sessions')
      .delete()
      .eq('state', originalState);

    console.log(`[OAuth Callback] Successfully connected ${platform} for user ${user_id}`);

    // Handle response based on request method
    if (req.method === 'POST') {
      // Return JSON response for POST requests (fetch calls)
      return new Response(JSON.stringify({
        success: true,
        platform,
        message: `Successfully connected ${platform} account`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Redirect for GET requests (browser redirects)
      const frontendUrl = Deno.env.get('YOUR_FRONTEND_URL') || 'https://social-media-scheduler-khitless94s-projects.vercel.app';
      const successUrl = `${frontendUrl}/oauth/callback?success=true&platform=${platform}`;
      console.log(`[OAuth Callback] Redirecting to success URL: ${successUrl}`);

      return new Response(null, {
        status: 302,
        headers: {
          'Location': successUrl
        }
      });
    }

  } catch (error: any) {
    console.error('[OAuth Callback] Error:', error.message);
    console.error('[OAuth Callback] Stack trace:', error.stack);

    const frontendUrl = Deno.env.get('YOUR_FRONTEND_URL') || 'https://social-media-scheduler-khitless94s-projects.vercel.app';

    // Try to get platform from URL or session data for better error reporting
    const url = new URL(req.url);
    const platformFromUrl = url.searchParams.get('platform');
    const state = url.searchParams.get('state');
    let platformFromSession = '';

    if (state) {
      try {
        const { data: sessionData } = await supabase
          .from('oauth_sessions')
          .select('platform')
          .eq('state', state)
          .single();
        platformFromSession = sessionData?.platform || '';
      } catch (e) {
        // Ignore session lookup errors in error handler
      }
    }

    const platform = platformFromSession || platformFromUrl || '';

    // Handle error response based on request method
    if (req.method === 'POST') {
      // Return JSON error response for POST requests
      return new Response(JSON.stringify({
        error: error.message,
        platform
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      // Redirect for GET requests
      const errorUrl = `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error.message)}&platform=${encodeURIComponent(platform)}`;
      console.log(`[OAuth Callback] Redirecting to error URL: ${errorUrl}`);

      return new Response(null, {
        status: 302,
        headers: { 'Location': errorUrl }
      });
    }
  }
});

