// 📦 Supabase Edge Function: Upload Supabase image to Twitter and post tweet with image
// ✅ Uses OAuth 1.0a (REQUIRED for Twitter media upload)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OAuth from "https://esm.sh/oauth-1.0a@2.2.6";
import { HmacSHA1 } from "https://esm.sh/crypto-js@4.1.1/hmac-sha1";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json();
    const { imageUrl, tweetText } = body;

    console.log(`[Twitter Image Post] Starting process for image: ${imageUrl}`);
    console.log(`[Twitter Image Post] Tweet text: ${tweetText}`);

    // Note: This function doesn't need Supabase client for Twitter posting
    // const supabase = createClient(
    //   Deno.env.get("SUPABASE_URL")!,
    //   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    // );

    // Twitter OAuth 1.0a setup
    const oauth = new OAuth({
      consumer: {
        key: Deno.env.get("TWITTER_CONSUMER_KEY")!,
        secret: Deno.env.get("TWITTER_CONSUMER_SECRET")!,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return HmacSHA1(base_string, key).toString();
      },
    });

    const token = {
      key: Deno.env.get("TWITTER_ACCESS_TOKEN")!,
      secret: Deno.env.get("TWITTER_ACCESS_SECRET")!,
    };

    // Step 1: Download image from Supabase URL
    console.log(`[Twitter Image Post] Step 1: Downloading image from Supabase`);
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download image: ${imageRes.status} ${imageRes.statusText}`);
    }
    
    const imageBuffer = new Uint8Array(await imageRes.arrayBuffer());
    console.log(`[Twitter Image Post] Image downloaded, size: ${imageBuffer.length} bytes`);

    // Step 2: Upload image to Twitter using OAuth 1.0a
    console.log(`[Twitter Image Post] Step 2: Uploading image to Twitter Media API`);
    const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
    const uploadHeaders = oauth.toHeader(
      oauth.authorize({ url: uploadUrl, method: "POST" }, token)
    );

    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        ...uploadHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Length": imageBuffer.length.toString(),
      },
      body: imageBuffer,
    });

    const uploadData = await uploadResp.json();
    console.log(`[Twitter Image Post] Upload response:`, uploadData);

    if (!uploadData.media_id_string) {
      throw new Error(`Image upload failed: ${JSON.stringify(uploadData)}`);
    }

    console.log(`[Twitter Image Post] ✅ Image uploaded successfully, media_id: ${uploadData.media_id_string}`);

    // Step 3: Post tweet with image using Bearer token
    console.log(`[Twitter Image Post] Step 3: Posting tweet with embedded image`);
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("TWITTER_BEARER_TOKEN")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: tweetText,
        media: {
          media_ids: [uploadData.media_id_string],
        },
      }),
    });

    const tweetResult = await tweetRes.json();
    console.log(`[Twitter Image Post] Tweet response:`, tweetResult);

    if (!tweetRes.ok) {
      throw new Error(`Tweet posting failed: ${JSON.stringify(tweetResult)}`);
    }

    console.log(`[Twitter Image Post] ✅ Tweet posted successfully with embedded image!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tweet: tweetResult,
        media_id: uploadData.media_id_string,
        message: "Tweet posted successfully with embedded image"
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (err) {
    console.error(`[Twitter Image Post] Error:`, err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message,
        details: err.toString()
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
