// oauth.tx
// Frontend utility functions for generating OAuth authorization URLs

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  state?: string; // Allow passing custom state
}

// Define a type for supported platforms for better type safety
export type OAuthPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'reddit';

export const generateOAuthUrl = async (platform: OAuthPlatform, config: OAuthConfig): Promise<string> => {
  const baseUrls: Record<OAuthPlatform, string> = {
    twitter: 'https://twitter.com/i/oauth2/authorize',
    linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
    facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
    instagram: 'https://api.instagram.com/oauth/authorize',
    reddit: 'https://www.reddit.com/api/v1/authorize'
  };

  // Ensure these scopes are configured in your respective social media developer apps
  const scopes: Record<OAuthPlatform, string> = {
    twitter: 'tweet.read tweet.write users.read offline.access',
    linkedin: 'openid profile email w_member_social',  // OpenID Connect + posting permission
    facebook: 'pages_manage_posts,pages_read_engagement,publish_to_groups',
    instagram: 'user_profile,user_media',
    reddit: 'identity submit'
  };

  if (!baseUrls[platform]) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Use provided state or generate a new one
  const state = config.state || `oauth_${Math.random().toString(36).substring(2)}_${platform}`;
  if (!config.state) {
    sessionStorage.setItem(`${platform}_oauth_state`, state); // Only store if we generated it
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: scopes[platform],
    state: state
  });

  // Add platform-specific parameters
  if (platform === 'twitter') {
    // For Twitter OAuth 2.0 with PKCE (Proof Key for Code Exchange)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier in session storage for later use by the backend
    sessionStorage.setItem('twitter_code_verifier', codeVerifier);
    
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  if (platform === 'reddit') {
    // Reddit specific parameters: request a permanent token if desired
    params.set('duration', 'permanent');
  }

  const url = `${baseUrls[platform]}?${params.toString()}`;
  console.log(`Generated OAuth URL for ${platform}:`, url);
  console.log(`OAuth URL Parameters for ${platform}:`, Object.fromEntries(params));
  
  return url;
};

// PKCE helpers (remain on frontend, as they are part of the client-side PKCE flow)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

function base64URLEncode(array: Uint8Array): string {
  // btoa only works with Latin-1 characters, but for Uint8Array it's fine for crypto hashes
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}