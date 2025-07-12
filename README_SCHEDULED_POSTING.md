# 🚀 Scheduled Posting System

Complete n8n Cloud integration for automated social media scheduling.

## 📋 Overview

This system enables users to schedule social media posts that are automatically published by n8n Cloud workflows at specified times.

## 🏗️ Architecture

```
User App → Supabase → n8n Cloud → Social Media APIs
    ↓         ↓          ↓            ↓
 Schedule   Store     Execute      Publish
  Posts    Queue     Workflow      Posts
```

## 📁 File Structure

```
├── database/                          # Database setup and utilities
│   ├── complete_scheduled_posting_setup.sql    # Main database setup
│   ├── scheduled_posting_utilities.sql         # Utility functions
│   ├── test_scheduled_posting.sql             # Testing and verification
│   └── fix_scheduling_migration.sql           # Migration fixes
├── n8n/                              # n8n Cloud workflows
│   ├── enhanced-scheduled-posting-workflow.json    # Recommended workflow
│   ├── production-ready-workflow.json             # Production version
│   ├── http-based-workflow.json                   # HTTP API fallback
│   └── scheduled-posting-workflow.json            # Basic version
├── src/
│   ├── services/scheduledPostService.ts       # Backend service
│   ├── hooks/useScheduledPosts.ts             # React hook
│   └── api/webhooks/n8n-status.ts            # Status webhook
└── N8N_SETUP_GUIDE.md                # Complete setup guide
```

## 🚀 Quick Start

### 1. Database Setup
```sql
-- Run in Supabase SQL editor
\i database/complete_scheduled_posting_setup.sql
\i database/scheduled_posting_utilities.sql
```

### 2. n8n Cloud Setup
1. Create n8n Cloud account
2. Import `n8n/enhanced-scheduled-posting-workflow.json`
3. Configure Supabase database connection
4. Activate workflow

### 3. Test the System
```sql
-- Create test scheduled post
SELECT create_test_scheduled_post('your-user-id');
```

## 🔧 Features

### ✨ Database Features
- **Automatic queue management** with triggers
- **Status tracking** (draft, scheduled, processing, published, failed)
- **Error handling** with retry mechanisms
- **Analytics and reporting** functions
- **RLS security** policies

### ✨ n8n Integration
- **Multiple workflow variants** for different scenarios
- **IPv6 connection workarounds** for cloud environments
- **HTTP API fallback** method
- **Comprehensive error handling** and logging
- **Rate limiting** and retry logic

### ✨ Frontend Integration
- **ScheduledPostService** for backend operations
- **useScheduledPosts** React hook for UI
- **Real-time status updates** via webhooks
- **Comprehensive error handling**

## 📊 Database Schema

### Posts Table Enhancements
```sql
ALTER TABLE posts ADD COLUMN:
- scheduled_for TIMESTAMP WITH TIME ZONE
- scheduling_status scheduling_status_enum
- n8n_execution_id VARCHAR(255)
- retry_count INTEGER
- error_message TEXT
```

### Queue Table
```sql
CREATE TABLE scheduled_posts_queue (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES auth.users(id),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    -- ... additional fields
);
```

## 🔧 Usage Examples

### Schedule a Post
```typescript
import { useScheduledPosts } from '@/hooks/useScheduledPosts';

const { createScheduledPost } = useScheduledPosts();

await createScheduledPost({
  content: "Hello world! 🚀",
  platforms: ["twitter", "linkedin"],
  scheduled_for: new Date("2024-01-15T10:00:00Z")
});
```

### Monitor Queue Status
```sql
SELECT * FROM get_queue_health();
SELECT * FROM get_scheduled_posts_stats('user-id');
```

### Retry Failed Posts
```sql
SELECT retry_failed_post('post-id');
```

## 🚨 Troubleshooting

### IPv6 Connection Issues
If you encounter `ENETUNREACH` errors with IPv6:
1. Use HTTP-based workflow instead of Postgres
2. Try connection pooler (port 6543)
3. Use IPv4 addresses directly

### Common Issues
- **Posts not publishing**: Check OAuth credentials in database
- **Workflow not triggering**: Verify n8n workflow is active
- **Database connection failed**: Use HTTP API method as fallback

## 📚 Documentation

- **[N8N_SETUP_GUIDE.md](N8N_SETUP_GUIDE.md)**: Complete setup instructions
- **[Database Functions](database/)**: SQL documentation
- **[Workflow Variants](n8n/)**: Different n8n workflow options

## 🔐 Security

- **RLS policies** protect user data
- **Service role keys** for n8n integration
- **OAuth credentials** stored securely
- **Webhook authentication** for status updates

## 🚀 Production Deployment

1. **Database**: Run all SQL setup scripts
2. **n8n Cloud**: Import and configure workflow
3. **Environment**: Set up OAuth credentials
4. **Monitoring**: Configure error notifications
5. **Testing**: Verify with test posts

## 📈 Monitoring

### Queue Health
```sql
SELECT * FROM get_queue_health();
```

### Success Rates
```sql
SELECT * FROM generate_scheduling_report('user-id', 7);
```

### Cleanup
```sql
SELECT cleanup_old_queue_entries(30);
```

## 🎯 Next Steps

1. **Set up n8n Cloud** following the setup guide
2. **Configure OAuth** for social media platforms
3. **Test scheduling** with sample posts
4. **Monitor performance** and adjust as needed
5. **Scale up** for production use

---

**🚀 Ready for automated social media scheduling!**

For detailed setup instructions, see [N8N_SETUP_GUIDE.md](N8N_SETUP_GUIDE.md)
