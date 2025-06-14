# LinkedIn OAuth Fix 2024 - URGENT

## Problem
LinkedIn deprecated `r_liteprofile` and `r_emailaddress` scopes in August 2023. Now requires OpenID Connect.

## IMMEDIATE SOLUTION

### 1. Update LinkedIn App Products (CRITICAL)
Go to https://www.linkedin.com/developers/apps → Your App → Products tab

**MUST ENABLE THESE TWO PRODUCTS:**
- ✅ **"Sign In with LinkedIn using OpenID Connect"**
- ✅ **"Share on LinkedIn"**

### 2. Updated OAuth Scopes (ALREADY FIXED IN CODE)
- ❌ OLD: `r_liteprofile r_emailaddress w_member_social`
- ✅ NEW: `openid profile email w_member_social`

### 3. Test URL
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=86z7443djn3cgx&redirect_uri=https%3A%2F%2Feqiuukwwpdiyncahrdny.supabase.co%2Ffunctions%2Fv1%2Foauth-callback&scope=openid%20profile%20email%20w_member_social&state=test123
```

### 4. Verification Steps
1. Open LinkedIn Developer Console
2. Check if both products are enabled and approved
3. If not approved, request approval
4. Test the OAuth flow

### 5. Common Issues
- **"unauthorized_scope_error"** = Products not enabled
- **"Bummer, something went wrong"** = App not approved
- **"insufficient_permissions"** = Missing w_member_social scope

## STATUS: CODE UPDATED ✅ - NEED TO ENABLE LINKEDIN PRODUCTS
