// Script to set up the posts table in Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eqiuukwwpdiyncahrdny.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPostsTable() {
  try {
    console.log('🚀 Setting up posts table...');
    
    // Read the SQL file
    const sql = fs.readFileSync('setup-posts-table.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error setting up posts table:', error);
      return;
    }
    
    console.log('✅ Posts table setup completed successfully!');
    console.log('📊 You can now view posts in the Content Library page');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Alternative method using direct SQL execution
async function setupPostsTableDirect() {
  try {
    console.log('🚀 Setting up posts table directly...');
    
    // Create the table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        -- Create posts table to store all social media posts
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          platforms TEXT[] NOT NULL,
          status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
          scheduled_for TIMESTAMP WITH TIME ZONE,
          published_at TIMESTAMP WITH TIME ZONE,
          image_url TEXT,
          platform_post_ids JSONB DEFAULT '{}',
          engagement_stats JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          generated_by_ai BOOLEAN DEFAULT FALSE,
          ai_prompt TEXT,
          error_message TEXT,
          retry_count INTEGER DEFAULT 0
        );
      `
    });
    
    if (tableError) {
      console.error('❌ Error creating table:', tableError);
      return;
    }
    
    console.log('✅ Posts table created successfully!');
    
    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for);
        CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      `
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return;
    }
    
    console.log('✅ Indexes created successfully!');
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view their own posts" ON posts
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can insert their own posts" ON posts
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can update their own posts" ON posts
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can delete their own posts" ON posts
          FOR DELETE USING (auth.uid() = user_id);
      `
    });
    
    if (rlsError) {
      console.error('❌ Error setting up RLS:', rlsError);
      return;
    }
    
    console.log('✅ Row Level Security policies created successfully!');
    console.log('🎉 Posts table setup completed! You can now use the Content Library.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the setup
setupPostsTableDirect();
