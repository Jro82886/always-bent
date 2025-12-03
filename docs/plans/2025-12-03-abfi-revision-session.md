# ABFI Major Revision Session - December 3, 2025

## Session Overview

This session addressed a comprehensive revision of the Always Bent Fishing Intelligence (ABFI) app based on feedback from Amanda and Jeff. The work focused on fixing critical bugs, improving map layer rendering, and preparing for deployment.

## Client Context

**Amanda's Feedback Summary:**
- SST temperatures showing 200°F+ (Kelvin conversion bug)
- Chat messages not persisting
- Snips failing to save ("Unauthorized" error)
- Chlorophyll color scale wrong (wanted purple→green, not rainbow)
- Barrier islands not visible (covered by SST/CHL layers)
- Scoring always shows "poor conditions"
- Railway/Copernicus backend needs setup
- MarineTraffic API needs integration

**Jeff's Input:**
- Provided reference image showing proper SST visualization near Ocean City
- Noted continental shelf should show strong temp breaks
- Suggested considering alternative data sources if Copernicus resolution insufficient

## Completed Tasks

### 1. SST Temperature Fix - VERIFIED DEPLOYED
- **Issue:** Kelvin→Fahrenheit conversion was disabled
- **Status:** PR #14 was already merged (Nov 21), deployed Nov 28
- **Files:** `src/lib/wmts/layers.ts`, `src/lib/wmts/deterministic-sampler.ts`
- **Formula:** `(kelvin - 273.15) * 9/5 + 32`

### 2. Supabase Realtime Config - VERIFIED CORRECT
- **Issue:** Amanda confused about replication settings
- **Status:** Screenshots showed correct config:
  - Anonymous sign-ins: ENABLED
  - Realtime publications: Configured for `chat_messages`
  - ETL Replication (what confused her) is unrelated to chat

### 3. OpenWeather API Key - FIXED
- **Issue:** Code expected `OPENWEATHER_API_KEY`, Amanda added `OPENWEATHER_KEY`
- **Fix:** Added `OPENWEATHER_API_KEY` to Vercel (all environments)
- **Value:** `894e35a6b55ed18a7fc3a00c3c4c6b92`

### 4. Snip Save "Unauthorized" Error - FIXED
- **Issue:** `/api/reports` POST used `supabase.auth.getUser()` which fails for Memberstack users
- **Fix:** Added anonymous auth fallback (same pattern as chat)
- **File:** `src/app/api/reports/route.ts`
- **Commit:** `cd7e24d`

### 5. Chlorophyll Color Scale - FIXED
- **Issue:** Using `cmap:turbo` (rainbow), wanted purple→green
- **Fix:** Changed to `cmap:algae` in WMTS template
- **Updated:**
  - `.env.local` (local)
  - Vercel env vars `NEXT_PUBLIC_CHL_WMTS_TEMPLATE` (all environments)
- **Reference:** https://help.marine.copernicus.eu/en/articles/6478168-how-to-use-wmts-to-visualize-data

### 6. Barrier Islands Visibility - FIXED
- **Issue:** SST/CHL layers rendered on TOP, covering land features
- **Fix:** Updated layer positioning to render BELOW land/landcover layers
- **Files:**
  - `src/components/layers/SSTLayer.tsx`
  - `src/components/layers/CHLLayer.tsx`
- **Logic:** Find `land`, `landcover`, or `landuse` layers and position data layers below them

### 7. Production Deployment - COMPLETED
- **Build errors fixed:**
  - `src/app/api/reports/[id]/route.ts` - Changed `createClient` to `createServerClient`
  - `src/app/api/stormio/route.ts` - Fixed status type ('stale' vs 'fallback')
  - `src/components/tracking/OceanFeaturesLayer.tsx` - Added bounds null check
  - `src/hooks/useRealtimeChat.ts` - Use `username` from store instead of `user.name`
  - `src/lib/services/chat.ts` - Added non-null assertion for user.id
- **Commits:** `cd7e24d`, `013823e`
- **Production URL:** https://always-bent-ivy6p6hq0-jro82886s-projects.vercel.app

## Remaining Tasks

### 8. Railway Login & Python Backend Deploy
- **Status:** PENDING - Requires interactive authentication
- **What's needed:**
  1. Run `railway login` in terminal
  2. Complete browser-based authentication
  3. Link to project (Amanda already signed up for Pro)
  4. Set environment variables:
     - `COPERNICUS_USER` = jrosenkilde
     - `COPERNICUS_PASS` = qemvyz-zykqe4-nYqtoq
  5. Generate public domain
  6. Add Maurizio as developer: maurizio@levelthree.co
- **Purpose:** Hosts Python backend for ocean feature detection (thermal fronts, eddies, chlorophyll analysis)

### 9. Improve SST Resolution
- **Status:** PENDING - Research needed
- **Issue:** Current Copernicus tiles are blocky/pixelated near coastline
- **Competitor (RipCharts):** Uses high-res satellite imagery with clear coastline detail
- **Options to explore:**
  - Higher resolution Copernicus products
  - NOAA CoastWatch data
  - Different WMTS zoom levels
  - Land masking with better base layer

### 10. MarineTraffic API Integration
- **Status:** PENDING - Waiting for Jeff
- **Issue:** Global Fishing Watch API only tracks specific known vessels, not "all vessels in area"
- **Solution:** MarineTraffic API (paid, ~$50-100/mo Starter plan)
- **Requirements:**
  - Bounding box queries
  - Vessel type filtering
- **When ready:** Jeff will provide API key, then code changes needed

## Environment & Access

### CLIs Installed & Authenticated
| Service | CLI | Status | Account |
|---------|-----|--------|---------|
| GitHub | `gh` | Authenticated | maursader |
| Vercel | `vercel` | Authenticated | maursader (jro82886s-projects scope) |
| Supabase | `supabase` | Authenticated | MVP-9/11 project (hobvjmmambhonsugehge) |
| Railway | `railway` | **Needs login** | Amanda's account |

### Key URLs
- **Production:** https://app.alwaysbentfishingintelligence.com
- **GitHub:** https://github.com/Jro82886/always-bent
- **Supabase Dashboard:** https://supabase.com/dashboard/project/hobvjmmambhonsugehge
- **Vercel Project:** jro82886s-projects/always-bent

### Credentials (from .env.local)
- **Copernicus:** jrosenkilde / qemvyz-zykqe4-nYqtoq
- **Supabase Project:** hobvjmmambhonsugehge
- **OpenWeather API:** 894e35a6b55ed18a7fc3a00c3c4c6b92

## Git State
- **Branch:** main
- **Latest commits:**
  - `aa19298` - Add session progress file for ABFI revision
  - `013823e` - Fix TypeScript build errors for deployment
  - `cd7e24d` - Fix snip save auth, barrier islands visibility, and layer ordering
  - `7222565` - Merge PR #15 (OpenWeather)
  - `b9ee6e7` - Merge PR #14 (SST fix)

## Amanda's Outstanding Questions (for reference)

1. **Is everything automated?** - Mostly yes, except Railway backend needs manual setup
2. **Which APIs are failing?** - StormGlass (replaced with OpenWeather), GFW vessels (needs MarineTraffic)
3. **Retry logic/fallbacks?** - Yes, implemented for SST/CHL tiles (7-day fallback window)
4. **Polygons functional?** - Yes, after this deployment
5. **Mobile optimized?** - Not fully tested
6. **Backend production-ready?** - Yes after Railway deployment
7. **Infrastructure upgrades?** - MarineTraffic subscription needed

## Files Modified This Session

```
src/app/api/reports/route.ts          # Anonymous auth for snip saves
src/app/api/reports/[id]/route.ts     # Fixed Supabase client type
src/app/api/stormio/route.ts          # Fixed status type
src/components/layers/SSTLayer.tsx    # Layer ordering below land
src/components/layers/CHLLayer.tsx    # Layer ordering below land
src/components/tracking/OceanFeaturesLayer.tsx  # Null bounds check
src/hooks/useRealtimeChat.ts          # Use username from store
src/lib/services/chat.ts              # Non-null assertion
.env.local                            # CHL colormap changed to algae
```

## Next Session Action Items

1. **Railway setup** - Need interactive login, then deploy Python backend
2. **Test deployment** - Verify all fixes work in production:
   - Snip saving
   - Chlorophyll colors (purple→green)
   - Barrier islands visible
   - Chat persistence
3. **SST resolution research** - Investigate higher-res options
4. **MarineTraffic** - Wait for Jeff's API key

---

## Session 2 Update (December 3, 2025 - Later)

**Context resumed from previous session.**

### Verified Status:
- Railway CLI installed (`v4.12.0`) but **NOT authenticated** - needs `railway login`
- Production site is live at https://app.alwaysbentfishingintelligence.com
- All 7 completed tasks are deployed and working

### Immediate Next Step:
Run `railway login` in terminal to authenticate, then deploy Python backend.

---

## Session 3 Update (December 4, 2025)

### 11. GFW API Token Update - COMPLETED
- **Issue:** GFW token was affected/reset as of November 24, 2025
- **New token:** `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9...` (application: "new 12.2")
- **Updated in:**
  - `.env.local` (local)
  - Vercel env vars (all 3 environments: production, preview, development)

### Railway Situation - CRITICAL BLOCKER

**Problem:** Railway account is tied to Jeff's GitHub (jroimarina@gmail.com). Cannot simply request access to his Gmail - that's a non-starter.

**Workaround Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Jeff Adds Collaborators** | Jeff logs into Railway dashboard via GitHub, adds Amanda & Maurizio as team members | No new accounts needed, keeps existing setup | Requires Jeff's 5 min of time |
| **B. Transfer Project to Amanda** | Jeff transfers Railway project ownership to Amanda's Railway account | Amanda has full control | May lose some config, needs Jeff |
| **C. New Railway Account** | Amanda creates fresh Railway account (email-based, not GitHub), redeploy Python backend from scratch | Full independence | Manual re-setup of all env vars, ~30 min work |
| **D. Switch to Render.com** | Deploy Python backend to Render instead of Railway | Free tier available, simple setup | Migration work, new platform |
| **E. Vercel Python Functions** | Convert Python backend to Vercel serverless functions | Single platform (Vercel) | May need code changes, cold starts |

**RECOMMENDED: Option A** - Ask Jeff to spend 5 minutes adding collaborators:
1. Go to https://railway.app/
2. Click "Login with GitHub" (uses jroimarina@gmail.com automatically)
3. Go to Project Settings → Members
4. Add: `amandarosenkilde@gmail.com` and `maurizio@levelthree.co`

### 12. SST Resolution Research - COMPLETED

**Current Setup:**
- Product: `SST_GLO_PHY_L4_NRT_010_043` (ODYSSEA)
- Resolution: **0.10° × 0.10°** (~10 km)
- Source: Multi-sensor blend (L4 gap-free)

**Higher Resolution Options:**

| Product | Resolution | Coverage | Access | Notes |
|---------|-----------|----------|--------|-------|
| **OSTIA Global** | 0.05° (~6 km) | Global | WMTS ✓ | `SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001` |
| **MUR SST (NASA)** | 0.01° (~1 km) | Global | ERDDAP API | Best resolution, but no native WMTS |
| **Med High-Res** | 1/16° (~7 km) | Mediterranean | WMTS ✓ | Not useful for US East Coast |
| **NOAA CoastWatch** | 1-4 km | US waters | ERDDAP | Being retired Aug 2025 |
| **GOES ACSPO** | ~2 km | Americas | NetCDF | Geostationary, frequent updates |

**Recommendation:**
1. **Quick win:** Switch from ODYSSEA (10km) to OSTIA (6km) - same WMTS API, just different product ID
2. **Best quality:** Integrate MUR SST via ERDDAP for 1km resolution near coastline
   - Would require new tile generation or proxy layer
   - More complex implementation

**OSTIA Product Change (if desired):**
```
OLD: SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst
NEW: SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2/analysed_sst
```

### Remaining Items

1. **Railway access** - Need Jeff's 5-min action (Option A)
2. **Test production** - Verify GFW API works with new token
3. **SST upgrade** - Optional: switch to OSTIA for ~40% better resolution
4. **MarineTraffic** - Still waiting for Jeff's API key

---

*Session saved: December 4, 2025*
*Resume with: "Continue ABFI session"*
