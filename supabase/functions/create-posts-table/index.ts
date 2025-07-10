import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use direct PostgreSQL connection
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL')
    
    if (!databaseUrl) {
      throw new Error('Database URL not available')
    }

    // Import PostgreSQL client
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts")
    
    const client = new Client(databaseUrl)
    await client.connect()

    console.log('🚀 Creating posts table...')

    // Create posts table (without foreign key constraint for demo)
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'facebook', 'reddit')),
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
        scheduled_at TIMESTAMP WITH TIME ZONE,
        published_at TIMESTAMP WITH TIME ZONE,
        image_url TEXT,
        platform_post_ids JSONB DEFAULT '{}',
        engagement_stats JSONB DEFAULT '{}',
        generated_by_ai BOOLEAN DEFAULT false,
        ai_prompt TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Disable RLS for demo purposes (enable later when you have real users)
    await client.queryObject(`ALTER TABLE posts DISABLE ROW LEVEL SECURITY;`)

    console.log('⚠️ RLS disabled for demo purposes. Enable it later when you have real user authentication.')

    // Create indexes
    await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);`)
    await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);`)
    await client.queryObject(`CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);`)

    await client.end()

    console.log('✅ Posts table created successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Posts table created successfully!',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error:', error)
    
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
