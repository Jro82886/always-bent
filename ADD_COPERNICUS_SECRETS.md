# 🔐 Adding Copernicus Credentials to GitHub Secrets

## Quick Steps (2 minutes)

### 1. Go to GitHub Secrets Page
**Direct Link:** https://github.com/Jro82886/always-bent/settings/secrets/actions

### 2. Add COPERNICUS_USER Secret
1. Click **"New repository secret"** button
2. **Name:** `COPERNICUS_USER`
3. **Secret:** (your Copernicus Marine username)
4. Click **"Add secret"**

### 3. Add COPERNICUS_PASS Secret
1. Click **"New repository secret"** button again
2. **Name:** `COPERNICUS_PASS`
3. **Secret:** (your Copernicus Marine password)
4. Click **"Add secret"**

## 📸 Visual Guide

```
GitHub Repository → Settings → Secrets and variables → Actions

┌─────────────────────────────────────────────────┐
│  Repository secrets                             │
│                                                 │
│  [New repository secret]                        │
│                                                 │
│  Name:  COPERNICUS_USER                        │
│  Secret: ****************                       │
│         [Add secret]                            │
└─────────────────────────────────────────────────┘
```

## 🔍 Where to Get Copernicus Credentials

If you don't have them yet:

1. **Register at:** https://marine.copernicus.eu/
2. **It's FREE** for non-commercial use
3. **Provides access to:**
   - Sea Surface Temperature (SST)
   - Chlorophyll concentration (CHL)
   - Ocean currents
   - And more!

## ✅ Verify It Worked

After adding both secrets:

1. Go to: https://github.com/Jro82886/always-bent/actions
2. Click "Generate Ocean Feature Polygons" workflow
3. Click "Run workflow" → "Run workflow"
4. Watch it run! (takes ~5 minutes)

## 🚨 Important Notes

- **Never commit credentials to code**
- GitHub Secrets are encrypted and safe
- Only accessible to GitHub Actions
- Not visible to anyone (including you) after creation

## 🎯 What Happens Next

Once credentials are added:
- ✅ GitHub Actions can fetch ocean data
- ✅ Daily polygon generation will work
- ✅ Your fishermen get real ocean intelligence!

---

**Need help?** The credentials should look like:
- Username: `your-email@example.com`
- Password: `your-copernicus-password`
