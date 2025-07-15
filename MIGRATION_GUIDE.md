# Migration Guide: From Webhook to Cron Polling

This guide will help you migrate your existing webhook-based social media scheduler to the new cron polling approach.

## Overview

The new system replaces direct webhook calls with a database-driven approach where:
1. Frontend saves posts to the `scheduled_posts` table
2. n8n cron job polls the database every 5 minutes
3. Posts are processed automatically when their scheduled time arrives

## Key Changes

### 1. Database Schema
- New table: `scheduled_posts` (replaces the old `posts` table for scheduling)
- Simplified structure focused on scheduling
- Better RLS policies for security

### 2. Frontend Changes
- No more direct webhook calls
- Posts are saved to database immediately
- n8n handles the actual posting automatically

## Migration Steps

### Step 1: Update Your Imports

**Old:**
```typescript
import { useWebhookScheduler } from './webhook-frontend-integration';
import { createScheduledPost } from '@/services/scheduledPostService';
```

**New:**
```typescript
import { useCronPollingScheduler } from '@/hooks/useCronPollingScheduler';
import { CronPollingService } from '@/services/cronPollingService';
```

### Step 2: Replace Components

**Option A: Use the Drop-in Replacement Hook**
```typescript
// Replace your existing webhook scheduler with this
import { useScheduler } from '@/hooks/useScheduler';

// The API remains the same!
const { schedulePost, isScheduling } = useScheduler();
```

**Option B: Use the New Components Directly**
```typescript
// Replace your existing CreatePost component
import { CreatePostCronPolling } from '@/components/CreatePostCronPolling';

// Add scheduled posts list
import { ScheduledPostsList } from '@/components/ScheduledPostsList';

// Or use the full dashboard
import { CronPollingDashboard } from '@/pages/CronPollingDashboard';
```

### Step 3: Update Your Existing Components

#### For CreatePost.tsx:
```typescript
// OLD: Direct webhook call
const response = await fetch('https://k94.app.n8n.cloud/webhook/schedule-post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(webhookData)
});

// NEW: Save to database
const result = await CronPollingService.createScheduledPost({
  content,
  platform,
  scheduled_time: new Date(scheduledFor),
  title: platform === 'reddit' ? title : undefined,
  image_url: imageUrl,
  user_id: user.id
});
```

#### For CreatePostMinimal.tsx:
```typescript
// OLD: Using scheduledPostService
const scheduledPost = await createScheduledPost(scheduleData);

// NEW: Using CronPollingService
const scheduledPost = await CronPollingService.createScheduledPost({
  content: scheduleData.content,
  platform: scheduleData.platforms[0], // Note: single platform per post now
  scheduled_time: new Date(scheduleData.scheduled_for),
  image_url: scheduleData.media_urls?.[0],
  user_id: user.id
});
```

### Step 4: Handle Multiple Platforms

**Old approach:** Single post with multiple platforms
```typescript
const postData = {
  content: "Hello world",
  platforms: ['twitter', 'facebook', 'linkedin'],
  scheduled_for: "2024-01-01T12:00:00Z"
};
```

**New approach:** Separate post for each platform
```typescript
const platforms = ['twitter', 'facebook', 'linkedin'];
const scheduledTime = new Date("2024-01-01T12:00:00Z");

for (const platform of platforms) {
  await CronPollingService.createScheduledPost({
    content: "Hello world",
    platform,
    scheduled_time: scheduledTime,
    user_id: user.id
  });
}
```

### Step 5: Update Your Routes/Pages

**Add the new dashboard to your routing:**
```typescript
// In your router configuration
import { CronPollingDashboard } from '@/pages/CronPollingDashboard';

// Add route
<Route path="/scheduler" component={CronPollingDashboard} />
```

## Benefits of the New System

1. **Reliability**: No more webhook timeouts or failures
2. **Scalability**: Database-driven approach handles high volume better
3. **Monitoring**: Easy to see all scheduled posts in the database
4. **Retry Logic**: Built into the n8n workflow
5. **Security**: Better RLS policies and user isolation

## Testing the Migration

1. **Run the SQL schema** from `supabase-fixed-schema.sql`
2. **Test the new components** with sample data
3. **Verify the n8n workflow** is polling correctly
4. **Check the database** for scheduled posts
5. **Monitor the logs** in n8n for successful posting

## Rollback Plan

If you need to rollback:
1. Keep your old webhook-based components
2. Switch the imports back to the old services
3. The database tables can coexist

## Common Issues and Solutions

### Issue: RLS Policies
**Problem:** Posts not saving due to RLS
**Solution:** The new schema includes proper RLS policies

### Issue: Multiple Platforms
**Problem:** Need to handle multiple platforms per post
**Solution:** Create separate database entries for each platform

### Issue: Immediate Posting
**Problem:** Want to post immediately, not schedule
**Solution:** Set `scheduled_time` to `new Date()` (current time)

## Support

If you encounter issues during migration:
1. Check the browser console for errors
2. Verify the database schema is applied correctly
3. Test with a simple single-platform post first
4. Check n8n logs for processing issues

The new system is designed to be more robust and maintainable while providing the same functionality as the webhook approach.
