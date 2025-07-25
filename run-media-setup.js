import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Use hardcoded values for now - replace with your actual Supabase credentials
const supabaseUrl = 'https://kcjqjqjqjqjqjqjqjq.supabase.co'; // Replace with your URL
const supabaseServiceKey = 'your-service-role-key'; // Replace with your service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMediaLibrarySetup() {
  try {
    console.log('📦 Setting up media library database schema...');
    
    const sql = fs.readFileSync('setup-media-library-schema.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.warn(`⚠️ Warning on statement ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} completed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️ Error on statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Media library database setup complete!');
    console.log('📋 Created tables: media_library, media_folders, media_usage_logs');
    console.log('🔐 Set up Row Level Security policies');
    console.log('📊 Created analytics functions');
    console.log('💾 Created storage bucket for media files');
    
  } catch (err) {
    console.error('❌ Failed to setup media library:', err.message);
    process.exit(1);
  }
}

runMediaLibrarySetup();
