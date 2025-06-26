-- Quick test - add one post with your user ID
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

INSERT INTO posts (user_id, content, platforms, status, published_at, generated_by_ai, engagement_stats) VALUES
('YOUR_USER_ID_HERE', '🎉 Test post for Content Library! If you can see this, everything is working perfectly!', ARRAY['twitter'], 'published', NOW(), false, '{"twitter": {"likes": 5, "shares": 1}}');

-- Check if it worked
SELECT * FROM posts WHERE user_id = 'YOUR_USER_ID_HERE';
