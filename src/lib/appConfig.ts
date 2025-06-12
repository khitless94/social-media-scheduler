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
    // From your LinkedIn Developer Console: 86z7443djn3cgx
    clientId: "86z7443djn3cgx"
  },
  facebook: {
    // TODO: Replace this with your real Facebook App ID from the Meta Developer Portal.
    clientId: "2249146282214303"
  },
  instagram: {
    // Instagram uses the exact same App ID as your Facebook app.
    // TODO: Replace this with your real Facebook App ID.
    clientId: "2249146282214303"
  }
};
