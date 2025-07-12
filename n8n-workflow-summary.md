# 🚀 n8n Social Media Scheduler - 5 Platforms

## 📋 **Complete Workflow Overview**

This n8n workflow supports **all 5 social media platforms**:
- 🐦 **Twitter**
- 💼 **LinkedIn** 
- 📸 **Instagram**
- 👥 **Facebook**
- 🔴 **Reddit**

## 🔧 **Workflow Structure**

### **1. ⏰ Schedule Trigger**
- **Runs every 5 minutes**
- Checks for pending scheduled posts

### **2. 📥 Fetch Pending Posts**
- **URL**: `https://eqiuukwwpdiyncahrdny.supabase.co/rest/v1/rpc/get_pending_scheduled_posts`
- **Method**: POST
- **Headers**: Supabase service key authentication

### **3. ✅ Check Posts Exist**
- Verifies if there are posts to process
- Continues only if posts found

### **4. 🔄 Split Posts**
- Processes each post individually
- Sends to platform detection

### **5. 🎯 Platform Detection (5 Nodes)**
- **Check Platform - Twitter**
- **Check Platform - LinkedIn**
- **Check Platform - Instagram**
- **Check Platform - Facebook**
- **Check Platform - Reddit**

### **6. 📤 Social Media Posting (5 Nodes)**
- **Post to Twitter**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-twitter`
- **Post to LinkedIn**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-linkedin`
- **Post to Instagram**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-instagram`
- **Post to Facebook**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-facebook`
- **Post to Reddit**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-reddit`

### **7. 📊 Database Updates (2 Nodes)**
- **Update Post Success**: Marks post as published
- **Update Post Failed**: Tracks failures and retry counts

## 🔑 **Key Features**

### **✅ Multi-Platform Support**
- Handles all 5 major social media platforms
- Platform-specific routing and processing
- Extensible for additional platforms

### **📊 Comprehensive Tracking**
- Post status updates (published/failed)
- Platform-specific post IDs
- Execution tracking with n8n execution IDs
- Retry count management
- Error message logging

### **🔐 Security**
- Uses Supabase service role key
- Secure API authentication
- Protected database operations

### **🔄 Error Handling**
- Automatic failure detection
- Retry count tracking
- Detailed error logging
- Graceful failure handling

## 📥 **Import Instructions**

1. **Copy the JSON** from `n8n-social-media-scheduler.json`
2. **Open n8n Cloud** → **Workflows** → **Import from JSON**
3. **Paste the complete JSON** and click **Import**
4. **Verify API keys** (currently configured with your Supabase keys)
5. **Activate the workflow**

## 🧪 **Testing**

1. **Create a scheduled post** in your app
2. **Set schedule time** to 1-2 minutes in the future
3. **Monitor n8n execution** log
4. **Check database** for status updates
5. **Verify social media** posts

## 📋 **Required Supabase Functions**

Make sure these functions exist in your Supabase project:
- `post-to-twitter`
- `post-to-linkedin`
- `post-to-instagram`
- `post-to-facebook`
- `post-to-reddit`
- `get_pending_scheduled_posts`

## 🎯 **Workflow Flow**

```
Schedule Trigger (5min)
    ↓
Fetch Pending Posts
    ↓
Check Posts Exist
    ↓
Split Posts
    ↓
Platform Detection (5 parallel checks)
    ↓
Social Media Posting (5 parallel posts)
    ↓
Database Updates (Success/Failed)
```

## 🚀 **Ready to Use!**

The workflow is complete and ready for production use with all 5 social media platforms! 🎉
