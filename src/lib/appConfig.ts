// src/lib/appConfig.ts

// Application OAuth Configuration
// Note: These are public CLIENT IDs, not secret keys.
// These values are used by your frontend to start the connection process.

export const AppConfig = {
  twitter: {
    // This is your real, correct Client ID for X/Twitter.
    clientId: "ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ"
  },
  reddit: {
    // This is your real, correct Client ID for Reddit.
    clientId: "kBrkkv-sRC-3jE9RIUt6-g"
  },
  linkedin: {
    // LinkedIn Client ID - Updated to match your actual LinkedIn app
    // From your LinkedIn Developer Console: 78yhh9neso7awt
    clientId: "78yhh9neso7awt"
  },
  facebook: {
    // Your real Facebook App ID from the Meta Developer Portal
    clientId: "772026995163778"
  },
  instagram: {
    // Instagram OAuth uses the main Facebook App ID, not the Instagram-specific ID
    clientId: "772026995163778"
  }
};
