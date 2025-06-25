#!/usr/bin/env node

console.log('🔧 INSTAGRAM ENVIRONMENT SETUP');
console.log('===============================\n');

console.log('📋 REQUIRED ENVIRONMENT VARIABLES:');
console.log('===================================');

console.log('1. INSTAGRAM_CLIENT_ID');
console.log('   Value: 772026995163778');
console.log('   Description: Your Facebook App ID (same as Facebook)');
console.log('');

console.log('2. INSTAGRAM_CLIENT_SECRET');
console.log('   Value: [GET FROM FACEBOOK DEVELOPER CONSOLE]');
console.log('   Description: Your Facebook App Secret (same as Facebook)');
console.log('');

console.log('🔗 HOW TO GET THE APP SECRET:');
console.log('=============================');
console.log('1. Go to: https://developers.facebook.com/apps/772026995163778/settings/basic/');
console.log('2. Find "App Secret" field');
console.log('3. Click "Show" button');
console.log('4. Copy the secret value');
console.log('');

console.log('⚙️ HOW TO SET IN SUPABASE:');
console.log('==========================');
console.log('1. Go to: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/settings/edge-functions');
console.log('2. Scroll to "Environment Variables" section');
console.log('3. Add these variables:');
console.log('');
console.log('   Variable Name: INSTAGRAM_CLIENT_ID');
console.log('   Value: 772026995163778');
console.log('');
console.log('   Variable Name: INSTAGRAM_CLIENT_SECRET');
console.log('   Value: [YOUR_APP_SECRET_FROM_FACEBOOK]');
console.log('');

console.log('✅ VERIFICATION STEPS:');
console.log('======================');
console.log('After setting the environment variables:');
console.log('1. Deploy your edge functions (they auto-deploy on save)');
console.log('2. Test Instagram connection in your app');
console.log('3. Check browser console for any OAuth errors');
console.log('');

console.log('🚨 IMPORTANT NOTES:');
console.log('===================');
console.log('• Instagram uses the SAME App ID and Secret as Facebook');
console.log('• Make sure your Instagram account is connected to a Facebook Page');
console.log('• Your Instagram must be a Business Account (not Personal)');
console.log('• The Facebook Page must have admin permissions for your Instagram');
console.log('');

console.log('🔍 TROUBLESHOOTING:');
console.log('===================');
console.log('If Instagram connection fails:');
console.log('1. Check that INSTAGRAM_CLIENT_SECRET matches your Facebook App Secret');
console.log('2. Verify your Instagram is linked to a Facebook Page');
console.log('3. Ensure your Instagram is set to Business Account');
console.log('4. Check browser console for detailed error messages');
console.log('');

console.log('📞 NEXT STEPS:');
console.log('==============');
console.log('1. Get your App Secret from Facebook Developer Console');
console.log('2. Set both environment variables in Supabase');
console.log('3. Test the Instagram connection in your app');
console.log('4. If it works, you can start posting to Instagram! 🎉');
