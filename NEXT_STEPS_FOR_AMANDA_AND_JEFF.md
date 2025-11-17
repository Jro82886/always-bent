# Next Steps - Action Items for Amanda & Jeff
**Always Bent Fishing Intelligence Platform**
**Date:** November 17, 2025
**Prepared by:** Development Team

---

## 🎯 Executive Summary

This document outlines **7 critical action items** that require project owner access or account setup. These items will unlock the following features:

- ✅ **Fix SST temperature bug** (ready to merge - awaiting review)
- ✅ **Enable live chat with persistence** (requires Supabase config)
- ✅ **Deploy ocean features backend** (requires Railway account)
- ✅ **Replace failing APIs** (StormGlass → OpenWeather, GFW → MarineTraffic)
- ✅ **Stabilize production infrastructure**

**Estimated Time to Complete All Items:** 2-3 hours

---

## 📋 Priority Action Items

### 🔴 CRITICAL #1: Review & Merge SST Temperature Fix
**Status:** Ready for Review
**Priority:** P0 - Production Bug
**Time Required:** 15 minutes
**Assigned To:** Amanda & Jeff (Code Review)

#### Background
Client reported seeing "temperatures in the 200's°F" instead of correct ocean temperatures (50-70°F range). Root cause identified: disabled Kelvin → Fahrenheit conversion function.

#### What Was Done
- ✅ Re-enabled temperature conversion: `(K - 273.15) × 9/5 + 32`
- ✅ Fixed validation range (was validating Fahrenheit on Kelvin values)
- ✅ Tested locally: 283K → 50°F ✓
- ✅ Created PR #14 on branch `fix/sst-conversion-final`

#### Your Action Required
1. **Review PR #14:**
   - GitHub: https://github.com/[org]/always-bent/pull/14
   - Check the diff in:
     - `/src/lib/wmts/layers.ts` (conversion function)
     - `/src/lib/wmts/deterministic-sampler.ts` (validation range)

2. **Approve & Merge:**
   - If code looks good, approve the PR
   - Merge to `main` branch
   - Vercel will auto-deploy to production

3. **Test in Production:**
   - Visit https://alwaysbentfishingintelligence.com/legendary/analysis
   - Create a Snip near Ocean City, MD
   - Verify SST shows 50-70°F (not 200's)

#### Expected Outcome
- ✅ SST temperatures display correctly in Fahrenheit
- ✅ Snip analysis shows accurate ocean temps
- ✅ Client trust restored

---

### 🔴 CRITICAL #2: Enable Supabase Anonymous Authentication
**Status:** Blocked - Requires Admin Access
**Priority:** P0 - Chat Feature Not Working
**Time Required:** 2 minutes
**Assigned To:** Jeff (Supabase Admin)

#### Background
Community chat messages don't persist across page refreshes. Users can see messages in real-time while on the page, but they disappear when refreshing. This is because anonymous authentication is disabled in Supabase.

#### Current Workaround
Chat works using in-memory storage (WebSocket broadcast only), but messages don't save to database.

#### Your Action Required

**Step 1: Go to Supabase Dashboard**
```
URL: https://supabase.com/dashboard/project/hobvjmmambhonsugehge
```

**Step 2: Navigate to Authentication**
1. Click **"Authentication"** in left sidebar
2. Click **"Providers"** tab
3. Scroll down to **"Anonymous"** section
4. Toggle **"Enable Anonymous Sign-ins"** to **ON**
5. Click **"Save"** (if prompted)

**That's it!** Takes 30 seconds.

#### What This Enables
- ✅ Chat messages save to database (`chat_messages` table)
- ✅ Messages persist across page refreshes
- ✅ Real-time sync across all users
- ✅ Users can later convert anonymous accounts to permanent accounts

#### Security Note
From Supabase docs:
- Anonymous users get `authenticated` role (not `anon` key)
- **Recommended:** Enable CAPTCHA to prevent abuse (optional)
- Row-Level Security (RLS) policies already configured
- Rate limiting: 30 requests/hour (default)

#### Testing After Enabling
1. Go to Community → Chat
2. Send a message
3. Refresh the page
4. Message should still be there ✓

#### Files Modified (Already Done)
- `/src/lib/services/chat.ts` - Anonymous auth logic
- `/supabase/migrations/20251117_enable_anonymous_auth.sql` - Migration ready
- `.env.local` - `NEXT_PUBLIC_CHAT_MOCK=0` (already set to use real Supabase)

---

### 🔴 CRITICAL #3: Deploy Python Ocean Features Backend to Railway
**Status:** Ready to Deploy
**Priority:** P0 - Feature Complete But Not Live
**Time Required:** 15 minutes
**Assigned To:** Amanda or Jeff

#### Background
Ocean feature detection (thermal fronts, chlorophyll edges, eddies) is fully coded and tested locally. Backend needs production hosting to go live.

#### What's Complete
- ✅ FastAPI Python backend (`/python/app/main.py`)
- ✅ Three detection algorithms working
- ✅ Frontend integration complete
- ✅ Railway config files ready (`railway.json`)
- ✅ Deployment guide written (`RAILWAY_DEPLOYMENT_INSTRUCTIONS.md`)

#### Your Action Required

**Step 1: Create Railway Account (2 minutes)**
1. Go to https://railway.com
2. Click "Sign up with GitHub"
3. Authorize Railway to access your GitHub account

**Step 2: Create New Project (3 minutes)**
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. **Important:** If you don't see `always-bent` repo:
   - Click "Configure GitHub App"
   - Grant Railway access to `always-bent` repository
4. Select **`always-bent`** from the list

**Step 3: Configure Service (2 minutes)**
Railway will create a service automatically:
1. Click on the service card
2. Go to **Settings** tab
3. Under **Source** → **Root Directory**
4. Set to: `python`
5. Click **"Save"**

Railway will automatically:
- Detect Python app from `railway.json`
- Install dependencies from `requirements.txt`
- Run the FastAPI server
- Set up health checks at `/health`

**Step 4: Add Environment Variables (2 minutes)**
1. In Railway service, go to **Variables** tab
2. Add these two variables:
   ```
   COPERNICUS_USER=<your-copernicus-email>
   COPERNICUS_PASS=<your-copernicus-password>
   ```
   (Same credentials from `.env.local`)
3. Railway will auto-redeploy

**Step 5: Get Production URL (1 minute)**
1. Go to **Settings** tab
2. Under **Networking** → **Public Networking**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://always-bent-ocean.up.railway.app`)

**Step 6: Send URL to Dev Team**
Send the Railway URL so we can:
- Update Vercel environment variables
- Test the deployment
- Verify ocean features work in production

#### Cost
- **FREE** - Railway free tier: 500 hours/month
- If exceeded: $5/month (includes $5 credit = basically free for small apps)

#### Testing After Deployment
```bash
# Test health endpoint
curl https://your-app.up.railway.app/health

# Expected: {"status": "healthy", "service": "ocean-features-api"}
```

#### Detailed Guide
See: `RAILWAY_DEPLOYMENT_INSTRUCTIONS.md` (35-step walkthrough)

---

### 🟡 HIGH #4: Replace StormGlass API with OpenWeather
**Status:** Ready to Merge
**Priority:** P1 - Cost Savings + Stability
**Time Required:** 10 minutes
**Assigned To:** Amanda & Jeff (Code Review)

#### Background
StormGlass API is returning 403 errors on every request. This is likely due to:
- Expired/invalid API key, OR
- Account quota exceeded, OR
- API access revoked

Current impact:
- ✅ SST data working (Copernicus fallback)
- ❌ Wind/wave data using mock fallbacks (not real)

#### Solution
PR #15 replaces StormGlass with **OpenWeather API** (FREE tier):
- ✅ No authentication errors
- ✅ 1 million calls/month FREE
- ✅ More reliable service
- ✅ Better global coverage

#### Your Action Required

**Step 1: Get OpenWeather API Key (5 minutes)**
1. Go to https://openweathermap.org
2. Sign up for free account
3. Go to **API Keys** section
4. Copy your API key

**Step 2: Add to Vercel Environment Variables (3 minutes)**
```bash
# Via Vercel Dashboard:
# 1. Go to https://vercel.com/[team]/always-bent/settings/environment-variables
# 2. Add new variable:
#    Name: OPENWEATHER_API_KEY
#    Value: <paste your key>
#    Environment: Production, Preview, Development
# 3. Save

# OR via CLI:
vercel env add OPENWEATHER_API_KEY production
vercel env add OPENWEATHER_API_KEY preview
vercel env add OPENWEATHER_API_KEY development
```

**Step 3: Review & Merge PR #15**
1. GitHub: https://github.com/[org]/always-bent/pull/15
2. Review changes in `/src/app/api/stormio/route.ts`
3. Approve and merge to `main`
4. Vercel auto-deploys

**Step 4: Remove Old StormGlass Key (Optional)**
```bash
# Clean up old env var:
vercel env rm STORMGLASS_API_KEY production
```

#### Cost Savings
- **Before:** StormGlass $50-200/month (if working)
- **After:** OpenWeather $0/month (free tier sufficient)

#### Testing After Merge
1. Visit tracking page
2. Check weather card for wind/wave data
3. Should show real data (not mock fallbacks)

---

### 🟡 HIGH #5: Sign Up for MarineTraffic API (Replace GFW)
**Status:** Research & Sign-up Required
**Priority:** P1 - GFW API Not Working
**Time Required:** 30 minutes
**Assigned To:** Amanda or Jeff

#### Background
Global Fishing Watch (GFW) API has architectural limitations:
- ❌ Does NOT support geographic queries ("show all vessels in this area")
- ❌ Only supports vessel-specific queries ("track this specific vessel")
- ❌ Returns 422 errors when trying to query by bounding box

**Current Status:** "No Commercial Activity" displays even in active fishing areas.

**From CRITICAL-API-ISSUES.md:**
> The API is designed for **vessel-centric queries** (track a specific vessel)
> NOT designed for **geographic queries** (show all vessels in an area)

#### Recommended Alternative: MarineTraffic API
MarineTraffic provides real-time AIS vessel data with geographic filtering.

**Features:**
- ✅ Query vessels by bounding box (geographic area)
- ✅ Real-time AIS positions
- ✅ Vessel type filtering (fishing, cargo, tanker, etc.)
- ✅ Historical tracks available
- ✅ REST API with good documentation

#### Your Action Required

**Step 1: Research Plans (15 minutes)**
1. Go to https://www.marinetraffic.com/en/ais-api-services
2. Review pricing tiers:
   - **Starter:** $50-100/month (basic vessel data)
   - **Professional:** $200-500/month (includes historical tracks)
   - **Enterprise:** Custom pricing
3. Check which plan includes:
   - Bounding box queries
   - Vessel type filtering
   - Reasonable rate limits (100-1000 requests/day)

**Step 2: Sign Up for Account (10 minutes)**
1. Create account at https://www.marinetraffic.com
2. Subscribe to appropriate plan
3. Get API key from dashboard

**Step 3: Send Credentials to Dev Team (5 minutes)**
Send us:
- API key
- API endpoint URLs
- Rate limits
- Documentation link

We'll integrate it into the existing GFW vessel layer component.

#### Alternative Options
If MarineTraffic is too expensive:
1. **VesselFinder API** - Similar to MarineTraffic, cheaper plans
2. **AISHub** - Community-driven, free but limited coverage
3. **Pre-computed Regional Data** - We periodically fetch data and cache in Supabase

#### Cost Comparison
- **GFW API:** FREE but doesn't work for our use case
- **MarineTraffic:** $50-500/month (works for geographic queries)
- **VesselFinder:** $30-200/month (alternative)

#### Files to Update (After API Key Received)
- `/src/app/api/gfw/vessels/route.ts` - Replace GFW with MarineTraffic
- `/src/components/tracking/GFWVesselLayer.tsx` - Update to new API format
- Environment variables: Add `MARINETRAFFIC_API_KEY`

---

### 🟢 MEDIUM #6: Grant Railway Project Access
**Status:** Required After Initial Deployment
**Priority:** P2 - Team Collaboration
**Time Required:** 2 minutes
**Assigned To:** Amanda or Jeff (after completing #3)

#### Background
Once Railway project is created (see #3 above), the dev team needs access to:
- View deployment logs
- Monitor performance
- Debug issues
- Update environment variables

#### Your Action Required

**After creating Railway project:**

1. **Go to Railway Project Settings**
   - Dashboard: https://railway.app/dashboard
   - Click on `always-bent` project
   - Click **"Settings"** tab

2. **Add Team Members**
   - Scroll to **"Members"** section
   - Click **"Invite Member"**
   - Add email addresses:
     - `maurizio@levelthree.co` (Developer)
     - [Any other team members]
   - Select role: **"Developer"** or **"Admin"**
   - Click **"Send Invite"**

3. **Share Project Link**
   Send us the project URL:
   ```
   https://railway.app/project/[project-id]
   ```

#### What This Enables
- ✅ Team can view deployment logs
- ✅ Team can update environment variables
- ✅ Team can monitor performance metrics
- ✅ Team can trigger manual deploys if needed

---

### 🟢 MEDIUM #7: Enable Supabase Realtime for Chat Channels
**Status:** Configuration Check
**Priority:** P2 - Chat Performance
**Time Required:** 5 minutes
**Assigned To:** Jeff (Supabase Admin)

#### Background
Chat uses Supabase Realtime (WebSockets) for instant message delivery. Need to verify Realtime is enabled and configured correctly.

#### Your Action Required

**Step 1: Check Realtime Status**
```
URL: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/database/publications
```

1. Verify **"supabase_realtime"** publication exists
2. Check that `chat_messages` table is included in publication

**Step 2: Enable Broadcast for Chat Channels (if not enabled)**
```
URL: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/database/replication
```

1. Look for **"Realtime"** section
2. Verify **"Enable Realtime"** is ON
3. Verify these channels are authorized:
   - `chat:*` (all chat channels)
   - `presence:*` (user presence)

**Step 3: Check Rate Limits**
```
URL: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/settings/billing
```

Current plan limits:
- **Free Tier:** 200 concurrent connections
- **Pro Tier ($25/mo):** 500 concurrent connections

**Our Current Usage:**
- Estimated 10-50 concurrent users
- Should be fine on Free tier for now

#### What This Enables
- ✅ Real-time message delivery (< 100ms latency)
- ✅ User presence indicators ("X users online")
- ✅ Typing indicators (future feature)
- ✅ Read receipts (future feature)

#### Testing
After anonymous auth is enabled (#2):
1. Open two browser tabs
2. Go to Community → Chat in both
3. Send message in tab 1
4. Should appear instantly in tab 2

---

## 📊 Summary Table

| # | Action Item | Priority | Time | Owner | Status |
|---|-------------|----------|------|-------|--------|
| 1 | Review & Merge SST Fix PR #14 | P0 | 15 min | Amanda/Jeff | Ready for Review |
| 2 | Enable Anonymous Auth (Supabase) | P0 | 2 min | Jeff | Blocked (Admin Access) |
| 3 | Deploy Python Backend (Railway) | P0 | 15 min | Amanda/Jeff | Ready to Deploy |
| 4 | Review & Merge OpenWeather PR #15 | P1 | 10 min | Amanda/Jeff | Ready for Review |
| 5 | Sign Up for MarineTraffic API | P1 | 30 min | Amanda/Jeff | Research Needed |
| 6 | Grant Railway Project Access | P2 | 2 min | Amanda/Jeff | After #3 |
| 7 | Verify Supabase Realtime Config | P2 | 5 min | Jeff | Configuration Check |

**Total Estimated Time:** ~80 minutes

---

## 🚀 Quick Start Guide

**If you only have 30 minutes, do these 3 items first:**

1. **Enable Anonymous Auth** (#2) - 2 minutes
   - Immediately fixes chat persistence

2. **Merge SST Fix** (#1) - 15 minutes
   - Immediately fixes client-reported temperature bug

3. **Deploy to Railway** (#3) - 15 minutes
   - Unlocks ocean features (thermal fronts, eddies, chlorophyll edges)

**Total:** 32 minutes for maximum impact

---

## 📞 Support & Questions

**For Technical Questions:**
- Developer: Maurizio (`maurizio@levelthree.co`)
- This document: `NEXT_STEPS_FOR_AMANDA_AND_JEFF.md`
- Technical details: `CRITICAL-API-ISSUES.md`

**For Account Access Issues:**
- Supabase Dashboard: https://supabase.com/dashboard
- Railway Dashboard: https://railway.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard

**For API Sign-ups:**
- OpenWeather: https://openweathermap.org/api
- MarineTraffic: https://www.marinetraffic.com/en/ais-api-services

---

## 📎 Related Documents

- `CRITICAL-API-ISSUES.md` - Full technical details of API issues
- `RAILWAY_DEPLOYMENT_INSTRUCTIONS.md` - Step-by-step Railway deployment
- `GFW_CLIENT_EXPLANATION.md` - Why GFW API doesn't work for our use case
- Pull Request #14 - SST temperature fix
- Pull Request #15 - OpenWeather integration

---

**Document Version:** 1.0
**Last Updated:** November 17, 2025
**Next Review:** After completing action items
