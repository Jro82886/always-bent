# Railway Deployment Instructions - Python Ocean Features Backend

**Status:** Ready to deploy (all config files verified ✅)
**Estimated Time:** 10-15 minutes
**Cost:** FREE (Railway Free Tier - 500 hours/month)

---

## Prerequisites Verification ✅

- [x] `railway.json` configured
- [x] `.railwayignore` configured
- [x] `requirements.txt` present
- [x] FastAPI app at `python/app/main.py`
- [x] Health check endpoint at `/health`
- [x] CORS configured for Vercel domains

**All files are ready. No code changes needed.**

---

## Step-by-Step Deployment

### Step 1: Create Railway Account (2 minutes)

1. Go to https://railway.app
2. Click "Login" (top right)
3. Choose "Sign in with GitHub"
4. Authorize Railway to access your GitHub account

**Note:** Using GitHub login allows Railway to auto-deploy on git pushes.

---

### Step 2: Create New Project (3 minutes)

1. Click "New Project" button (dashboard)
2. Select "Deploy from GitHub repo"
3. **Important:** If you don't see your repo:
   - Click "Configure GitHub App"
   - Grant access to `always-bent` repository
4. Select the `always-bent` repository from the list

---

### Step 3: Configure Service (5 minutes)

Railway will auto-detect the Python app, but you need to set the root directory:

1. After selecting the repo, Railway will create a service
2. Click on the service card
3. Go to **Settings** tab
4. Under **Source**, find "Root Directory"
5. Set Root Directory to: `python`
6. Click "Save"

**Railway will automatically:**
- Detect `railway.json` configuration
- Install dependencies from `requirements.txt`
- Run the start command: `cd app && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set up health checks at `/health`

---

### Step 4: Configure Environment Variables (2 minutes)

The Python backend needs Copernicus credentials:

1. In Railway service, go to **Variables** tab
2. Add the following environment variables:

```
COPERNICUS_USER=<your-copernicus-email>
COPERNICUS_PASS=<your-copernicus-password>
```

**Where to get these:**
- These are the same credentials used in Vercel
- Check: `.env.production.local` (created earlier)
- OR get from Vercel: `vercel env pull`

3. Click "Add Variable" for each
4. Railway will automatically redeploy

---

### Step 5: Get Deployment URL (1 minute)

1. Go to **Settings** tab
2. Under **Networking**, find "Public Networking"
3. Click "Generate Domain"
4. Railway will provide a URL like:

```
https://always-bent-ocean-production.up.railway.app
```

**Copy this URL - you'll need it for Vercel!**

---

### Step 6: Test Deployment (2 minutes)

Test the deployed backend:

```bash
# Health check
curl https://your-app.up.railway.app/health

# Expected: {"status": "healthy", "service": "ocean-features-api"}

# Root endpoint
curl https://your-app.up.railway.app/

# Expected: {"message": "Always Bent Ocean Features API", ...}

# Test thermal fronts (should return GeoJSON)
curl "https://your-app.up.railway.app/ocean-features/fronts?bbox=35.5,-75.5,36.5,-74.5&date=2025-11-17"
```

**If all three return valid JSON, deployment is successful! ✅**

---

### Step 7: Update Vercel Environment Variables (3 minutes)

Now update Vercel to point to the Railway backend:

```bash
cd always-bent

# Remove old localhost values
vercel env rm NEXT_PUBLIC_POLYGONS_URL production
vercel env rm POLYGONS_BACKEND_URL production

# Add production Railway URL
vercel env add NEXT_PUBLIC_POLYGONS_URL production
# When prompted, enter: https://your-app.up.railway.app

vercel env add POLYGONS_BACKEND_URL production
# When prompted, enter: https://your-app.up.railway.app

# Also update Preview environment (for testing)
vercel env add NEXT_PUBLIC_POLYGONS_URL preview
# Enter same URL

vercel env add POLYGONS_BACKEND_URL preview
# Enter same URL
```

---

### Step 8: Redeploy Vercel (2 minutes)

Trigger a new Vercel deployment to pick up the new env vars:

```bash
vercel --prod
```

**OR** via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select `always-bent` project
3. Go to "Deployments" tab
4. Click "..." menu on latest deployment
5. Click "Redeploy"
6. Check "Use existing Build Cache"
7. Click "Redeploy"

---

### Step 9: Test in Production (2 minutes)

1. Go to https://alwaysbentfishingintelligence.com/legendary/tracking
2. Open browser DevTools (F12) → Network tab
3. Click "Ocean Features" toggle → Enable "Thermal Fronts"
4. Check Network tab for requests to Railway URL
5. Verify thermal fronts appear on the map

**Expected:** Orange/red lines appear showing temperature fronts

---

## Troubleshooting

### Railway Build Fails

**Error:** `No module named 'fastapi'`
- **Fix:** Ensure `requirements.txt` is in `/python` directory
- **Check:** Railway Root Directory is set to `python`

### Railway Deployment Times Out

**Error:** Health check timeout
- **Fix:** Check logs in Railway dashboard
- **Common Issue:** Port binding - FastAPI must bind to `$PORT` env var
- **Verify:** Start command in `railway.json` is correct

### CORS Errors in Browser

**Error:** `Access-Control-Allow-Origin` header missing
- **Fix:** Add your Vercel domain to CORS origins in `python/app/main.py`
- **Check Lines 29-37** in main.py

### No Data Returns from Endpoints

**Error:** 401 or 403 from Copernicus
- **Fix:** Verify `COPERNICUS_USER` and `COPERNICUS_PASS` in Railway Variables
- **Test:** Try credentials manually at https://marine.copernicus.eu

---

## Monitoring & Logs

### View Logs
1. Railway Dashboard → Your Service
2. Click "Deployments" tab
3. Click latest deployment
4. Logs appear in real-time

### Monitor Usage
- Railway Dashboard → Project
- View CPU, Memory, Network usage
- Free tier: 500 hours/month (500 hours = always on for 20 days)

### Set Up Alerts
1. Railway Dashboard → Project Settings
2. Under "Notifications"
3. Add webhook or email for deployment failures

---

## Cost Estimates

**Free Tier:**
- 500 execution hours/month
- 512 MB RAM
- 1 GB disk
- Shared CPU

**If you exceed free tier:**
- Hobby Plan: $5/month
- Includes $5 credit (enough for 24/7 uptime)

**Estimated Usage:**
- Small app like this: ~$0-5/month
- Should stay in free tier unless high traffic

---

## Auto-Deployment

Railway is now connected to your GitHub repo!

**Every time you push to `main` branch:**
1. Railway auto-detects changes in `/python` directory
2. Rebuilds and redeploys automatically
3. Zero downtime deployment
4. Rollback available if needed

---

## Rollback Procedure

If deployment fails:

1. Railway Dashboard → Deployments
2. Find last working deployment
3. Click "..." menu
4. Click "Redeploy"

---

## Next Steps After Deployment

1. ✅ Test all three ocean features:
   - Thermal Fronts
   - Chlorophyll Edges
   - Eddies
2. ✅ Verify real-time data updates
3. ✅ Check performance (response times should be < 2 seconds)
4. ✅ Notify client that ocean features are now live

---

## Support

**Railway Support:**
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

**Issue?** Check Railway logs first, then GitHub issues.

---

**Generated via Operation: Damage Control**
**All configuration verified and ready to deploy**
