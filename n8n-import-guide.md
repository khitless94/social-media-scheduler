# 📥 n8n Workflow Import Guide

## 🚨 **If JSON Won't Paste - Try These Solutions:**

### **Option 1: Simple Workflow (Recommended)**
Use `n8n-simple-scheduler.json` - it's smaller and easier to import.

### **Option 2: Manual Import Steps**

1. **Open n8n Cloud** → **Workflows** → **New Workflow**

2. **Add nodes manually** in this order:
   - **Schedule Trigger** (every 5 minutes)
   - **HTTP Request** (Fetch Pending Posts)
   - **IF** (Check Posts Exist)
   - **Split in Batches** (Split Posts)
   - **HTTP Request** (Post to Social Media)
   - **HTTP Request** (Update Post Status)

3. **Configure each node** with these settings:

### **Schedule Trigger:**
- Interval: 5 minutes

### **Fetch Pending Posts (HTTP Request):**
- Method: POST
- URL: `https://eqiuukwwpdiyncahrdny.supabase.co/rest/v1/rpc/get_pending_scheduled_posts`
- Headers:
  - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.oUxZvopxq77zraXu4h3C2v31YSSRUZqwrXc48d-R8Zs`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.oUxZvopxq77zraXu4h3C2v31YSSRUZqwrXc48d-R8Zs`
  - `Content-Type`: `application/json`
- Body: `{}`

### **Check Posts Exist (IF):**
- Condition: `{{ $json.length }}` > 0

### **Split Posts (Split in Batches):**
- Default settings

### **Post to Social Media (HTTP Request):**
- Method: POST
- URL: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-{{ $json.platform }}`
- Headers:
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.oUxZvopxq77zraXu4h3C2v31YSSRUZqwrXc48d-R8Zs`
  - `Content-Type`: `application/json`
- Body: `{{ JSON.stringify($json) }}`

### **Update Post Status (HTTP Request):**
- Method: PATCH
- URL: `https://eqiuukwwpdiyncahrdny.supabase.co/rest/v1/posts?id=eq.{{ $('Split Posts').item.json.id }}`
- Headers:
  - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.oUxZvopxq77zraXu4h3C2v31YSSRUZqwrXc48d-R8Zs`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MDkzNywiZXhwIjoyMDY0NzY2OTM3fQ.oUxZvopxq77zraXu4h3C2v31YSSRUZqwrXc48d-R8Zs`
  - `Content-Type`: `application/json`
- Body: 
```json
{
  "status": "published",
  "published_at": "{{ new Date().toISOString() }}",
  "n8n_execution_id": "{{ $execution.id }}"
}
```

### **Option 3: Copy-Paste Troubleshooting**

If JSON still won't paste:

1. **Try a different browser** (Chrome, Firefox, Safari)
2. **Clear browser cache** and cookies
3. **Disable browser extensions** temporarily
4. **Use incognito/private mode**
5. **Try smaller chunks** - copy just the nodes section first

### **Option 4: File Upload**

Some n8n instances support file upload:
1. Save JSON to a `.json` file
2. Look for "Import from file" option in n8n
3. Upload the file directly

## 🧪 **Testing the Workflow**

1. **Save and activate** the workflow
2. **Create a test post** in your app
3. **Schedule it** for 2-3 minutes in the future
4. **Monitor n8n executions** for activity
5. **Check your database** for status updates

## 🔧 **Troubleshooting**

- **No executions**: Check if workflow is activated
- **Authentication errors**: Verify service key is correct
- **Function not found**: Ensure Supabase functions are deployed
- **Database errors**: Check post ID and table structure

## 📞 **Need Help?**

If you're still having issues, try:
1. The simple workflow first
2. Manual node creation
3. Check n8n documentation for your specific version
