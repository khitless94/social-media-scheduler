# Test Reddit Flair Function

## 🔍 **Debug Steps**

### **Step 1: Check if Function is Deployed**

Run this command to see if the function exists:
```bash
supabase functions list
```

You should see `get-reddit-flairs` in the list.

### **Step 2: Deploy the Function (if not deployed)**

```bash
supabase functions deploy get-reddit-flairs
```

### **Step 3: Test the Function Directly**

Open browser console and run this test:

```javascript
// Test the flair function directly
async function testFlairFunction() {
  try {
    console.log('🧪 Testing flair function...');
    
    // Get session
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.error('❌ No session found');
      return;
    }
    
    console.log('✅ Session found, testing function...');
    
    const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/get-reddit-flairs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ subreddit: 'n8n' })
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Function error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Function response:', data);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testFlairFunction();
```

### **Step 4: Check Supabase Function Logs**

In your Supabase dashboard:
1. Go to **Edge Functions**
2. Click on **get-reddit-flairs**
3. Check the **Logs** tab for any errors

### **Step 5: Test in App**

1. **Refresh browser**
2. **Open browser console** (F12)
3. **Select Reddit platform**
4. **Choose "n8n" subreddit**
5. **Watch console for debug messages**

Look for these debug messages:
- `🎯 [FLAIR DEBUG] loadSubredditFlairs called with: "n8n"`
- `🔍 [FLAIR DEBUG] Real subreddit detected: r/n8n, starting flair fetch...`
- `📡 [FLAIR DEBUG] Calling: https://...`
- `📥 [FLAIR DEBUG] Response status: 200`

### **Common Issues:**

1. **Function not deployed**: Run `supabase functions deploy get-reddit-flairs`
2. **Reddit not connected**: Check if Reddit account is connected in Settings
3. **CORS issues**: Check if function has proper CORS headers
4. **Authentication issues**: Check if session token is valid

### **Expected Console Output:**

```
🎯 [FLAIR DEBUG] loadSubredditFlairs called with: "n8n"
🔍 [FLAIR DEBUG] Real subreddit detected: r/n8n, starting flair fetch...
🔍 [FLAIR DEBUG] Starting flair fetch for r/n8n...
🔑 [FLAIR DEBUG] Session exists, token length: 1234
📡 [FLAIR DEBUG] Calling: https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/get-reddit-flairs
📋 [FLAIR DEBUG] Request body: {subreddit: "n8n"}
📥 [FLAIR DEBUG] Response status: 200
📊 [FLAIR DEBUG] Response data: {success: true, subreddit: "n8n", flairs: [...]}
✅ [FLAIR DEBUG] Fetched X flairs for r/n8n
🏁 [FLAIR DEBUG] Flair loading finished for r/n8n
```

**Run these tests and let me know what you see in the console!**
