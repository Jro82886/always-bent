# Critical API Issues - Always Bent Fishing Intel

Last Updated: 2025-11-17

## 🔴 CRITICAL: GFW Commercial Vessel Data Not Working

**Status**: BLOCKED - API limitations prevent geographic vessel queries

**Issue**: "No Commercial Activity" displays even in active fishing areas (e.g., New York, Cape Cod)

### Root Cause Analysis

The Global Fishing Watch API v3 has fundamental architectural limitations that prevent our use case:

1. **`/v3/vessels/search` endpoint**
   - ✅ Returns vessel data globally
   - ❌ Does NOT support geographic filtering (bbox, lat/lng, radius)
   - ❌ Returns vessel metadata only, no position data
   - Returns: `{ entries: [...], total: 487, limit: 50 }`

2. **`/v3/events` endpoint (POST)**
   - ✅ Supports geographic filtering via GeoJSON polygon
   - ❌ **REQUIRES vessel IDs** - cannot query by geography alone
   - Returns 422 error: "limit must not be less than 1" / "offset required"
   - Error when used without vessel IDs:
     ```json
     {
       "statusCode": 422,
       "error": "Unprocessable Entity",
       "messages": [
         {"title": "limit", "detail": "limit must not be less than 1"},
         {"title": "If", "detail": "If you send the limit property then the offset property is required"}
       ]
     }
     ```

3. **API Design**
   - The API is designed for **vessel-centric queries** (track a specific vessel)
   - NOT designed for **geographic queries** (show all vessels in an area)

### Current Implementation

**File**: `/src/app/api/gfw/vessels/route.ts`

Attempted approaches:
1. ❌ Using `/v3/vessels/search` - no bbox support
2. ❌ Using `/v3/events` with geometry - requires vessel IDs

### Potential Solutions

#### Option 1: Two-Step Query (Very Inefficient)
```
1. GET /v3/vessels/search?query=fishing&limit=100
2. For each vessel:
   POST /v3/events with vessel ID + geometry filter
```
**Problems**:
- Would require 100+ API calls per map load
- Very slow (30+ seconds)
- Would hit rate limits quickly
- Inefficient for real-time display

#### Option 2: Different GFW API Tier
- Contact Global Fishing Watch to inquire about:
  - Enterprise API access
  - Different API endpoints for geographic queries
  - Beta/experimental endpoints

#### Option 3: Alternative Data Source
- AIS data providers (e.g., Marine Traffic, VesselFinder)
- NOAA vessel tracking
- Other commercial fishing databases

#### Option 4: Pre-computed Regional Data
- Store vessel data in Supabase, refreshed periodically
- Use GFW API on backend cron job
- Serve from our database to frontend

### Recommended Next Steps

1. **Immediate**: Document feature as "Coming Soon" in UI
2. **Short-term**: Contact GFW support about geographic query capabilities
3. **Medium-term**: Evaluate alternative AIS data sources
4. **Long-term**: Consider implementing backend caching solution

### Related Files
- `/src/app/api/gfw/vessels/route.ts` - API endpoint
- `/src/components/tracking/GFWVesselLayer.tsx` - Map layer component
- `/src/lib/services/gfw.ts` - GFW service utilities

---

## 🟡 WARNING: StormGlass API Authentication Failing

**Status**: DEGRADED - Fallback to Copernicus working, but missing wind/wave data

**Issue**: StormGlass API returning 403 Forbidden errors

### Error Details
```
Stormglass weather API error: 403
```

**Frequency**: Every request to `/api/stormio`

### Root Cause
- Invalid or expired API key: `STORMGLASS_API_KEY`
- OR account quota exceeded
- OR API access revoked

### Current Behavior
- Weather endpoint (`/api/weather`) falls back to:
  - ✅ Copernicus for SST (working)
  - ❌ Mock data for wind/waves (not real)

### Impact
- SST data: ✅ Working (Copernicus)
- Wind data: ⚠️ Using fallback mock data
- Wave/Swell data: ⚠️ Using fallback mock data

### Solution Required
1. Check StormGlass account status at https://stormglass.io
2. Verify API key in `.env.local`:
   ```
   STORMGLASS_API_KEY=your-key-here
   ```
3. Check quota limits on StormGlass dashboard
4. Consider alternative providers if StormGlass is discontinued

### Related Files
- `/src/app/api/stormio/route.ts` - StormGlass API proxy
- `/src/app/api/weather/route.ts` - Weather aggregation endpoint
- `.env.local` - API key configuration

---

## 🟡 WARNING: Supabase Anonymous Auth Not Enabled

**Status**: WORKAROUND - Using mock/stub mode for chat functionality

**Issue**: Anonymous sign-ins toggle is greyed out in Supabase Dashboard

### Error Details
```
No authenticated user (when attempting to send chat messages)
```

**Feature Affected**: Community Chat (Tracking page)

### Root Cause
- Anonymous authentication provider is disabled in Supabase project
- Dashboard toggle is greyed out (likely due to email confirmation being required)
- Cannot enable via SQL (auth.config table is internal)
- Cannot enable via CLI (requires Dashboard or Management API)

### Current Workaround
**Temporary solution**: Mock mode enabled
```bash
NEXT_PUBLIC_CHAT_MOCK=1
```

This allows chat to function using:
- In-memory message storage
- Cross-tab synchronization via browser storage
- No persistence after page refresh
- No real-time sync across different users/devices

### Permanent Solution Required

**Dashboard Steps**:
1. Go to Authentication → Providers → Email in Supabase Dashboard
2. **Disable** "Confirm email" requirement
3. Navigate to Authentication → Providers → Anonymous
4. **Enable** Anonymous Sign-ins toggle
5. **Optional but recommended**: Enable CAPTCHA protection to prevent abuse
   - Enable Cloudflare Turnstile or reCAPTCHA in Authentication settings

**Alternative via SQL Editor** (if toggle becomes available):
```sql
-- This would work if auth.config was accessible
-- Currently returns: ERROR: relation "auth.config" does not exist
INSERT INTO auth.config (parameter, value)
VALUES ('enable_anonymous_sign_ins', 'true')
ON CONFLICT (parameter)
DO UPDATE SET value = 'true';
```

### After Enabling Anonymous Auth

1. Update environment variable:
   ```bash
   NEXT_PUBLIC_CHAT_MOCK=0  # Switch back to real Supabase
   ```

2. Verify RLS policies allow anonymous users:
   ```sql
   -- Already configured in migration 20240323000001_chat_messages_table.sql
   CREATE POLICY "chat_messages_select" ON public.chat_messages
     FOR SELECT USING (true);

   CREATE POLICY "chat_messages_insert" ON public.chat_messages
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

3. Test anonymous sign-in:
   - Messages will be stored in Supabase
   - Real-time sync via Supabase Realtime
   - Anonymous users get JWT with `is_anonymous: true` claim
   - Users can later convert to permanent accounts

### Security Considerations

From Supabase docs (https://supabase.com/docs/guides/auth/auth-anonymous):
- ✅ Anonymous users get `authenticated` role (not `anon` key)
- ⚠️ **Strongly recommend** enabling CAPTCHA to prevent abuse
- ⚠️ Review RLS policies before enabling (already done)
- ⚠️ Consider rate limiting (30 requests/hour default)
- ⚠️ Plan for anonymous user cleanup (not auto-deleted)

### Impact

**Current (Mock Mode)**:
- ✅ Chat UI functional
- ✅ Messages appear in chat box
- ❌ No persistence across sessions
- ❌ No real-time sync across users
- ❌ Messages lost on page refresh

**After Enabling (Real Mode)**:
- ✅ Messages persist in database
- ✅ Real-time sync across all users
- ✅ Messages preserved across sessions
- ✅ Can later convert anonymous users to permanent accounts

### Related Files
- `/src/lib/services/chat.ts` - Chat service with anonymous auth logic
- `/src/hooks/useRealtimeChat.ts` - React hook for real-time chat
- `/src/components/chat/ChatDrawer.tsx` - Chat UI component
- `/supabase/migrations/20240323000001_chat_messages_table.sql` - Database schema
- `/supabase/migrations/20251117_chat_add_display_name.sql` - Display name support
- `/supabase/migrations/20251117_enable_anonymous_auth.sql` - SQL attempt (failed)

### Dashboard Links
- Supabase Project: https://supabase.com/dashboard/project/hobvjmmambhonsugehge
- Auth Providers: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/providers
- Anonymous Auth Docs: https://supabase.com/docs/guides/auth/auth-anonymous

---

## 🟢 ACTION REQUIRED: Deploy Python Ocean Features Backend

**Status**: READY TO DEPLOY - Backend code complete, needs production hosting

**Issue**: Python FastAPI backend running locally (localhost:8010) but needs cloud deployment for production

### What's Complete ✅

- ✅ FastAPI server with ocean feature detection (`/python/app/main.py`)
- ✅ Three detection algorithms:
  - Thermal fronts (SST Sobel edge detection)
  - Chlorophyll edges (Canny edge detection)
  - Mesoscale eddies (Okubo-Weiss parameter)
- ✅ Next.js frontend integration (`OceanFeaturesLayer.tsx`)
- ✅ UI controls in TrackingToolbar
- ✅ Railway deployment configuration (`railway.json`, `.railwayignore`)
- ✅ Comprehensive deployment guide (`/python/DEPLOYMENT.md`)
- ✅ CORS configured for Vercel domains

### Local Testing

Currently working at:
- Python backend: http://localhost:8010
- Test endpoints:
  ```bash
  curl http://localhost:8010/health
  curl "http://localhost:8010/ocean-features/fronts?bbox=35.5,-75.5,36.5,-74.5&date=2025-11-17"
  curl "http://localhost:8010/ocean-features/edges?bbox=35.5,-75.5,36.5,-74.5&date=2025-11-17"
  curl "http://localhost:8010/ocean-features/eddies?bbox=35.5,-75.5,36.5,-74.5&date=2025-11-17"
  ```

### Production Deployment Steps

**1. Deploy to Railway (Recommended - Free)**

Railway auto-detects the Python app using `railway.json`:

```bash
# Visit https://railway.app and sign up with GitHub
# Click "New Project" → "Deploy from GitHub repo"
# Select: always-bent repository
# Set root directory: python
# Railway will:
#   - Auto-detect Python app
#   - Install dependencies from requirements.txt
#   - Run: cd app && uvicorn main:app --host 0.0.0.0 --port $PORT
#   - Provide a URL like: https://always-bent-ocean.up.railway.app
```

**Why Railway?**
- Free tier: 500 hours/month
- Auto-deploys from GitHub (every push to main)
- Built-in environment variables
- HTTPS included
- Health check monitoring (`/health` endpoint)

**Alternative Options**: See `/python/DEPLOYMENT.md` for Render and Heroku instructions

**2. Update Vercel Environment Variables**

Once Railway provides your production URL:

```bash
# Remove old localhost values
vercel env rm NEXT_PUBLIC_POLYGONS_URL production
vercel env rm POLYGONS_BACKEND_URL production

# Add production URLs
vercel env add NEXT_PUBLIC_POLYGONS_URL production
# Enter: https://your-app-name.up.railway.app

vercel env add POLYGONS_BACKEND_URL production
# Enter: https://your-app-name.up.railway.app

# Also update for Preview environment
vercel env add NEXT_PUBLIC_POLYGONS_URL preview
vercel env add POLYGONS_BACKEND_URL preview
```

**3. Redeploy Vercel**

```bash
vercel --prod
```

**4. Test Production**

```bash
# Test Railway backend directly
curl https://your-app-name.up.railway.app/health

# Test through Vercel Next.js app
# Visit: https://alwaysbentfishingintelligence.com/legendary/tracking
# Toggle: "Ocean Features" → "Thermal Fronts"
```

### Cost Estimates

- **Railway**: FREE (500 hours/month, then $5/month)
- **Render**: FREE (spins down after inactivity, ~30s wake-up time)
- **Heroku**: $7/month (Eco dynos)

### Architecture

```
Browser → Next.js (Vercel) → /api/ocean-features/* → Python FastAPI (Railway) → GeoJSON
```

### Documentation

- Deployment guide: `/python/DEPLOYMENT.md`
- API server code: `/python/app/main.py` (423 lines)
- Detection algorithms: `/python/app/ocean_features.py` (363 lines)
- Frontend layer: `/src/components/tracking/OceanFeaturesLayer.tsx` (384 lines)

### Related Files

- `/python/app/main.py` - FastAPI server with 6 endpoints
- `/python/app/ocean_features.py` - Ocean feature detection algorithms
- `/python/railway.json` - Railway deployment config
- `/python/.railwayignore` - Files to exclude from deployment
- `/python/DEPLOYMENT.md` - Full deployment instructions
- `/src/components/tracking/OceanFeaturesLayer.tsx` - Map visualization
- `/src/app/legendary/tracking/TrackingContent.tsx` - Integration point
- `/src/components/tracking/TrackingToolbar.tsx` - UI controls

---

## API Status Summary

| API | Status | Data Available | Issue |
|-----|--------|----------------|-------|
| Copernicus SST | ✅ Working | Sea Surface Temp | None |
| Copernicus CHL | ✅ Working | Chlorophyll-a | None |
| Ocean Features (Python) | 🟢 Ready | Thermal fronts, Chl edges, Eddies | Needs Railway deployment |
| StormGlass | ❌ Failed | Wind, Waves | 403 Authentication |
| GFW Vessels | ❌ Blocked | Commercial Vessels | No geographic queries |
| Supabase DB | ✅ Working | User data, reports | None |
| Supabase Auth | ⚠️ Limited | Anonymous sign-in | Feature not enabled (using mock) |

---

## Environment Variables Required

```bash
# Working
COPERNICUS_USER=your-email@example.com
COPERNICUS_PASS=your-password
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Needs Update (Currently localhost)
NEXT_PUBLIC_POLYGONS_URL=http://localhost:8010  # 🟢 Change to Railway URL after deployment
POLYGONS_BACKEND_URL=http://localhost:8010      # 🟢 Change to Railway URL after deployment

# Not Working
STORMGLASS_API_KEY=your-key-here  # ❌ 403 errors
NEXT_PUBLIC_GFW_API_TOKEN=your-token  # ⚠️ Limited functionality
```

---

## Testing Checklist

**Ocean Data (Working)**
- [x] Copernicus SST data loading
- [x] Copernicus CHL data loading
- [x] Weather card displaying SST

**Ocean Features (Local Only - Needs Production Deploy)**
- [x] Thermal fronts detection working locally
- [x] Chlorophyll edges detection working locally
- [x] Eddy detection working locally
- [x] Ocean Features UI controls in TrackingToolbar
- [ ] Deploy Python backend to Railway
- [ ] Update Vercel environment variables
- [ ] Test ocean features in production

**Issues (Blocked)**
- [ ] Weather card displaying accurate wind data (StormGlass 403)
- [ ] Weather card displaying accurate wave data (StormGlass 403)
- [ ] Commercial vessels appearing on map (GFW API limitation)
- [ ] Commercial vessel tracks visible (GFW API limitation)

**Chat (Workaround Mode)**
- [x] Chat UI functional (mock mode)
- [ ] Chat messages persisting (requires anonymous auth)
- [ ] Real-time chat sync across users (requires anonymous auth)

---

## Contact Information

**Global Fishing Watch Support**
- Website: https://globalfishingwatch.org
- API Docs: https://globalfishingwatch.org/our-apis/
- Support: support@globalfishingwatch.org

**StormGlass Support**
- Website: https://stormglass.io
- Dashboard: https://dashboard.stormglass.io
- Support: support@stormglass.io

**Copernicus Marine Service**
- Website: https://marine.copernicus.eu
- Support: servicedesk.cmems@mercator-ocean.eu
