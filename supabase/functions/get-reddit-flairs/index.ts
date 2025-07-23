import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`🚀 [FLAIR FUNCTION] Request received: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [FLAIR FUNCTION] CORS preflight handled`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`[Auth] ✅ User authenticated: ${user.id} (${user.email})`);

    const body = await req.json();
    console.log(`📋 [FLAIR FUNCTION] Request body:`, body);

    const { subreddit } = body;

    if (!subreddit) {
      console.error(`❌ [FLAIR FUNCTION] No subreddit provided in request`);
      return new Response(JSON.stringify({
        error: "Subreddit is required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🎯 [FLAIR FUNCTION] Fetching flairs for r/${subreddit}`);

    // Get Reddit credentials for the user
    const { data: credentials, error: credError } = await supabaseClient
      .from('social_accounts')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('platform', 'reddit')
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      console.error('[Reddit Flairs] No Reddit credentials found:', credError);
      return new Response(JSON.stringify({
        error: "Reddit account not connected. Please connect your Reddit account in Settings.",
        flairs: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('[Reddit Flairs] Reddit credentials found');

    // Fetch flairs from Reddit API
    const flairs = await fetchSubredditFlairs(subreddit, credentials.access_token);

    return new Response(JSON.stringify({
      success: true,
      subreddit,
      flairs
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[Reddit Flairs] Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      flairs: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})

// Function to fetch subreddit flairs from Reddit API
async function fetchSubredditFlairs(subreddit: string, accessToken: string) {
  try {
    console.log(`[Reddit Flairs] Fetching flairs for r/${subreddit}`);

    // First, test the token by getting user info
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`Reddit authentication failed. Please reconnect your Reddit account in Settings.`);
    }

    // Fetch subreddit flairs
    const flairResponse = await fetch(`https://oauth.reddit.com/r/${subreddit}/api/link_flair_v2`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'SocialMediaScheduler/1.0 by YourUsername'
      }
    });

    if (!flairResponse.ok) {
      if (flairResponse.status === 403) {
        console.log(`[Reddit Flairs] No access to r/${subreddit} flairs (private/restricted)`);
        return [];
      } else if (flairResponse.status === 404) {
        console.log(`[Reddit Flairs] Subreddit r/${subreddit} not found or no flairs`);
        return [];
      }
      throw new Error(`Reddit API error: ${flairResponse.status}`);
    }

    const flairData = await flairResponse.json();
    console.log(`[Reddit Flairs] Raw flair data:`, flairData);

    // Parse flairs into our format (using flair_template_id as per Reddit API)
    const flairs = flairData.map((flair: any) => ({
      id: flair.flair_template_id || flair.id,  // Use flair_template_id for posting
      text: flair.flair_text || flair.text || 'Unnamed Flair',
      color: flair.background_color,
      textColor: flair.text_color,
      editable: flair.flair_text_editable || false
    }));

    console.log(`[Reddit Flairs] ✅ Found ${flairs.length} flairs for r/${subreddit}`);
    return flairs;

  } catch (error) {
    console.error(`[Reddit Flairs] Error fetching flairs for r/${subreddit}:`, error);
    return [];
  }
}
