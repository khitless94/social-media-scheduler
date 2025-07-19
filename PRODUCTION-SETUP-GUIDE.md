# 🚀 Production Social Media Scheduler Setup Guide

## Overview
This guide will help you deploy a complete, production-ready social media scheduling system using only Supabase's built-in features.

## Prerequisites
- ✅ Supabase project (Pro plan recommended for pg_cron)
- ✅ Twitter/X API credentials configured
- ✅ Social media accounts connected via OAuth

## Step 1: Database Setup

### Run the Production SQL Setup
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire `PRODUCTION-CRON-SYSTEM.sql` file
4. Click **Run** to execute

### Expected Results
```
✅ Status constraint updated
✅ Post history table configured
✅ Processing functions created
✅ Cron job scheduled (every minute)
✅ Monitoring functions available
```

## Step 2: Verify Setup

### Check Cron Job Status
Visit: `https://your-app.com/cron-monitor`

You should see:
- ✅ **Cron Status:** Active
- ✅ **Schedule:** * * * * * (every minute)
- ✅ **Last Run:** Recent timestamp

### Test Manual Processing
1. Click **"Trigger Now"** button
2. Should see: "Processed X scheduled posts"
3. Statistics should update automatically

## Step 3: How It Works

### Automated Workflow
```
1. User schedules post → Status: 'scheduled'
2. Cron runs every minute → Checks for overdue posts
3. Marks posts as ready → Status: 'ready_for_posting'
4. SocialProcessor picks up → Posts to social media
5. Updates final status → Status: 'published' or 'failed'
```

### Key Functions
- **`process_scheduled_posts()`** - Converts scheduled → ready_for_posting
- **`mark_post_as_posted()`** - Updates status after posting
- **`get_posting_system_stats()`** - Provides monitoring data
- **`trigger_manual_processing()`** - Manual trigger for testing

## Step 4: Monitoring & Maintenance

### Real-time Monitoring
- **Dashboard:** `/cron-monitor`
- **Statistics:** Auto-refresh every 30 seconds
- **Manual Control:** Trigger processing anytime

### Key Metrics to Watch
- **Scheduled Posts:** Posts waiting to be processed
- **Ready Posts:** Posts marked for immediate posting
- **Published Today:** Successfully posted content
- **Failed Today:** Posts that encountered errors

### Troubleshooting

#### Cron Job Not Running
1. Check Supabase plan (Pro required for pg_cron)
2. Verify extension: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
3. Check job status: `SELECT * FROM cron.job;`

#### Posts Not Processing
1. Check constraint: Posts should allow 'ready_for_posting' status
2. Verify SocialProcessor is running in frontend
3. Check social media API connections

#### Database Errors
1. Run `PRODUCTION-CRON-SYSTEM.sql` again
2. Check post_history table has all columns
3. Verify function permissions

## Step 5: Production Deployment

### Environment Setup
1. **Frontend:** Deploy React app to Vercel/Netlify
2. **Database:** Supabase handles all backend logic
3. **Cron:** Runs automatically in Supabase
4. **APIs:** Social media posting via edge functions

### Security Considerations
- ✅ **RLS Policies:** Ensure users can only access their posts
- ✅ **Function Security:** All functions use SECURITY DEFINER
- ✅ **API Keys:** Store securely in Supabase secrets
- ✅ **OAuth Tokens:** Encrypted in database

### Scaling
- **Cron Frequency:** Adjust from every minute if needed
- **Batch Size:** Currently processes 20 posts per run
- **Rate Limits:** Respect social media API limits
- **Error Handling:** Failed posts marked for retry

## Step 6: Testing

### Manual Testing
1. Create a scheduled post for 1 minute in the future
2. Wait for cron to process (check `/cron-monitor`)
3. Verify post appears on social media
4. Check status updated to 'published'

### Automated Testing
1. Use `trigger_manual_processing()` function
2. Monitor statistics in real-time
3. Check post_history for detailed logs
4. Verify error handling with invalid posts

## Success Criteria

### ✅ System is Working When:
- Cron job shows as "Active"
- Scheduled posts automatically become "ready_for_posting"
- SocialProcessor finds and posts content
- Statistics update in real-time
- Posts appear on social media platforms
- Status tracking works correctly

### 🎯 Production Ready Features:
- **Zero-downtime operation**
- **Automatic error recovery**
- **Real-time monitoring**
- **Manual override capabilities**
- **Comprehensive logging**
- **Scalable architecture**

## Support

### Common Issues
- **Constraint Errors:** Run the SQL setup again
- **Cron Not Working:** Check Supabase plan and pg_cron extension
- **API Failures:** Verify social media connections
- **Permission Errors:** Check function grants and RLS policies

### Monitoring Tools
- **Supabase Dashboard:** Database logs and metrics
- **Cron Monitor:** `/cron-monitor` for system status
- **Manual Processor:** `/manual-processor` for immediate posting
- **Browser Console:** Real-time processing logs

---

**Your production social media scheduler is now ready for deployment!** 🎉

The system will automatically process scheduled posts every minute without any manual intervention required.
