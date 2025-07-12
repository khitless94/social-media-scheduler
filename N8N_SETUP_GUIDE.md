# 🚀 Enhanced n8n Scheduled Posting Setup Guide

## Overview
This comprehensive guide will help you set up n8n to handle scheduled posting for your social media scheduler app. The enhanced system includes robust error handling, comprehensive platform support, and production-ready features.

## 🏗️ Architecture

```
Your App → Supabase → n8n → Social Media APIs
    ↓         ↓        ↓         ↓
  Schedule   Store    Execute   Publish
   Posts    Queue    Workflow   Posts
    ↓         ↓        ↓         ↓
  Monitor   Track    Log       Update
  Status    Queue    Results   Database
```

## ✨ Enhanced Features

### 🔧 Workflow Improvements
- **Individual post processing** with proper error isolation
- **Comprehensive error handling** with detailed logging
- **Rate limiting** between platform posts
- **Token expiration checking** and validation
- **Media upload support** (framework ready)
- **Partial success handling** (some platforms succeed, others fail)

### 📱 Platform Support
- **Twitter API v2** with proper error handling
- **Facebook Graph API** with link preview support
- **Instagram Business API** with media container workflow
- **LinkedIn API** with dynamic person ID resolution
- **Reddit API** with subreddit configuration
- **Extensible architecture** for additional platforms

## 📋 Prerequisites

1. **n8n Instance** (self-hosted or cloud)
2. **Supabase Database** (already configured)
3. **Social Media API Credentials** (Twitter, Facebook, Instagram, LinkedIn, Reddit)
4. **Webhook URLs** (for status updates)

## 🔧 Step 1: Database Setup

### 1.1 Run Database Migrations
```sql
-- Run the SQL from database/scheduled_posts_schema.sql
-- This creates the necessary tables and functions
```

### 1.2 Verify Tables Created
- `posts` table updated with scheduling columns
- `scheduled_posts_queue` table created
- Functions `get_pending_scheduled_posts()` and `update_scheduled_post_status()` created

## 🔧 Step 2: n8n Installation & Setup

### 2.1 Install n8n (Choose one method)

#### Option A: Docker (Recommended)
```bash
# Create docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:

# Start n8n
docker-compose up -d
```

#### Option B: npm
```bash
npm install n8n -g
n8n start
```

#### Option C: n8n Cloud
- Sign up at https://n8n.cloud
- Create a new workflow

### 2.2 Access n8n
- Open http://localhost:5678 (self-hosted) or your n8n cloud URL
- Login with your credentials

## 🔧 Step 3: Configure Database Connection

### 3.1 Add Supabase Credentials
1. Go to **Settings** → **Credentials**
2. Click **Add Credential**
3. Select **Postgres**
4. Configure with your Supabase details:
   ```
   Host: db.eqiuukwwpdiyncahrdny.supabase.co
   Database: postgres
   User: postgres
   Password: [your_supabase_password]
   Port: 5432
   SSL: true
   ```
5. Name it "Supabase Database"

## 🔧 Step 4: Import Enhanced Workflow

### 4.1 Choose Workflow Version
**Option A: Enhanced Workflow (Recommended)**
```bash
# Import the enhanced workflow with comprehensive features
n8n/enhanced-scheduled-posting-workflow.json
```

**Option B: Basic Workflow**
```bash
# Import the basic workflow for simple setups
n8n/scheduled-posting-workflow.json
```

### 4.2 Import Process
1. In n8n, click **Import from File**
2. Upload `n8n/enhanced-scheduled-posting-workflow.json`
3. The workflow will be imported with all enhanced nodes

### 4.3 Configure Workflow Nodes
1. **Schedule Trigger**: Set to run every 1 minute (configurable)
2. **Postgres Nodes**: Select "Supabase Database" credential
3. **Enhanced Platform Publisher**: Review platform-specific configurations
4. **Error Handling**: Configure retry logic and notifications

### 4.4 Workflow Features
- **✅ Individual post processing** prevents one failure from affecting others
- **✅ Comprehensive logging** for debugging and monitoring
- **✅ Rate limiting** respects platform API limits
- **✅ Token validation** checks expiration before posting
- **✅ Partial success handling** updates status appropriately
- **✅ Detailed error messages** for troubleshooting

## 🔧 Step 5: Social Media API Configuration

### 5.1 Twitter API Setup
```javascript
// In the publishToTwitter function
const response = await $http.request({
  method: 'POST',
  url: 'https://api.twitter.com/2/tweets',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: { text: content }
});
```

### 5.2 Facebook API Setup
```javascript
// In the publishToFacebook function
const response = await $http.request({
  method: 'POST',
  url: 'https://graph.facebook.com/me/feed',
  body: {
    message: content,
    access_token: accessToken
  }
});
```

### 5.3 Instagram API Setup
```javascript
// In the publishToInstagram function
// Requires media upload first, then publish
const mediaResponse = await $http.request({
  method: 'POST',
  url: 'https://graph.instagram.com/me/media',
  body: {
    image_url: mediaUrls[0],
    caption: content,
    access_token: accessToken
  }
});
```

## 🔧 Step 6: Test the Workflow

### 6.1 Create Test Scheduled Post
```javascript
// In your app, create a test post
const testPost = await ScheduledPostService.createScheduledPost({
  content: "Test scheduled post from n8n!",
  platforms: ["twitter"],
  scheduled_for: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
  user_id: "your-user-id"
});
```

### 6.2 Monitor Execution
1. Go to **Executions** in n8n
2. Watch for the workflow to trigger
3. Check execution logs for any errors

## 🔧 Step 7: Production Configuration

### 7.1 Environment Variables
```bash
# Set these in your n8n environment
N8N_ENCRYPTION_KEY=your_encryption_key
N8N_USER_MANAGEMENT_JWT_SECRET=your_jwt_secret
WEBHOOK_URL=https://your-n8n-domain.com/
```

### 7.2 Webhook Configuration
```javascript
// Add webhook node for status updates back to your app
const webhookUrl = "https://your-app.com/api/webhooks/n8n-status";
await $http.request({
  method: 'POST',
  url: webhookUrl,
  body: {
    postId: postId,
    status: status,
    platformPostIds: platformPostIds
  }
});
```

## 🔧 Step 8: Monitoring & Maintenance

### 8.1 Set Up Monitoring
- Monitor n8n execution logs
- Set up alerts for failed executions
- Monitor database queue table

### 8.2 Error Handling
- Failed posts are marked with error messages
- Retry mechanism for temporary failures
- Manual retry option in your app

### 8.3 Rate Limiting
- Respect social media API rate limits
- Add delays between posts
- Implement exponential backoff for retries

## 🔧 Step 9: Security Considerations

### 9.1 Secure Credentials
- Use n8n credential encryption
- Rotate API keys regularly
- Use environment variables for sensitive data

### 9.2 Database Security
- Use RLS policies in Supabase
- Limit database user permissions
- Monitor database access logs

## 🚀 Usage in Your App

### 9.1 Schedule a Post
```typescript
import { useScheduledPosts } from '@/hooks/useScheduledPosts';

const { createScheduledPost } = useScheduledPosts();

const schedulePost = async () => {
  await createScheduledPost({
    content: "My scheduled post content",
    platforms: ["twitter", "linkedin"],
    scheduled_for: new Date("2024-01-15T10:00:00Z")
  });
};
```

### 9.2 Monitor Scheduled Posts
```typescript
const { scheduledPosts, queueStatus } = useScheduledPosts();

// Display scheduled posts
scheduledPosts.map(post => (
  <div key={post.id}>
    <p>{post.content}</p>
    <p>Status: {post.scheduling_status}</p>
    <p>Scheduled: {new Date(post.scheduled_for).toLocaleString()}</p>
  </div>
));
```

## 🔍 Troubleshooting

### Common Issues
1. **Workflow not triggering**: Check schedule trigger configuration
2. **Database connection failed**: Verify Supabase credentials
3. **Social media API errors**: Check API credentials and rate limits
4. **Posts stuck in processing**: Check n8n execution logs

### Debug Steps
1. Check n8n execution logs
2. Verify database queue table
3. Test API credentials manually
4. Check network connectivity

## 📊 Performance Optimization

### 10.1 Batch Processing
- Process multiple posts in single execution
- Implement batch size limits
- Add delays between batches

### 10.2 Caching
- Cache OAuth tokens
- Cache user preferences
- Implement connection pooling

## 🎯 Next Steps

1. **Deploy to Production**: Set up production n8n instance
2. **Add More Platforms**: Extend workflow for additional social media platforms
3. **Advanced Scheduling**: Add recurring posts, time zone support
4. **Analytics Integration**: Track posting success rates and engagement
5. **User Interface**: Build scheduling UI components in your app

Your n8n scheduled posting system is now ready! 🚀
