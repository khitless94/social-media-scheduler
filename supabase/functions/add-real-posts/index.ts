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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Adding real posts with demo user...')

    // Create a demo user ID for initial setup
    const demoUserId = '00000000-0000-0000-0000-000000000000'

    // Real test posts
    const testPosts = [
      {
        user_id: demoUserId,
        content: "🚀 Just launched my new social media scheduler! Excited to share content across all platforms seamlessly. #productivity #socialmedia #tech",
        platform: "twitter",
        status: "published",
        published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        platform_post_ids: { twitter: "1234567890" },
        engagement_stats: { twitter: { likes: 45, retweets: 12, replies: 8 } },
        generated_by_ai: false,
        retry_count: 0
      },
      {
        user_id: demoUserId,
        content: "Working on some exciting new features for content creators. AI-powered content generation is the future! 🤖✨ #AI #contentcreation",
        platform: "linkedin",
        status: "published",
        published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        platform_post_ids: { linkedin: "activity-9876543210" },
        engagement_stats: { linkedin: { likes: 78, comments: 15, shares: 23 } },
        generated_by_ai: true,
        ai_prompt: "Create a professional post about AI in content creation",
        retry_count: 0
      },
      {
        user_id: demoUserId,
        content: "Beautiful sunset from my office window today 🌅 Sometimes you need to pause and appreciate the simple moments. #sunset #mindfulness",
        platform: "instagram",
        status: "scheduled",
        scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        platform_post_ids: {},
        engagement_stats: {},
        generated_by_ai: false,
        retry_count: 0
      },
      {
        user_id: demoUserId,
        content: "Draft post about the importance of consistent social media presence. Need to add more statistics and examples before publishing.",
        platform: "facebook",
        status: "draft",
        platform_post_ids: {},
        engagement_stats: {},
        generated_by_ai: false,
        retry_count: 0
      },
      {
        user_id: demoUserId,
        content: "TIL: The best time to post on social media varies by platform and audience. Here's what I've learned from analyzing engagement data... 📊",
        platform: "reddit",
        status: "scheduled",
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        platform_post_ids: {},
        engagement_stats: {},
        generated_by_ai: true,
        ai_prompt: "Create an educational post about social media timing",
        retry_count: 0
      },
      {
        user_id: demoUserId,
        content: "Failed to post this earlier due to API limits. Will retry later. Content about the latest social media trends and predictions for 2024.",
        platform: "twitter",
        status: "failed",
        error_message: "Rate limit exceeded",
        platform_post_ids: {},
        engagement_stats: {},
        generated_by_ai: false,
        retry_count: 2
      }
    ];

    // Insert posts using service role key (bypasses RLS)
    const { data, error } = await supabaseClient
      .from('posts')
      .insert(testPosts)
      .select()

    if (error) {
      throw error
    }

    console.log('✅ Added real posts successfully:', data.length)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Added ${data.length} real posts successfully!`,
        posts: data,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error adding posts:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
