# n8n Social Media Scheduler Setup Guide

## 🔧 Database Connection Setup

### 1. Configure Supabase Connection in n8n

1. **Go to n8n Credentials**:
   - Navigate to Settings → Credentials
   - Click "Add Credential"
   - Select "Postgres"

2. **Enter Connection Details**:
   ```
   Name: Supabase Database
   Host: aws-0-ap-southeast-1.pooler.supabase.com
   Port: 6543
   Database: postgres
   Schema: public
   User: postgres.eqiuukwwpdiyncahrdny
   Password: [YOUR_SUPABASE_PASSWORD]
   SSL: Enable
   ```

3. **Test Connection**:
   - Click "Test" to verify the connection works
   - Save the credential with ID: `supabase-connection`

### 2. Verify Database Tables

Run this SQL in your Supabase SQL Editor to ensure tables exist:

```sql
-- Check if oauth_credentials table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'oauth_credentials';

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS oauth_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Insert test data for debugging
INSERT INTO oauth_credentials (user_id, platform, access_token, refresh_token, expires_at)
VALUES (
  '12345678-1234-1234-1234-123456789abc',
  'twitter',
  'test_access_token_123',
  'test_refresh_token_123',
  NOW() + INTERVAL '1 hour'
) ON CONFLICT (user_id, platform) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  updated_at = NOW();
```

## 🚀 Import Fixed Workflow

1. **Import the Fixed Workflow**:
   - Copy the content from `fixed-schedule-post-workflow.json`
   - In n8n, go to Workflows → Import from JSON
   - Paste the JSON and import

2. **Update Credential References**:
   - Open the "Fetch OAuth Credentials" node
   - Ensure it uses the credential ID: `supabase-connection`
   - Save the workflow

## 🧪 Testing the Workflow

### Test with cURL

```bash
# Test the webhook endpoint
curl -X POST "http://your-n8n-instance/webhook/schedule-post" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345678-1234-1234-1234-123456789abc",
    "platform": "twitter",
    "content": "Test post from n8n workflow!",
    "postId": "test-123"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Post published successfully",
  "platform": "twitter",
  "postId": "test-123",
  "platformPostId": "1234567890",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔍 Troubleshooting Common Issues

### Issue 1: Database Connection Failed

**Error**: `Connection to database failed`

**Solution**:
1. Verify Supabase credentials are correct
2. Check if your IP is whitelisted in Supabase
3. Ensure SSL is enabled in the connection settings

### Issue 2: OAuth Credentials Not Found

**Error**: `No OAuth credentials found for user`

**Solution**:
1. Check if test data exists in `oauth_credentials` table
2. Verify the userId in the webhook matches the database
3. Ensure the platform name matches exactly

### Issue 3: API Authentication Failed

**Error**: `401 Unauthorized` from social media APIs

**Solution**:
1. Verify OAuth tokens are valid and not expired
2. Check if the access token has the required permissions
3. Implement token refresh logic for expired tokens

## 📝 Workflow Node Details

### 1. Process Webhook Data
- **Type**: Code Node
- **Purpose**: Extract and validate webhook payload
- **Key Features**: 
  - Handles different webhook formats
  - Provides fallback test data
  - Validates required fields

### 2. Fetch OAuth Credentials
- **Type**: PostgreSQL Node
- **Purpose**: Query database for user's OAuth tokens
- **SQL Query**: Fetches tokens by userId and platform

### 3. Merge Data
- **Type**: Code Node
- **Purpose**: Combine webhook data with OAuth credentials
- **Key Features**:
  - Validates token existence
  - Checks token expiration
  - Prepares data for API calls

### 4. Route by Platform
- **Type**: Switch Node
- **Purpose**: Route to appropriate social media API
- **Platforms**: Twitter, Facebook, LinkedIn, Reddit, Instagram

### 5. Platform-Specific Nodes
- **Type**: HTTP Request Nodes
- **Purpose**: Make API calls to each platform
- **Features**: 
  - Proper authentication headers
  - Platform-specific payload formatting
  - Error handling

## 🔄 Step-by-Step Implementation

### Step 1: Database Setup
```bash
# 1. Run the database setup script
# Copy content from database-setup-for-n8n.sql
# Paste and execute in Supabase SQL Editor
```

### Step 2: n8n Configuration
```bash
# 1. Import the fixed workflow JSON
# 2. Configure Supabase credentials
# 3. Test the webhook endpoint
```

### Step 3: Testing
```bash
# Run the test script
node n8n/test-workflow.js

# Or test manually with curl
curl -X POST "http://localhost:5678/webhook/schedule-post" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345678-1234-1234-1234-123456789abc",
    "platform": "twitter",
    "content": "Test post!",
    "postId": "test-123"
  }'
```

### Step 4: Production Setup
1. **Replace test tokens with real OAuth credentials**
2. **Configure proper error handling**
3. **Set up monitoring and alerts**
4. **Implement token refresh logic**
5. **Add rate limiting and retry mechanisms**

## 🚨 Critical Fixes Applied

### ✅ Fixed Issues:
1. **PostgreSQL Node Query**: Replaced JavaScript code with proper SQL query
2. **Credential Reference**: Updated to use correct Supabase connection ID
3. **Data Flow**: Fixed data passing between nodes
4. **API Authentication**: Added proper OAuth token headers
5. **Error Handling**: Improved error messages and validation
6. **Test Data**: Added comprehensive test dataset

### 🔧 Key Changes Made:
- **Fetch OAuth Credentials**: Now uses SQL query instead of JavaScript
- **HTTP Request Nodes**: Added proper authentication headers
- **Data Validation**: Enhanced input validation and error handling
- **Database Schema**: Standardized table structure with proper indexes
- **Test Framework**: Created comprehensive testing suite
