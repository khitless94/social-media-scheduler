# 🚀 Production Multi-User Social Media Scheduler

## Overview

This n8n workflow supports **multiple users** dynamically by extracting user credentials from your Supabase database based on the incoming request. No hardcoded user IDs!

## 🏗️ Architecture

```
Web App → n8n Webhook → Supabase OAuth Lookup → Platform APIs → Response
```

## 🔑 Key Features

### ✅ **Multi-User Support**
- Dynamically extracts `user_id` from webhook payload
- Fetches OAuth credentials specific to each user
- Supports both direct API calls and web app integration

### ✅ **Flexible Input Formats**
1. **Direct Platform Post**: `{ user_id, platform, content }`
2. **Web App Integration**: `{ user_id, platforms[], content, action: "schedule_post" }`

### ✅ **Security**
- User ID validation from multiple sources
- Row-level security in Supabase
- OAuth credential isolation per user

### ✅ **Error Handling**
- Missing credentials detection
- Helpful error messages
- Fallback responses

## 📋 Workflow Nodes

1. **Schedule Post Webhook** - Receives POST requests
2. **Process Webhook Data** - Extracts user ID and validates input
3. **Fetch OAuth Credentials** - Gets user-specific credentials from Supabase
4. **Check Credentials Exist** - Validates credentials are available
5. **Route by Platform** - Routes to correct social media API
6. **Platform API Nodes** - Twitter, LinkedIn, Facebook, Reddit
7. **Merge Responses** - Combines results
8. **Webhook Response** - Returns success/failure status

## 🔧 User ID Detection

The workflow extracts user ID from multiple sources (in order of priority):

1. **Request Body**: `user_id` or `userId`
2. **Headers**: `X-User-ID`
3. **Post Lookup**: Via `post_id` (future enhancement)

## 📤 Request Formats

### Direct Platform Post
```json
{
  "user_id": "d33d28ea-cc43-4dd0-b971-e896acf853e3",
  "platform": "twitter",
  "content": "Hello from my scheduler! 🚀",
  "postId": "unique-post-id"
}
```

### Web App Integration
```json
{
  "user_id": "d33d28ea-cc43-4dd0-b971-e896acf853e3",
  "content": "Multi-platform post! 🎉",
  "platforms": ["twitter", "linkedin"],
  "scheduled_for": "2024-01-15T15:30:00.000Z",
  "action": "schedule_post",
  "post_id": "web-app-post-123"
}
```

## 📥 Response Formats

### Success Response
```json
{
  "success": true,
  "platform": "twitter",
  "postId": "unique-post-id",
  "userId": "d33d28ea-cc43-4dd0-b971-e896acf853e3",
  "content": "Hello from my scheduler! 🚀",
  "timestamp": "2024-01-15T15:30:00.000Z",
  "platformResponse": {
    "data": {
      "id": "1234567890",
      "text": "Hello from my scheduler! 🚀"
    }
  },
  "message": "Successfully posted to twitter"
}
```

### Error Response (No Credentials)
```json
{
  "success": false,
  "error": "No OAuth credentials found for user d33d28ea-cc43-4dd0-b971-e896acf853e3 on platform twitter. Please connect your twitter account in the web app first.",
  "userId": "d33d28ea-cc43-4dd0-b971-e896acf853e3",
  "platform": "twitter",
  "help": "Visit your dashboard to connect social media accounts"
}
```

## 🧪 Testing

### PowerShell Test Script
```powershell
.\test-production-webhook.ps1
```

Features:
- Multi-user selection
- Multiple test modes
- Platform selection
- Comprehensive error handling

### Manual Testing
```powershell
$body = @{
    user_id = "your-user-id-here"
    platform = "twitter"
    content = "Test post! 🚀"
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
    'X-User-ID' = 'your-user-id-here'
}

Invoke-WebRequest -Uri "https://k94.app.n8n.cloud/webhook/schedule-post" -Method POST -Body $body -Headers $headers
```

## 🔄 Integration with Web App

Your web application already sends the correct format:

```typescript
const webhookPayload = {
  post_id: savedPost.id,
  user_id: user.id,
  content: postData.content,
  platforms: postData.platforms,
  scheduled_for: postData.scheduled_for,
  media_urls: postData.media_urls || [],
  action: 'schedule_post'
};

const response = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': user.id,
  },
  body: JSON.stringify(webhookPayload)
});
```

## 🚀 Deployment Steps

1. **Import Workflow**: Copy `n8n/production-live-workflow.json` into n8n
2. **Activate Workflow**: Enable the workflow in n8n dashboard
3. **Test Integration**: Use the test script or web app
4. **Monitor Logs**: Check n8n execution logs for any issues

## 🔍 Troubleshooting

### Common Issues

1. **"No OAuth credentials found"**
   - User hasn't connected the platform in web app
   - Check `oauth_credentials` table in Supabase
   - Verify user_id matches exactly

2. **"Missing user ID"**
   - Request body missing `user_id` field
   - Headers missing `X-User-ID`
   - Check request format

3. **Platform API errors**
   - OAuth token expired
   - Invalid platform credentials
   - API rate limits

### Debug Steps

1. Check n8n execution logs
2. Verify Supabase credentials table
3. Test with PowerShell script
4. Check web app console logs

## 🎯 Production Ready

This workflow is now **production-ready** with:
- ✅ Multi-user support
- ✅ Real OAuth credentials
- ✅ Comprehensive error handling
- ✅ Security validation
- ✅ Flexible input formats
- ✅ Platform-specific APIs
- ✅ Detailed responses
