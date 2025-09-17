# OAuth Setup Guide for ABFI

## Quick Links
- **Supabase Auth Providers**: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/providers
- **Google Cloud Console**: https://console.cloud.google.com/
- **Facebook Developers**: https://developers.facebook.com/

## Your Supabase OAuth Callback URL
```
https://hobvjmmambhonsugehge.supabase.co/auth/v1/callback
```

---

## 🔵 Google OAuth Setup

### Step 1: Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project (name it "Always Bent" or "ABFI")
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure OAuth consent screen first:
   - User Type: **External**
   - App name: **Always Bent Fishing Intelligence**
   - User support email: Your email
   - Developer contact: Your email
   - Add your domain: `always-bent.vercel.app`
   - Save and continue through scopes (no special scopes needed)

### Step 2: Create OAuth 2.0 Client ID
1. Application type: **Web application**
2. Name: **ABFI Production**
3. Authorized JavaScript origins:
   ```
   https://always-bent.vercel.app
   https://hobvjmmambhonsugehge.supabase.co
   ```
4. Authorized redirect URIs:
   ```
   https://hobvjmmambhonsugehge.supabase.co/auth/v1/callback
   ```
5. Click **CREATE**
6. Copy the **Client ID** and **Client Secret**

### Step 3: Configure in Supabase
1. Go to: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/providers
2. Find **Google** and click **Enable Google**
3. Paste:
   - **Google Client ID**: (from step 2)
   - **Google Client Secret**: (from step 2)
4. **Authorized Client IDs**: Leave empty (optional)
5. Click **Save**

---

## 🔵 Facebook OAuth Setup

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** as app type
4. App name: **Always Bent Fishing Intelligence**
5. App contact email: Your email
6. Click **Create App**

### Step 2: Configure Facebook Login
1. In your app dashboard, find **Facebook Login** and click **Set Up**
2. Choose **Web**
3. Site URL: `https://always-bent.vercel.app`
4. Save

### Step 3: Configure OAuth Settings
1. Go to **Facebook Login** → **Settings** (in left sidebar)
2. Add to **Valid OAuth Redirect URIs**:
   ```
   https://hobvjmmambhonsugehge.supabase.co/auth/v1/callback
   ```
3. Settings to configure:
   - **Client OAuth Login**: Yes
   - **Web OAuth Login**: Yes
   - **Enforce HTTPS**: Yes
   - **Embedded Browser OAuth Login**: Yes
   - **Use Strict Mode for Redirect URIs**: Yes

### Step 4: Get App Credentials
1. Go to **Settings** → **Basic** (in left sidebar)
2. Copy:
   - **App ID**
   - **App Secret** (click Show and enter your password)

### Step 5: Configure in Supabase
1. Go to: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/providers
2. Find **Facebook** and click **Enable Facebook**
3. Paste:
   - **Facebook App ID**: (from step 4)
   - **Facebook App Secret**: (from step 4)
4. Click **Save**

### Step 6: Make Facebook App Live
1. In Facebook Developer Dashboard
2. Toggle the app from **Development** to **Live** mode
3. This makes it available to all users (not just you)

---

## ✅ Testing Your Setup

### Test Google Login:
1. Go to https://always-bent.vercel.app/auth/login
2. Click "Continue with Google"
3. Sign in with any Google account
4. Enter Captain and Boat name
5. You should be redirected to the app

### Test Facebook Login:
1. Go to https://always-bent.vercel.app/auth/login
2. Click "Continue with Facebook"
3. Sign in with any Facebook account
4. Enter Captain and Boat name
5. You should be redirected to the app

---

## 🔧 Troubleshooting

### If Google login fails:
- Check that the Client ID and Secret are correct
- Verify the redirect URI matches exactly
- Make sure the OAuth consent screen is configured
- Check that the app is not in "Testing" mode (should be in "Production")

### If Facebook login fails:
- Ensure the app is in "Live" mode, not "Development"
- Verify the App ID and Secret are correct
- Check that the redirect URI is added to Valid OAuth Redirect URIs
- Make sure HTTPS is enforced

### Common Issues:
1. **"Redirect URI mismatch"**: The URI must match EXACTLY, including https:// and no trailing slash
2. **"App not set up"**: Make sure to complete all required fields in the OAuth consent screen
3. **"Invalid client"**: Double-check Client ID/Secret are copied correctly (no extra spaces)

---

## 📝 Important Notes

1. **Keep credentials secure**: Never commit Client Secrets to git
2. **Domain verification**: You may need to verify domain ownership for production use
3. **Rate limits**: Both Google and Facebook have rate limits for OAuth
4. **Privacy Policy**: You may need to add privacy policy URL to OAuth apps

---

## 🎯 Quick Checklist

### Google:
- [ ] Created project in Google Cloud Console
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 Client ID
- [ ] Added correct redirect URI
- [ ] Copied Client ID and Secret to Supabase
- [ ] Enabled Google provider in Supabase

### Facebook:
- [ ] Created app in Facebook Developers
- [ ] Set up Facebook Login
- [ ] Added redirect URI to Valid OAuth Redirect URIs
- [ ] Copied App ID and Secret to Supabase
- [ ] Enabled Facebook provider in Supabase
- [ ] Switched app to Live mode

---

## Need Help?

If you encounter any issues:
1. Check Supabase logs: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/logs/auth
2. Check browser console for errors
3. Verify all URLs are using HTTPS
4. Make sure cookies are enabled in the browser
