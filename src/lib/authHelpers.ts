// Helper functions for OAuth security

// Generates a secure random string for the 'state' and 'code_verifier'
// Twitter requires code_verifier to be 43-128 characters, base64url-encoded
export function generateRandomString(length = 128) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);

  // Convert to base64url format (Twitter requirement)
  return btoa(String.fromCharCode.apply(null, [...array]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
    .slice(0, length);
}

// Creates the PKCE code challenge from the verifier (Twitter OAuth 2.0 requirement)
export async function createPkceChallenge(verifier: string) {
  console.log(`[PKCE] Creating challenge for verifier: ${verifier.substring(0, 10)}...`);

  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  console.log(`[PKCE] Generated challenge: ${challenge.substring(0, 10)}...`);
  return challenge;
}