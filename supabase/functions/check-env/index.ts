// Environment checker function to help debug OAuth issues
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const envCheck = {
      supabase_url: Deno.env.get('SUPABASE_URL') ? '✅ Set' : '❌ Missing',
      supabase_service_key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✅ Set' : '❌ Missing',
      frontend_url: Deno.env.get('YOUR_FRONTEND_URL') || '❌ Missing',
      
      // Social Media API Keys
      twitter_client_id: Deno.env.get('TWITTER_CLIENT_ID') ? '✅ Set' : '❌ Missing',
      twitter_client_secret: Deno.env.get('TWITTER_CLIENT_SECRET') ? '✅ Set' : '❌ Missing',
      
      reddit_client_id: Deno.env.get('REDDIT_CLIENT_ID') ? '✅ Set' : '❌ Missing',
      reddit_client_secret: Deno.env.get('REDDIT_CLIENT_SECRET') ? '✅ Set' : '❌ Missing',
      
      linkedin_client_id: Deno.env.get('LINKEDIN_CLIENT_ID') ? '✅ Set' : '❌ Missing',
      linkedin_client_secret: Deno.env.get('LINKEDIN_CLIENT_SECRET') ? '✅ Set' : '❌ Missing',
      
      facebook_client_id: Deno.env.get('FACEBOOK_CLIENT_ID') ? '✅ Set' : '❌ Missing',
      facebook_client_secret: Deno.env.get('FACEBOOK_CLIENT_SECRET') ? '✅ Set' : '❌ Missing',
      
      instagram_client_id: Deno.env.get('INSTAGRAM_CLIENT_ID') ? '✅ Set' : '❌ Missing',
      instagram_client_secret: Deno.env.get('INSTAGRAM_CLIENT_SECRET') ? '✅ Set' : '❌ Missing',
    };

    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => value.includes('❌'))
      .map(([key]) => key);

    const response = {
      status: missingVars.length === 0 ? 'All environment variables configured' : 'Missing environment variables',
      environment_check: envCheck,
      missing_variables: missingVars,
      next_steps: missingVars.length > 0 ? [
        '1. Go to Supabase Dashboard → Project Settings → Edge Functions → Environment Variables',
        '2. Add the missing environment variables listed above',
        '3. Get API keys from respective developer portals (Twitter, Reddit, LinkedIn, Facebook)',
        '4. Redeploy edge functions if needed'
      ] : [
        'All environment variables are set!',
        'If you\'re still having issues, check the OAuth callback logs'
      ]
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Environment check error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to check environment',
      message: error.message
    }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
