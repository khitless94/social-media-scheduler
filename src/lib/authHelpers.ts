// Helper functions for OAuth security

// Generates a secure random string for the 'state' and 'code_verifier'
export function generateRandomString(length = 43) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => String.fromCharCode(byte))
    .join('')
    .replace(/\W/g, '') // Remove non-word characters
    .slice(0, length);
}

// Creates the PKCE code challenge from the verifier
export async function createPkceChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}