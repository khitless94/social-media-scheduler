# Complete n8n Workflow Fix Guide

## 🚨 Problem Summary

Your n8n workflow is failing with two main errors:
1. **"The resource you are requesting could not be found"** - Missing RPC function
2. **"null value in column 'platform' violates not-null constraint"** - Database schema issue

## 🔧 Complete Solution

### Step 1: Fix Database Schema (CRITICAL)

**Run this first:** `fix-posts-table-schema.sql`

This script will:
- ✅ Make the `platform` column nullable
- ✅ Add missing columns (`platforms`, `media_urls`, `scheduled_for`, etc.)
- ✅ Create automatic sync between `platform` and `platforms` fields
- ✅ Add helper functions for testing
- ✅ Create proper enum types

### Step 2: Deploy RPC Functions

**Run this second:** `fix-n8n-rpc-function.sql`

This script will:
- ✅ Create `get_pending_scheduled_posts()` function
- ✅ Create `update_scheduled_post_status()` function
- ✅ Grant proper permissions to service role
- ✅ Add error handling and logging

### Step 3: Test Everything

**Open:** `test-n8n-rpc-function.html`

Run all tests to verify:
- ✅ Functions exist and are accessible
- ✅ Test posts can be created
- ✅ Workflow simulation works

### Step 4: Update n8n Workflow

**Import:** `fixed-n8n-workflow.json`

Key improvements:
- ✅ Better error handling
- ✅ Proper data preparation
- ✅ Correct API endpoints
- ✅ Status update functionality

## 🎯 Quick Fix Commands

### 1. Database Schema Fix
```sql
-- Copy and paste fix-posts-table-schema.sql into Supabase SQL Editor
-- This fixes the "platform NOT NULL" error
```

### 2. RPC Functions Fix
```sql
-- Copy and paste fix-n8n-rpc-function.sql into Supabase SQL Editor
-- This fixes the "resource not found" error
```

### 3. Test Creation
```sql
-- Create a test post (run in Supabase SQL Editor)
SELECT create_test_scheduled_post(
    '00000000-0000-0000-0000-000000000000'::uuid,
    'Test post for n8n',
    ARRAY['twitter'],
    1 -- 1 minute from now
);
```

### 4. Verify Functions Work
```sql
-- Check if functions return data
SELECT * FROM get_pending_scheduled_posts();
```

## 🔍 Error Analysis

### Original Error Breakdown:

**Error 1:** `The resource you are requesting could not be found`
- **Cause:** Missing `get_pending_scheduled_posts()` RPC function
- **Fix:** Deploy the RPC function with proper permissions

**Error 2:** `null value in column "platform" violates not-null constraint`
- **Cause:** Your app sends `platforms` array but database expects `platform` string
- **Fix:** Make platform nullable and add trigger to sync fields

## 🧪 Testing Checklist

Before running your n8n workflow, verify:

- [ ] **Schema Fix Applied**
  ```sql
  SELECT column_name, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'posts' AND column_name = 'platform';
  ```
  Should show `is_nullable = YES`

- [ ] **RPC Function Exists**
  ```sql
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_name = 'get_pending_scheduled_posts';
  ```
  Should return the function name

- [ ] **Test Post Creation Works**
  ```sql
  SELECT create_test_scheduled_post();
  ```
  Should return a UUID

- [ ] **Function Returns Data**
  ```sql
  SELECT COUNT(*) FROM get_pending_scheduled_posts();
  ```
  Should return > 0 if test posts exist

## 🚀 n8n Workflow Configuration

### Required Headers:
```json
{
  "apikey": "your-service-role-key",
  "Authorization": "Bearer your-service-role-key",
  "Content-Type": "application/json"
}
```

### Correct Endpoints:
- **Fetch Posts:** `POST /rest/v1/rpc/get_pending_scheduled_posts`
- **Update Status:** `POST /rest/v1/rpc/update_scheduled_post_status`
- **Post to Social:** `POST /functions/v1/post-to-social`

## 🎉 Success Indicators

After applying all fixes, you should see:

1. **Database Schema Fixed**
   - No more "NOT NULL constraint" errors
   - Posts can be created with either `platform` or `platforms`

2. **RPC Functions Working**
   - n8n can fetch pending posts
   - Status updates work correctly

3. **Workflow Executing**
   - No "resource not found" errors
   - Posts are processed and marked as published

## 🆘 If You Still Have Issues

### Common Problems:

1. **"Function still not found"**
   - Check if you're using the correct Supabase URL
   - Verify service role key has proper permissions
   - Try running the RPC script again

2. **"Permission denied"**
   - Ensure service role key is correct
   - Check if RLS policies are blocking access
   - Grant execute permissions manually

3. **"No posts found"**
   - Create test posts using the helper function
   - Check if posts have correct `scheduled_for` time
   - Verify queue entries exist

### Debug Commands:
```sql
-- Check table structure
\d posts

-- Check functions
\df get_pending_scheduled_posts

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'get_pending_scheduled_posts';

-- Check test data
SELECT * FROM posts WHERE scheduling_status = 'scheduled';
SELECT * FROM scheduled_posts_queue WHERE status = 'pending';
```

## 📞 Support

If you're still having issues after following this guide:

1. Run the test page and share the results
2. Check your Supabase logs for detailed error messages
3. Verify your service role key has the correct permissions
4. Make sure you're using the latest workflow configuration

The fixes provided should resolve both the schema and RPC function issues completely! 🎯
