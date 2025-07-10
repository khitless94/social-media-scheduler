// Script to fix database errors and create missing tables
// Run this in your browser console or as a Node.js script

const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs";

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
        // Test basic connection
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Basic connection test:', response.status);
        
        // Test profiles table
        const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        });
        
        if (profilesResponse.status === 200) {
            console.log('✅ Profiles table exists and is accessible');
        } else {
            console.log('❌ Profiles table issue:', profilesResponse.status, profilesResponse.statusText);
        }
        
        // Test user_preferences table
        const preferencesResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_preferences?select=count`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        });
        
        if (preferencesResponse.status === 200) {
            console.log('✅ User preferences table exists and is accessible');
        } else {
            console.log('❌ User preferences table issue:', preferencesResponse.status, preferencesResponse.statusText);
        }
        
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
    }
}

async function createMissingTables() {
    console.log('🔧 Attempting to create missing tables...');
    
    const createTablesSQL = `
        -- Create profiles table
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          full_name TEXT,
          country TEXT,
          sex TEXT,
          mobile_number TEXT,
          avatar_url TEXT,
          age INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- Create user_preferences table
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          email_notifications BOOLEAN DEFAULT true,
          push_notifications BOOLEAN DEFAULT false,
          marketing_notifications BOOLEAN DEFAULT true,
          security_notifications BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for profiles
        CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON profiles
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
          FOR UPDATE USING (auth.uid() = user_id);

        -- Create RLS policies for user_preferences
        CREATE POLICY IF NOT EXISTS "Users can view their own preferences" ON user_preferences
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can insert their own preferences" ON user_preferences
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY IF NOT EXISTS "Users can update their own preferences" ON user_preferences
          FOR UPDATE USING (auth.uid() = user_id);
    `;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql_query: createTablesSQL
            })
        });
        
        if (response.ok) {
            console.log('✅ Tables created successfully');
        } else {
            console.log('❌ Failed to create tables:', response.status, response.statusText);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    }
}

// Run the tests
console.log('🚀 Starting database diagnostics...');
testDatabaseConnection().then(() => {
    console.log('📋 Database test completed. Check the logs above for any issues.');
    console.log('💡 If you see table errors, you may need to run the SQL script in your Supabase dashboard.');
    console.log('📝 Copy the contents of setup-database-tables.sql and run it in Supabase SQL Editor.');
});
