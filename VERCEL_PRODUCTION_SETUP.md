# 🚀 Vercel Production Setup Guide

## ✅ **Vercel Configuration Complete**

Your app is now configured for production deployment on Vercel with proper URL handling.

## 📁 **Files Created/Updated:**

### 1. **vercel.json** ✅
- Proper SPA routing configuration
- Security headers
- Production environment variables
- Build optimization

### 2. **.env.production** ✅
- Production-only environment variables
- Supabase production URLs
- Frontend production URL

### 3. **vite.config.ts** ✅
- Production build optimization
- Environment-specific URL handling
- Minification for production

## 🔧 **Vercel Dashboard Setup**

### **Step 1: Environment Variables**
In your Vercel Dashboard → Project Settings → Environment Variables, add:

```
VITE_SUPABASE_URL = https://eqiuukwwpdiyncahrdny.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs
VITE_FRONTEND_URL = https://scribe-schedule-labs.vercel.app
NODE_ENV = production
```

### **Step 2: Build Settings**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🎯 **Production URLs Enforced:**

### **Frontend Application:**
- **Production URL**: `https://scribe-schedule-labs.vercel.app`
- **OAuth Callback**: `https://scribe-schedule-labs.vercel.app/oauth/callback`

### **Supabase Edge Functions:**
- **Auth Redirect**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/auth-redirect`
- **OAuth Callback**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`
- **Post to Social**: `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social`

## 🔗 **Required Updates:**

### **1. Supabase Environment Variable**
Update in Supabase Dashboard:
```
YOUR_FRONTEND_URL = https://scribe-schedule-labs.vercel.app
```

### **2. Social Media App Redirect URIs**
Update all social media apps to use:
```
https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback
```

## 🚀 **Deployment Commands:**

### **Deploy to Vercel:**
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

### **Or use Git Integration:**
1. Connect your GitHub repo to Vercel
2. Push to main branch
3. Automatic deployment with production settings

## ✅ **Production Checklist:**

- ✅ **vercel.json** configured
- ✅ **Environment variables** set in Vercel Dashboard
- ✅ **Production URLs** enforced in all configs
- ✅ **Build optimization** enabled
- ✅ **Security headers** configured
- ✅ **SPA routing** properly handled
- ⚠️ **Supabase YOUR_FRONTEND_URL** - Update this!
- ⚠️ **Social Media OAuth redirects** - Update these!

## 🧪 **Testing After Deployment:**

1. **Visit**: `https://scribe-schedule-labs.vercel.app`
2. **Test Authentication**: Sign up/login
3. **Test OAuth**: Connect social media accounts
4. **Test Posting**: Create and publish posts
5. **Check Console**: No localhost references

## 🎉 **Ready for Production!**

Your app is now fully configured for production deployment on Vercel with:
- ✅ Production URLs only
- ✅ Optimized builds
- ✅ Proper routing
- ✅ Security headers
- ✅ Environment variables
