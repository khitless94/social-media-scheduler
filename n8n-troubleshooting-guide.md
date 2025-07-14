# n8n Workflow Troubleshooting Guide

## Problem: "The resource you are requesting could not be found"

This error occurs when the RPC function `get_pending_scheduled_posts` doesn't exist or isn't accessible.

## Solution Steps

### Step 1: Deploy the RPC Function

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor

2. **Run the Fix Script**
   - Copy and paste the contents of `fix-n8n-rpc-function.sql`
   - Execute the script
   - You should see: "✅ RPC functions created successfully!"

### Step 2: Test the Function

1. **Open the Test Page**
   - Open `test-n8n-rpc-function.html` in your browser
   - Run all tests to verify the function works

2. **Manual Test in Supabase**
   ```sql
   SELECT * FROM get_pending_scheduled_posts();
   ```

### Step 3: Update Your n8n Workflow

1. **Import the Fixed Workflow**
   - Use the `fixed-n8n-workflow.json` file
   - This includes proper error handling and data preparation

2. **Key Changes Made:**
   - Added data preparation step
   - Fixed the social media API endpoint
   - Improved error handling
   - Added proper status updates

## Common Issues and Solutions

### Issue 1: Function Not Found
**Error:** `function get_pending_scheduled_posts() does not exist`

**Solution:**
```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_pending_scheduled_posts';

-- If not found, run the fix script
```

### Issue 2: Permission Denied
**Error:** `permission denied for function get_pending_scheduled_posts`

**Solution:**
```sql
-- Grant permissions
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_scheduled_posts() TO authenticated;
```

### Issue 3: No Pending Posts Found
**Error:** Workflow runs but finds no posts

**Solution:**
1. Check if posts are properly scheduled:
   ```sql
   SELECT * FROM posts WHERE scheduling_status = 'scheduled';
   ```

2. Check if queue entries exist:
   ```sql
   SELECT * FROM scheduled_posts_queue WHERE status = 'pending';
   ```

3. Create a test post:
   ```sql
   -- Use the create_test_scheduled_post function
   SELECT create_test_scheduled_post(
     'your-user-id'::uuid,
     'Test post content',
     ARRAY['twitter'],
     1 -- 1 minute from now
   );
   ```

### Issue 4: Social Media API Errors
**Error:** Post to social media fails

**Solution:**
1. Check if the social media API endpoint exists
2. Verify OAuth credentials are properly stored
3. Test the endpoint manually:
   ```bash
   curl -X POST https://your-supabase-url/functions/v1/post-to-social \
     -H "Authorization: Bearer your-service-key" \
     -H "Content-Type: application/json" \
     -d '{"content":"test","platform":"twitter","user_id":"your-user-id"}'
   ```

## Workflow Configuration

### Required Environment Variables in n8n:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your service role key

### Required Headers:
```json
{
  "apikey": "your-service-key",
  "Authorization": "Bearer your-service-key",
  "Content-Type": "application/json"
}
```

## Testing the Complete Flow

### 1. Create a Test Post
```javascript
// Use the test page or run this in browser console
const response = await fetch('https://your-supabase-url/rest/v1/posts', {
  method: 'POST',
  headers: {
    'apikey': 'your-service-key',
    'Authorization': 'Bearer your-service-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Test post for n8n',
    platforms: ['twitter'],
    status: 'scheduled',
    scheduling_status: 'scheduled',
    scheduled_for: new Date(Date.now() + 60000).toISOString(),
    user_id: 'your-user-id'
  })
});
```

### 2. Verify Queue Entry
```sql
SELECT * FROM scheduled_posts_queue WHERE status = 'pending';
```

### 3. Test RPC Function
```sql
SELECT * FROM get_pending_scheduled_posts();
```

### 4. Run n8n Workflow
- Trigger manually or wait for schedule
- Check execution logs for errors

## Monitoring and Debugging

### Check Workflow Logs
1. Go to n8n executions
2. Look for error messages
3. Check each node's output

### Database Monitoring
```sql
-- Check queue health
SELECT status, COUNT(*) 
FROM scheduled_posts_queue 
GROUP BY status;

-- Check recent posts
SELECT scheduling_status, COUNT(*) 
FROM posts 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY scheduling_status;
```

### Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Function not found" | RPC function missing | Run fix script |
| "Permission denied" | Missing grants | Grant execute permissions |
| "No posts found" | Empty queue | Create test posts |
| "API endpoint error" | Missing social media function | Deploy social media functions |
| "OAuth error" | Missing credentials | Set up OAuth properly |

## Success Indicators

✅ **Function exists and is callable**
✅ **Test posts can be created**
✅ **Queue entries are generated**
✅ **RPC function returns data**
✅ **n8n workflow executes without errors**
✅ **Posts are marked as published**

If all indicators are green, your n8n workflow should work correctly!
