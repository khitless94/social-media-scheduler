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
    clientId: Deno.env.get('LINKEDIN_CLIENT_ID') || '86z7443djn3cgx',
    clientSecret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
    grantType: 'authorization_code'
  },
  reddit: {
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    clientId: Deno.env.get('REDDIT_CLIENT_ID') || 'kBrkkv-sRC-3jE9RIUt6-g',
    clientSecret: Deno.env.get('REDDIT_CLIENT_SECRET'),
    grantType: 'authorization_code'
  },
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    clientId: Deno.env.get('TWITTER_CLIENT_ID') || 'ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ',
    clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET'),
    grantType: 'authorization_code'
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
      throw new Error(`${platform} OAuth Error: Invalid client credentials or missing authorization. This usually means:
1. The ${platform.toUpperCase()}_CLIENT_SECRET is incorrect or missing
2. The client ID doesn't match the client secret
3. The app configuration in ${platform}'s developer portal is incorrect

Please verify:
- Your ${platform.toUpperCase()}_CLIENT_SECRET is correctly set in Supabase environment variables
- Your client ID (${config.clientId}) matches your app in ${platform}'s developer portal
- Your app has the correct redirect URI: https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback

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
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log(`[OAuth Callback] Received callback with state: ${state}`);
    console.log(`[OAuth Callback] Code exists: ${!!code}`);
    console.log(`[OAuth Callback] Error: ${error}`);

    if (error) {
      console.error(`[OAuth Callback] OAuth error: ${error} - ${errorDescription}`);
      const frontendUrl = Deno.env.get('YOUR_FRONTEND_URL') || 'http://localhost:8083';
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`
        }
      });
    }

    if (!code || !state) {
      throw new Error('Missing required parameters: code or state');
    }

    console.log(`[OAuth Callback] Looking up session for state: ${state}`);
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('oauth_sessions')
      .select('*')
      .eq('state', state)
      .single();

    if (sessionError || !sessionData) {
      console.error(`[OAuth Callback] State validation failed:`, sessionError);
      throw new Error(`Invalid state format for ${sessionData?.platform || 'unknown'}. The authorization state was corrupted or malformed. Please try connecting your account again.`);
    }

    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);
    if (now > expiresAt) {
      console.error(`[OAuth Callback] Session expired for state: ${state}`);
      throw new Error('OAuth session has expired. Please try connecting again.');
    }

    const { platform, user_id, code_verifier } = sessionData;
    console.log(`[OAuth Callback] Valid session found for platform: ${platform}, user: ${user_id}`);
    console.log(`[OAuth Callback] Session code_verifier exists: ${!!code_verifier}`);
    console.log(`[OAuth Callback] Session created at: ${sessionData.created_at || 'unknown'}`);
    console.log(`[OAuth Callback] Session expires at: ${sessionData.expires_at}`);
    
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

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`;
    console.log(`[OAuth Callback] Using redirect URI: ${redirectUri}`);

    const tokenData = await exchangeCodeForToken(platform, code, redirectUri, code_verifier);

    // Prepare the data for upserting to oauth_credentials table
    const credentialsData = {
      user_id: user_id,
      platform: platform,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      scope: tokenData.scope || null,
      updated_at: new Date().toISOString()
    };

    console.log(`[OAuth Callback] Storing credentials for ${platform}/${user_id}`);
    console.log(`[OAuth Callback] Credentials data keys: ${Object.keys(credentialsData).join(', ')}`);

    const { error: tokenError } = await supabase
      .from('oauth_credentials')
      .upsert(credentialsData, {
        onConflict: 'user_id,platform'
      });

    if (tokenError) {
      console.error(`[OAuth Callback] Failed to store tokens:`, tokenError);
      throw new Error('Failed to store authentication tokens');
    }

    // Clean up the oauth session
    await supabase
      .from('oauth_sessions')
      .delete()
      .eq('state', state);

    console.log(`[OAuth Callback] Successfully connected ${platform} for user ${user_id}`);

    const frontendUrl = Deno.env.get('YOUR_FRONTEND_URL') || 'http://localhost:8083';
    const successUrl = `${frontendUrl}/oauth/callback?success=true&platform=${platform}`;
    console.log(`[OAuth Callback] Redirecting to success URL: ${successUrl}`);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': successUrl
      }
    });

  } catch (error: any) {
    console.error('[OAuth Callback] Error:', error.message);
    console.error('[OAuth Callback] Stack trace:', error.stack);

    const frontendUrl = Deno.env.get('YOUR_FRONTEND_URL') || 'http://localhost:8083';
    const errorUrl = `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error.message)}`;

    console.log(`[OAuth Callback] Redirecting to error URL: ${errorUrl}`);
    
    return new Response(null, {
      status: 302,
      headers: { 'Location': errorUrl }
    });
  }
});

