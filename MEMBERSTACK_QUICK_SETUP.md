# 🚀 Memberstack Quick Setup - Always Bent

## Your App ID
```
app_cmfpavrtq00zb0wws6asv8xf3
```

## ✅ What's Done
- [x] Memberstack code integrated
- [x] App ID added to .env.local
- [x] Auth pages created
- [x] Protected routes set up

## 📋 Vercel Setup (REQUIRED)
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_MEMBERSTACK_APP_ID = app_cmfpavrtq00zb0wws6asv8xf3
   ```
3. Redeploy

## 🎯 Memberstack Dashboard Setup
Go to: https://app.memberstack.com

### 1. Custom Fields (Settings → Custom Fields)
Add these fields:
- `captainName` - Text (Required)
- `boatName` - Text (Required)
- `homePort` - Text (Optional)

### 2. Plans (Plans → Create Plan)
```
Name: Beta Access
Price: $0 (or your price)
ID: plan_beta
```

### 3. Redirects (Settings → Redirects)
- After signup: `/legendary/welcome`
- After login: `/legendary`
- After logout: `/auth`

### 4. Branding (Optional)
Add to Settings → Custom CSS:
```css
.ms-modal {
  background: #0f172a !important;
  border: 1px solid #06b6d4 !important;
}
.ms-modal input {
  background: #1e293b !important;
  border: 1px solid #334155 !important;
  color: #f1f5f9 !important;
}
.ms-modal button[type="submit"] {
  background: #06b6d4 !important;
  color: #0f172a !important;
}
```

## 🧪 Test Flow
1. Run locally: `npm run dev`
2. Visit: http://localhost:3000/auth
3. Click "Launch App"
4. Create test account
5. Complete profile
6. Access app

## 🌐 Production Flow
1. User visits: app.alwaysbent.com (once domain is set)
2. Lands on `/auth` page
3. Signs up/logs in via Memberstack
4. Completes profile at `/legendary/welcome`
5. Accesses app at `/legendary`

## 🔄 What Happens to Existing Users?
- They'll be prompted to create a Memberstack account
- Their captain/boat names will be preserved
- One-time migration, then they're all set

## ⚠️ Important Notes
- Memberstack handles all auth/payments
- User data still stored in Supabase
- Falls back to localStorage if Memberstack not configured
- No data is lost during migration

## 📞 Support
- Memberstack Docs: https://docs.memberstack.com
- Their support is excellent for any issues

---
Ready to test! Just add the env var to Vercel and configure your Memberstack dashboard.
