# 🔗 Manual n8n Workflow Connection Guide

## Step 1: Import the Workflow
1. Import the `fixed-connected-workflow.json` file
2. You'll see all nodes but they may appear disconnected

## Step 2: Connect the Webhook Flow (Top Row)

### Connection 1: Webhook → Check OPTIONS
- Drag from **"Webhook - Schedule Post"** output dot → **"Check OPTIONS"** input dot

### Connection 2: Check OPTIONS → Two Branches
- Drag from **"Check OPTIONS"** **TOP output** (True) → **"OPTIONS Response"** input
- Drag from **"Check OPTIONS"** **BOTTOM output** (False) → **"Process Webhook Data"** input

### Connection 3: Process Webhook → Save to Queue
- Drag from **"Process Webhook Data"** output → **"Save to Queue"** input

### Connection 4: Save to Queue → Success Response
- Drag from **"Save to Queue"** output → **"Webhook Success Response"** input

### Connection 5: Error Handling
- Right-click **"Process Webhook Data"** → Select error output → Connect to **"Webhook Error Response"**
- Right-click **"Save to Queue"** → Select error output → Connect to **"Webhook Error Response"**

## Step 3: Connect the Auto-Post Flow (Bottom Row)

### Connection 6: Schedule Trigger → Fetch Posts
- Drag from **"Schedule Trigger - Check Posts"** output → **"Fetch Pending Posts"** input

### Connection 7: Fetch Posts → Check Posts
- Drag from **"Fetch Pending Posts"** output → **"Check Pending Posts"** input

### Connection 8: Check Posts → Process Posts
- Drag from **"Check Pending Posts"** **BOTTOM output** (True) → **"Process Pending Posts"** input
- Leave the TOP output (False) unconnected - this is normal

### Connection 9: Process Posts → Mark Processing
- Drag from **"Process Pending Posts"** output → **"Mark as Processing"** input

### Connection 10: Mark Processing → Auto Publish
- Drag from **"Mark as Processing"** output → **"Auto Publish to Platforms"** input

### Connection 11: Auto Publish → Update Status
- Drag from **"Auto Publish to Platforms"** output → **"Update Final Status"** input

## Step 4: Verify Connections
Your workflow should look like this:

```
WEBHOOK FLOW (Top):
Webhook → Check OPTIONS → [OPTIONS Response]
                      ↓
                Process Webhook → Save to Queue → Success Response
                      ↓ (error)        ↓ (error)
                Error Response ← ← ← ← ← ←

AUTO-POST FLOW (Bottom):
Schedule Trigger → Fetch Posts → Check Posts → Process Posts → Mark Processing → Auto Publish → Update Status
```

## Step 5: Save and Activate
1. Click **Save** button
2. Toggle **Active** to ON
3. The workflow is now ready!

## 🧪 Test Commands

After connecting, test with:

```powershell
# Test webhook
$scheduleTime = (Get-Date).AddMinutes(2).ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$response = Invoke-WebRequest -Uri "https://k94.app.n8n.cloud/webhook/schedule-post" -Method POST -Headers @{"Content-Type"="application/json"} -Body "{`"user_id`": `"11111111-1111-1111-1111-111111111111`", `"content`": `"Testing connected workflow!`", `"platform`": `"twitter`", `"scheduled_for`": `"$scheduleTime`"}"
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

## 🔧 Troubleshooting

If connections don't work:
1. **Delete all nodes** and re-import
2. **Check node IDs** match the connection definitions
3. **Ensure database credentials** are configured
4. **Verify webhook URL** is correct

## ✅ Success Indicators

- All nodes show green connections
- No red error indicators
- Webhook responds with success
- Auto-posting runs every minute
