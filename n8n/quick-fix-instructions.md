# 🚀 Quick Fix for n8n OAuth Credentials Error

## ⚠️ Foreign Key Constraint Error Fix

**Error**: `insert or update on table "oauth_credentials" violates foreign key constraint`

**Root Cause**: The test user ID doesn't exist in the `auth.users` table.

## Immediate Solution (Choose One)

### Option A: Remove Foreign Key Constraint (Fastest - 2 minutes)

Run this in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content from: n8n/fix-foreign-key-error.sql
```

This removes the foreign key constraint and allows test data without creating auth users.

### Option B: Create Real Auth User (Recommended - 5 minutes)

Run this in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content from: n8n/alternative-auth-setup.sql
```

This creates a proper auth user and maintains database integrity.

## After Running Either Script

### 1. Fix the "Fetch OAuth Credentials" Node

**The Problem**: Your node has JavaScript code in a PostgreSQL query field.

**The Fix**: 
1. Open your n8n workflow
2. Click on the "Fetch OAuth Credentials" node
3. Replace the JavaScript code with this SQL query:

```sql
SELECT 
  access_token,
  refresh_token,
  expires_at,
  platform,
  user_id
FROM oauth_credentials 
WHERE user_id = '{{ $node["Process Webhook Data"].json.userId }}' 
AND platform = '{{ $node["Process Webhook Data"].json.platform }}'
LIMIT 1;
```

### 2. Fix Database Credentials

**Check your PostgreSQL credential**:
- Name: Should be "Supabase Database" 
- ID: Should be "supabase-connection"
- Connection details should match your Supabase database

### 3. Verify Test Data Exists

After running either Option A or B above, verify the data:

```sql
-- Check if test data was created successfully
SELECT 'OAuth credentials' as table_name,
       count(*) as record_count,
       array_agg(platform) as platforms
FROM oauth_credentials
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- Test the query that n8n will use
SELECT access_token, refresh_token, expires_at, platform, user_id
FROM oauth_credentials
WHERE user_id = '12345678-1234-1234-1234-123456789abc'
AND platform = 'twitter'
LIMIT 1;
```

You should see 5 records (one for each platform) and the Twitter credentials.

### 4. Test the Fix

Send this test request to your webhook:

```bash
curl -X POST "http://your-n8n-url/webhook/schedule-post" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345678-1234-1234-1234-123456789abc",
    "platform": "twitter",
    "content": "Test post from fixed workflow!",
    "postId": "test-123"
  }'
```

## Alternative: Import Fixed Workflow

If the above doesn't work, import the complete fixed workflow:

1. **Download**: Copy the JSON from `n8n/fixed-schedule-post-workflow.json`
2. **Import**: In n8n, go to Workflows → Import from JSON
3. **Configure**: Update the database credential to match your setup
4. **Test**: Use the test script or curl command above

## Expected Result

After the fix, you should see:
- ✅ No more "Fetch OAuth Credentials" errors
- ✅ Successful database connection
- ✅ OAuth tokens retrieved correctly
- ✅ Workflow executes without errors

## If Still Having Issues

1. **Check n8n logs** for specific error messages
2. **Verify Supabase connection** in n8n credentials
3. **Confirm test data exists** in oauth_credentials table
4. **Run the comprehensive test script**: `node n8n/test-workflow.js`

## Next Steps After Fix

1. Replace test OAuth tokens with real ones
2. Test with actual social media accounts
3. Implement proper error handling
4. Set up monitoring and alerts

---

**Need Help?** Check the detailed setup guide in `n8n/n8n-setup-guide.md` or run the database setup script in `n8n/database-setup-for-n8n.sql`.
