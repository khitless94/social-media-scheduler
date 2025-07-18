# ⏰ CRON JOB SETUP - Process Scheduled Posts Every Minute

## 🎯 Overview
This setup creates a cron job that automatically processes scheduled posts every minute, changing their status from 'scheduled' to 'published'.

## 📋 Setup Steps

### Step 1: Run Database Cleanup & Setup
```sql
-- Run URGENT-DATABASE-FIX.sql in Supabase SQL Editor
-- This will:
-- ✅ Delete all existing posts
-- ✅ Fix table structure
-- ✅ Set up RLS policies
-- ✅ Create cron job (every minute)
```

### Step 2: Alternative Cron Setup (if needed)
```sql
-- If cron setup fails in main script, run SETUP-CRON-JOB.sql
-- This provides more detailed cron configuration
```

### Step 3: Verify Setup
1. **Check cron jobs**: `SELECT * FROM cron.job;`
2. **Test function**: `SELECT * FROM process_scheduled_posts();`
3. **Monitor posts**: `SELECT * FROM scheduled_posts_monitor;`

## 🔧 What the Cron Job Does

### Every Minute:
1. **Finds ready posts**: `WHERE status = 'scheduled' AND scheduled_at <= NOW()`
2. **Processes up to 10 posts** (to avoid overload)
3. **Updates status**: `'scheduled' → 'published'`
4. **Sets published_at**: Current timestamp
5. **Logs activity**: In post_history table (if exists)

### Error Handling:
- Failed posts get status `'failed'`
- Errors are logged for debugging
- Processing continues for other posts

## 📊 Monitoring Tools

### Frontend Pages:
- **`/cron-monitor`** - Real-time cron job monitoring
- **`/test-scheduling`** - Create test posts to verify processing
- **`/cleanup-posts`** - Clean up test data

### SQL Queries:
```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-posts';

-- View scheduled posts
SELECT * FROM scheduled_posts_monitor;

-- Get processing stats
SELECT * FROM get_scheduling_stats();

-- Manual processing test
SELECT * FROM process_scheduled_posts();
```

## 🧪 Testing the Setup

### 1. Create Test Post:
- Go to `/test-scheduling`
- Click "Schedule Test Post (2 min from now)"
- Post gets status 'scheduled'

### 2. Monitor Processing:
- Go to `/cron-monitor`
- Watch "Ready to Process" count
- After scheduled time passes, cron job will process it
- Status changes to 'published'

### 3. Verify Results:
```sql
SELECT 
    content,
    status,
    scheduled_at,
    published_at,
    created_at
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;
```

## ⚙️ Cron Job Configuration

### Schedule Format:
```
* * * * *  = Every minute
*/5 * * * * = Every 5 minutes
0 * * * *   = Every hour
0 0 * * *   = Every day at midnight
```

### Current Jobs:
1. **`process-scheduled-posts`** - Every minute
2. **`scheduling-stats`** - Every 5 minutes (monitoring)

## 🔍 Troubleshooting

### Cron Job Not Running:
```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check job status
SELECT * FROM cron.job;

-- Check job history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Posts Not Processing:
```sql
-- Check for posts ready to process
SELECT COUNT(*) FROM posts WHERE status = 'scheduled' AND scheduled_at <= NOW();

-- Test function manually
SELECT * FROM process_scheduled_posts();

-- Check for errors
SELECT * FROM post_history WHERE action = 'failed' ORDER BY created_at DESC;
```

### Permission Issues:
- Ensure functions have `SECURITY DEFINER`
- Grant execute permissions to `authenticated` role
- Check RLS policies on posts table

## 🚀 Production Considerations

### Performance:
- Processes max 10 posts per minute (600/hour)
- Add indexes on `status` and `scheduled_at` columns
- Monitor database load during peak times

### Reliability:
- Failed posts are marked as 'failed' (not retried automatically)
- Consider adding retry logic for temporary failures
- Monitor cron job execution logs

### Scaling:
- For high volume, consider increasing batch size
- Add multiple cron jobs with different schedules
- Implement queue-based processing for very high volume

## ✅ Success Indicators

### Working Correctly:
- ✅ Cron jobs appear in `SELECT * FROM cron.job;`
- ✅ Test posts change from 'scheduled' to 'published'
- ✅ `published_at` timestamp is set correctly
- ✅ `/cron-monitor` shows processing activity
- ✅ No errors in cron job logs

### Ready for Production:
- ✅ All tests pass
- ✅ Monitoring is working
- ✅ Error handling is tested
- ✅ Performance is acceptable
- ✅ Cleanup procedures are in place

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run manual tests using the SQL queries
3. Use the frontend monitoring tools
4. Check Supabase logs for detailed error messages

The cron job setup provides a reliable, automated way to process scheduled posts without external dependencies!
