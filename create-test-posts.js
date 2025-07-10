// Script to create test posts for the Content Library
// Run this in browser console to add sample posts

const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs";

async function createTestPosts() {
    console.log('🚀 Creating test posts for Content Library...');
    
    // Get current user (you'll need to be logged in)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        console.error('❌ User not authenticated:', userError);
        alert('Please log in first, then run this script again.');
        return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Sample posts data
    const testPosts = [
        {
            user_id: user.id,
            content: "🚀 Just launched my new social media scheduler! Excited to share content across all platforms seamlessly. #productivity #socialmedia #tech",
            platform: "twitter",
            status: "published",
            published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            platform_post_ids: { twitter: "1234567890" },
            engagement_stats: { twitter: { likes: 45, retweets: 12, replies: 8 } },
            generated_by_ai: false,
            retry_count: 0
        },
        {
            user_id: user.id,
            content: "Working on some exciting new features for content creators. AI-powered content generation is the future! 🤖✨ #AI #contentcreation #innovation",
            platform: "linkedin",
            status: "published",
            published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            platform_post_ids: { linkedin: "activity-9876543210" },
            engagement_stats: { linkedin: { likes: 78, comments: 15, shares: 23 } },
            generated_by_ai: true,
            ai_prompt: "Create a professional post about AI in content creation",
            retry_count: 0
        },
        {
            user_id: user.id,
            content: "Beautiful sunset from my office window today 🌅 Sometimes you need to pause and appreciate the simple moments. #sunset #mindfulness #worklife",
            platform: "instagram",
            status: "scheduled",
            scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            platform_post_ids: {},
            engagement_stats: {},
            generated_by_ai: false,
            retry_count: 0
        },
        {
            user_id: user.id,
            content: "Draft post about the importance of consistent social media presence. Need to add more statistics and examples before publishing.",
            platform: "facebook",
            status: "draft",
            platform_post_ids: {},
            engagement_stats: {},
            generated_by_ai: false,
            retry_count: 0
        },
        {
            user_id: user.id,
            content: "TIL: The best time to post on social media varies by platform and audience. Here's what I've learned from analyzing engagement data... 📊",
            platform: "reddit",
            status: "scheduled",
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
            platform_post_ids: {},
            engagement_stats: {},
            generated_by_ai: true,
            ai_prompt: "Create an educational post about social media timing",
            retry_count: 0
        },
        {
            user_id: user.id,
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
    
    try {
        console.log('📝 Inserting test posts...');
        
        const { data, error } = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(testPosts)
        });
        
        if (!data.ok) {
            const errorText = await data.text();
            throw new Error(`HTTP ${data.status}: ${errorText}`);
        }
        
        const result = await data.json();
        console.log('✅ Test posts created successfully:', result);
        
        // Show success message
        alert(`✅ Success! Created ${testPosts.length} test posts. Refresh the Content Library page to see them.`);
        
        // Optionally refresh the page
        if (confirm('Refresh the page to see the new posts?')) {
            window.location.reload();
        }
        
    } catch (error) {
        console.error('❌ Error creating test posts:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

// Check if we're in browser environment
if (typeof window !== 'undefined') {
    // Make functions available globally
    window.createTestPosts = createTestPosts;
    
    console.log('🎯 Test Posts Creator Loaded!');
    console.log('📋 To create test posts, run: createTestPosts()');
    console.log('⚠️  Make sure you are logged in first!');
} else {
    // Node.js environment
    createTestPosts();
}
