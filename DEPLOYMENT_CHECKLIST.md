# 🚀 Production Deployment Checklist

## ✅ **Code Changes Complete**

### **Files Updated for Production:**
- ✅ `vercel.json` - Vercel configuration with production settings
- ✅ `.env.production` - Production environment variables
- ✅ `vite.config.ts` - Production build optimization
- ✅ `src/components/OAuthCallback.tsx` - Updated hardcoded URLs
- ✅ `VERCEL_PRODUCTION_SETUP.md` - Deployment guide

## 🔧 **Required Manual Updates**

### **1. Supabase Dashboard**
Go to: https://supabase.com/dashboard/project/eqiuukwwpdiyncahrdny/settings/environment-variables

**Update this variable:**
```
YOUR_FRONTEND_URL = https://scribe-schedule-labs.vercel.app
```

### **2. Vercel Dashboard**
In your Vercel project settings, add these environment variables:
```
VITE_SUPABASE_URL = https://eqiuukwwpdiyncahrdny.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs
VITE_FRONTEND_URL = https://scribe-schedule-labs.vercel.app
NODE_ENV = production
```

### **3. Social Media App Redirect URIs**
Update all social media apps to use this callback URL:
```
https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback
```

**Platforms to update:**
- ✅ **Twitter/X**: https://developer.twitter.com/en/portal/dashboard
- ✅ **LinkedIn**: https://www.linkedin.com/developers/apps
- ✅ **Facebook/Meta**: https://developers.facebook.com/apps
- ✅ **Reddit**: https://www.reddit.com/prefs/apps

## 🚀 **Deploy Commands**

### **Option 1: Vercel CLI**
```bash
npm i -g vercel
vercel --prod
```

### **Option 2: Git Integration**
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

## 🧪 **Post-Deployment Testing**

### **1. Basic Functionality**
- [ ] Visit: https://scribe-schedule-labs.vercel.app
- [ ] Sign up/Login works
- [ ] Dashboard loads properly
- [ ] No console errors

### **2. OAuth Testing**
- [ ] Go to Settings page
- [ ] Try connecting each social media platform
- [ ] OAuth flows complete successfully
- [ ] Connection status updates correctly

### **3. Posting Testing**
- [ ] Create a new post
- [ ] Test posting to connected platforms
- [ ] Verify posts appear in social media accounts
- [ ] Check post history

### **4. Console Check**
- [ ] No localhost references in console
- [ ] No CORS errors
- [ ] All API calls use production URLs

## 🎯 **Production URLs**

### **Frontend:**
- **Main App**: https://scribe-schedule-labs.vercel.app
- **OAuth Callback**: https://scribe-schedule-labs.vercel.app/oauth/callback

### **Backend (Supabase):**
- **Auth Redirect**: https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/auth-redirect
- **OAuth Callback**: https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback
- **Post to Social**: https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social

## ✅ **Ready for Production!**

Your app is now fully configured for production deployment with:
- ✅ No localhost dependencies
- ✅ Production URLs enforced
- ✅ Optimized builds
- ✅ Proper OAuth flows
- ✅ Security headers
- ✅ Environment variables configured
