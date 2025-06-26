# Content Library Setup Guide

This guide will help you set up the Content Library feature that shows all your social media posts from the database.

## 🎯 What's New

The Content Library page now shows **real posts from your Supabase database** instead of mock data. It includes:

- ✅ All posts you've created and posted
- ✅ Post status (Draft, Scheduled, Published, Failed)
- ✅ Multiple platform support
- ✅ Image attachments
- ✅ AI-generated content tracking
- ✅ Error messages for failed posts
- ✅ Engagement statistics
- ✅ Search and filtering

## 🗄️ Database Setup

### Option 1: Run SQL Directly in Supabase Dashboard

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `setup-posts-table.sql`
3. Click "Run" to execute the SQL

### Option 2: Use the Setup Script

1. Set your Supabase service role key:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. Run the setup script:
   ```bash
   node setup-posts-table.js
   ```

## 📊 Database Schema

The `posts` table includes these fields:

- `id` - Unique post identifier
- `user_id` - Links to authenticated user
- `content` - Post text content
- `platforms` - Array of platforms (e.g., ['twitter', 'linkedin'])
- `status` - 'draft', 'scheduled', 'published', or 'failed'
- `scheduled_for` - When the post is scheduled
- `published_at` - When the post was published
- `image_url` - URL of attached image
- `platform_post_ids` - Platform-specific post IDs
- `engagement_stats` - Likes, shares, comments per platform
- `generated_by_ai` - Whether content was AI-generated
- `ai_prompt` - Original AI prompt used
- `error_message` - Error details for failed posts
- `created_at` / `updated_at` - Timestamps

## 🔄 How It Works

### Automatic Post Saving

When you post content using the app, it automatically:

1. **Saves successful posts** with status 'published'
2. **Saves failed posts** with status 'failed' and error details
3. **Tracks platform-specific post IDs** for engagement tracking
4. **Stores image URLs** from Supabase storage

### Real-Time Updates

The Content Library:

- ✅ Fetches real data from Supabase
- ✅ Updates automatically when you create new posts
- ✅ Shows loading states and error handling
- ✅ Supports search and filtering
- ✅ Displays engagement metrics

## 🎨 Features

### Stats Dashboard
- Total posts count
- Drafts, Scheduled, Published, Failed counts
- Real-time statistics

### Post Management
- View all posts with images
- Filter by status and platform
- Search through post content
- Delete posts with confirmation
- View error messages for failed posts

### Visual Indicators
- Status badges with icons
- Platform-specific colors
- AI-generated content badges
- Image previews
- Error message alerts

## 🚀 Usage

1. **Create posts** using the normal posting flow
2. **View Content Library** - All posts automatically appear
3. **Filter and search** to find specific content
4. **Track performance** with engagement stats
5. **Manage content** with edit/delete actions

## 🔧 Customization

You can extend the system by:

- Adding more engagement metrics
- Implementing post scheduling
- Adding post templates
- Creating content analytics
- Building content approval workflows

## 📝 Notes

- Posts are automatically saved when you use the posting features
- Failed posts are tracked with error messages
- The system supports multiple platforms per post
- All data is secured with Row Level Security (RLS)
- Images are stored in Supabase Storage and linked to posts

Your Content Library is now ready to track all your social media activity! 🎉
