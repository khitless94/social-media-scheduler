# 🔑 Get Twitter OAuth 1.0a Credentials

## 📋 **Step-by-Step Guide**

### **1. Go to Twitter Developer Portal**
```
https://developer.twitter.com/en/portal/dashboard
```

### **2. Find Your App**
- Look for your app with Client ID: `ZHRveEJIcVduLVdkdGJJUWYwZFc6MTpjaQ`
- Click on the app name to open it

### **3. Go to "Keys and Tokens" Tab**
- Click on the **"Keys and Tokens"** tab in your app dashboard

### **4. Get Consumer Keys (API Keys)**
Under the **"Consumer Keys"** section:
- **API Key** → Copy this (becomes `TWITTER_API_KEY`)
- **API Key Secret** → Copy this (becomes `TWITTER_API_SECRET`)

### **5. Generate Access Token & Secret**
Under the **"Access Token and Secret"** section:
- If you see **"Generate"** button, click it
- If tokens already exist, you can regenerate them
- **Access Token** → Copy this (becomes `TWITTER_ACCESS_TOKEN`)
- **Access Token Secret** → Copy this (becomes `TWITTER_ACCESS_TOKEN_SECRET`)

### **6. Verify App Permissions**
Make sure your app has:
- ✅ **Read and Write** permissions
- ✅ **Media upload** enabled

---

## 🔧 **Add to Supabase Environment Variables**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/settings/environment-variables
   ```

2. **Add these 4 variables:**

   | Variable Name | Value | Description |
   |---------------|-------|-------------|
   | `TWITTER_API_KEY` | `your_api_key_from_step_4` | Consumer Key from Twitter |
   | `TWITTER_API_SECRET` | `your_api_secret_from_step_4` | Consumer Secret from Twitter |
   | `TWITTER_ACCESS_TOKEN` | `your_access_token_from_step_5` | Access Token from Twitter |
   | `TWITTER_ACCESS_TOKEN_SECRET` | `your_access_token_secret_from_step_5` | Access Token Secret from Twitter |

3. **Click "Save" after adding each variable**

---

## ✅ **Test the Setup**

After adding the credentials:

1. **Create a new post with an image** in your app
2. **Check the function logs** for success messages:
   ```
   [Twitter] ✅ Using OAuth 1.0a for media upload
   [Twitter] ✅ Media upload successful!
   [Twitter] Media ID: 1234567890
   ```

3. **Your tweet should now include the image!** 🎉

---

## 🚨 **Important Notes**

- **These are different from OAuth 2.0 credentials** - you need both sets
- **Keep these credentials secure** - never commit them to code
- **OAuth 1.0a is required for media upload** - OAuth 2.0 Bearer tokens won't work
- **The function is already updated** - you just need to add the credentials

---

## 🔍 **Troubleshooting**

### **If you can't find the credentials:**
1. Make sure you're logged into the correct Twitter account
2. Check if your app has the right permissions
3. Try regenerating the tokens if they're old

### **If upload still fails:**
1. Check Supabase function logs for detailed error messages
2. Verify all 4 environment variables are set correctly
3. Make sure there are no extra spaces in the variable values

### **If you see "App not found" errors:**
1. Double-check the API Key and Secret
2. Make sure your app hasn't been suspended
3. Verify the app has media upload permissions

---

## 🎯 **Next Steps**

Once you add the credentials, image posting should work immediately! The function will:

1. ✅ Use OAuth 1.0a to upload the image to Twitter
2. ✅ Get a `media_id` from the upload
3. ✅ Use OAuth 2.0 to post the tweet with the image attached
4. ✅ Your followers will see the tweet with the image! 📸
