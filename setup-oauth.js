#!/usr/bin/env node

/**
 * OAuth Setup Script
 * This script helps you configure your social media API keys
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 OAuth Setup Script for Social Media Scheduler');
console.log('================================================\n');

console.log('❌ AUTHENTICATION FAILED ERROR DETECTED');
console.log('This error occurs because your social media API secrets are not configured.\n');

console.log('🚀 QUICK FIX STEPS:');
console.log('1. Get your API secrets from each platform\'s developer portal');
console.log('2. Set them in your Supabase Dashboard');
console.log('3. Test the authentication again\n');

console.log('📋 REQUIRED API SECRETS:');
console.log('========================\n');

const platforms = [
  {
    name: 'Twitter/X',
    clientId: 'ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ',
    secretVar: 'TWITTER_CLIENT_SECRET',
    portal: 'https://developer.twitter.com/en/portal/dashboard',
    instructions: 'Find your app → Keys and Tokens → Client Secret'
  },
  {
    name: 'Reddit',
    clientId: 'kBrkkv-sRC-3jE9RIUt6-g',
    secretVar: 'REDDIT_CLIENT_SECRET',
    portal: 'https://www.reddit.com/prefs/apps',
    instructions: 'Find your app → Copy the secret (below the app name)'
  },
  {
    name: 'LinkedIn',
    clientId: '86z7443djn3cgx',
    secretVar: 'LINKEDIN_CLIENT_SECRET',
    portal: 'https://www.linkedin.com/developers/apps',
    instructions: 'Find your app → Auth → Client Secret'
  },
  {
    name: 'Facebook',
    clientId: '2249146282214303',
    secretVar: 'FACEBOOK_CLIENT_SECRET',
    portal: 'https://developers.facebook.com/apps',
    instructions: 'Find your app → Settings → Basic → App Secret'
  },
  {
    name: 'Instagram',
    clientId: '2249146282214303',
    secretVar: 'INSTAGRAM_CLIENT_SECRET',
    portal: 'https://developers.facebook.com/apps',
    instructions: 'Same as Facebook - Find your app → Settings → Basic → App Secret'
  }
];

platforms.forEach((platform, index) => {
  console.log(`${index + 1}. ${platform.name}`);
  console.log(`   Client ID: ${platform.clientId}`);
  console.log(`   Secret Variable: ${platform.secretVar}`);
  console.log(`   Developer Portal: ${platform.portal}`);
  console.log(`   Instructions: ${platform.instructions}\n`);
});

console.log('🔗 SUPABASE CONFIGURATION:');
console.log('==========================');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select project: eqiuukwwpdiyncahrdny');
console.log('3. Navigate to: Project Settings → Edge Functions → Environment Variables');
console.log('4. Add each secret variable listed above\n');

console.log('✅ VERIFICATION:');
console.log('================');
console.log('After setting the environment variables:');
console.log('1. Visit your app: http://localhost:8082/debug-auth');
console.log('2. Click "Check Environment Variables"');
console.log('3. Verify all secrets show "✅ Set"');
console.log('4. Test connecting a social media account\n');

console.log('🆘 NEED HELP?');
console.log('=============');
console.log('If you\'re still having issues:');
console.log('1. Check the browser console for detailed error messages');
console.log('2. Look at Supabase Edge Function logs');
console.log('3. Verify redirect URIs in each platform\'s app settings');
console.log('4. Make sure your apps have the required permissions\n');

console.log('📝 REDIRECT URI FOR ALL PLATFORMS:');
console.log('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback\n');

console.log('🎯 This script has created a .env.local file with placeholders.');
console.log('Replace the placeholder values with your actual API secrets.\n');

// Create a sample environment file
const envContent = `# Environment Variables for Social Media Scheduler
# Replace the placeholder values with your actual API secrets

# Supabase Configuration
VITE_SUPABASE_URL=https://eqiuukwwpdiyncahrdny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs

# Frontend URL
YOUR_FRONTEND_URL=http://localhost:8082

# Social Media API Secrets (REPLACE WITH YOUR ACTUAL SECRETS)
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret_here
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret_here
`;

fs.writeFileSync('.env.example', envContent);
console.log('✅ Created .env.example file with configuration template');
console.log('💡 Copy this to .env and fill in your actual secrets for local development');
