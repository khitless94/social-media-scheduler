import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Create OAuth Session] Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { state, user_id, platform, code_verifier, expires_at } = await req.json();

    // Validate required fields
    if (!state || !user_id || !platform || !expires_at) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the user_id matches the authenticated user
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Create OAuth Session] Creating session for ${platform} with state: ${state}`);

    // Clean up any existing sessions for this user/platform
    const { error: deleteError } = await supabase
      .from('oauth_sessions')
      .delete()
      .eq('user_id', user_id)
      .eq('platform', platform);

    if (deleteError) {
      console.warn(`[Create OAuth Session] Warning: Could not clean up existing sessions:`, deleteError);
    }

    // Insert new session
    const sessionData = {
      state,
      user_id,
      platform,
      code_verifier,
      expires_at,
    };

    const { data: insertedSession, error: insertError } = await supabase
      .from('oauth_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error('[Create OAuth Session] Insert error:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create OAuth session',
        details: insertError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Create OAuth Session] Session created successfully:`, insertedSession);

    return new Response(JSON.stringify({ 
      success: true, 
      session: insertedSession 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Create OAuth Session] Error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
