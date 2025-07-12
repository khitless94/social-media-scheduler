import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platform, refreshToken, userId } = await req.json()

    if (!platform || !refreshToken || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔄 Refreshing ${platform} token for user ${userId}`)

    let newTokenData;

    switch (platform.toLowerCase()) {
      case 'twitter':
        newTokenData = await refreshTwitterToken(refreshToken);
        break;
      case 'linkedin':
        newTokenData = await refreshLinkedInToken(refreshToken);
        break;
      case 'facebook':
      case 'instagram':
        newTokenData = await refreshFacebookToken(refreshToken);
        break;
      case 'reddit':
        newTokenData = await refreshRedditToken(refreshToken);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Update the database with new tokens
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: updateError } = await supabase
      .from('oauth_credentials')
      .update({
        access_token: newTokenData.accessToken,
        refresh_token: newTokenData.refreshToken || refreshToken,
        expires_at: newTokenData.expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', platform)

    if (updateError) {
      throw new Error(`Failed to update credentials: ${updateError.message}`)
    }

    console.log(`✅ Successfully refreshed ${platform} token`)

    return new Response(
      JSON.stringify({ 
        accessToken: newTokenData.accessToken,
        expiresAt: newTokenData.expiresAt
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error refreshing token:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function refreshTwitterToken(refreshToken: string) {
  const clientId = Deno.env.get('TWITTER_CLIENT_ID')!
  const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')!
  
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Twitter token refresh failed: ${error}`)
  }

  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
  }
}

async function refreshLinkedInToken(refreshToken: string) {
  const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')!
  const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')!
  
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LinkedIn token refresh failed: ${error}`)
  }

  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
  }
}

async function refreshFacebookToken(refreshToken: string) {
  const appId = Deno.env.get('FACEBOOK_APP_ID')!
  const appSecret = Deno.env.get('FACEBOOK_APP_SECRET')!
  
  const response = await fetch(`https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${refreshToken}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Facebook token refresh failed: ${error}`)
  }

  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Facebook doesn't provide new refresh tokens
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
  }
}

async function refreshRedditToken(refreshToken: string) {
  const clientId = Deno.env.get('REDDIT_CLIENT_ID')!
  const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')!
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'User-Agent': 'SocialMediaScheduler/1.0'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Reddit token refresh failed: ${error}`)
  }

  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Reddit doesn't provide new refresh tokens
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString()
  }
}
