import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const platform = url.searchParams.get('platform');

    if (!userId || !platform) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: user_id and platform are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log(`[Disconnect] Disconnecting ${platform} for user ${userId}`);

    // Delete from oauth_credentials table (the correct table name)
    const { error: deleteError } = await supabase
      .from('oauth_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (deleteError) {
      console.error(`[Disconnect] Failed to delete ${platform} account:`, deleteError);
      return new Response(JSON.stringify({ 
        error: 'Failed to disconnect account',
        details: deleteError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Also clean up any pending oauth sessions for this user/platform
    await supabase
      .from('oauth_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    console.log(`[Disconnect] Successfully disconnected ${platform} for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `${platform} account disconnected successfully. You can now reconnect your account.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[Disconnect] Error:', error.message);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});