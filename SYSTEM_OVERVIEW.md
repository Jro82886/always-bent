# ABFI System Overview

## 1. Product Primer

Always Bent Fishing Intel (ABFI) is a Mapbox-based ocean intelligence application that combines real-time satellite data (SST/Chlorophyll), community reports, and environmental conditions to help anglers make data-driven fishing decisions. Core features: Analysis (draw polygons for ocean data), Community (real-time chat by inlet/offshore), Reports (saved analyses and bite logs), and Trends (tides, activity patterns).

## 2. User Flows

### Analysis Flow
1. User draws polygon on map → triggers `/api/analyze`
2. Backend samples WMTS tiles (Copernicus SST/CHL) using GetFeatureInfo
3. Extracts pixel values, calculates p10-p90 percentiles, mean, gradient
4. Returns temperature (°F) and chlorophyll data with narrative
5. User sees Extended Analysis UI with ranges, trends, tactical advice
6. Optional: Save as "Snip" to `/api/snips` for future reference

### Community Flow
1. Three fixed channels:
   - Inlet: `inlet:<slug>` (location-specific)
   - Tuna: `offshore:tuna` (offshore anglers)
   - Inshore: `inshore:general` (bay/flats fishing)
2. Real-time via Supabase or mock mode (`NEXT_PUBLIC_CHAT_MOCK=1`)
3. Sticky composer at bottom, Enter=send, Shift+Enter=newline
4. Presence count shows active users per channel

### Reports Flow
1. Saved snips list: User's extended analyses with ocean data
2. Bite reports: Species caught, location, method, timestamp
3. Filter by species chips or month selector
4. Data stored in Supabase `snips` and `bites` tables

### Trends Flow
1. Fetches from `/api/trends` with inlet coordinates
2. Combines Stormglass (tides/sun) + Supabase (community bites)
3. Displays 2×2 grid:
   - Tide Schedule (next 6 events)
   - Bite Prediction (best time windows)
   - Today's Activity (hourly distribution)
   - Species Activity (14-day percentages)

## 3. Architecture

- **Frontend**: Next.js 15.5 (App Router), TypeScript, Tailwind CSS, Mapbox GL JS
- **Backend**: Next.js API routes with Node.js runtime (forced via `export const runtime = 'nodejs'`)
- **Deployment**: Vercel with automatic deploys from `main` branch
- **Data Sources**:
  - **Copernicus WMTS**: SST/CHL layers via Basic Auth, TIME=YYYY-MM-DD format
  - **Stormglass**: Weather, tides, astronomy data (cached 5 min)
  - **Supabase**: PostgreSQL for user data (snips, bites, messages)
- **Feature Flags**: 
  - `NEXT_PUBLIC_CHAT_MOCK`: Enable mock chat data
  - `NEXT_PUBLIC_REPORTS_MOCK`: Enable mock reports highlights

## 4. Key Modules

### API Routes
- `/app/api/analyze/route.ts`
  - POST: `{ polygon, date, want: {sst, chl}, inletId }`
  - Returns: `{ sst: {meanF, p10F, p90F, gradF}, chl: {...}, narrative, weather, fleet, reports }`
  - Currently returns mock data to avoid timeouts

- `/app/api/rasters/sample/route.ts`
  - Samples Copernicus WMTS tiles within polygon
  - Decodes PNG pixels → temperature/chlorophyll values
  - Returns statistics or error codes (AUTH_ERROR, NO_OCEAN_PIXELS, etc.)

- `/app/api/snips/route.ts`
  - POST: Save extended analysis with ocean stats
  - Stores in `snips` table with user_id, inlet, date, species

- `/app/api/trends/route.ts`
  - GET: `?inlet=<slug>&lat=<num>&lng=<num>&rangeDays=14`
  - Returns tides, sun times, bite predictions, activity patterns

### Core Components
- `/src/components/SimpleSnipTool.tsx`: Clean polygon drawing with MapboxDraw
- `/src/components/trends/TrendsGrid.tsx`: 2×2 responsive grid layout
- `/src/components/chat/ChatWindowLive.tsx`: Real-time messaging UI
- `/src/hooks/useRealtimeChat.ts`: Supabase subscription management

### Utilities
- `/src/lib/wmts/layers.ts`: WMTS URL building and layer configs
- `/src/types/analyze.ts`: Type definitions and C→F conversion
- `/src/lib/store.ts`: Zustand store for global state

## 5. Data Models

```sql
-- Saved extended analyses
CREATE TABLE snips (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  inlet_slug TEXT NOT NULL,
  date DATE NOT NULL,
  area_nm2 NUMERIC,
  species TEXT[],
  sst_mean_f NUMERIC, sst_p10_f NUMERIC, sst_p90_f NUMERIC,
  chl_mean NUMERIC, chl_p10 NUMERIC, chl_p90 NUMERIC,
  narrative JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bite reports
CREATE TABLE bites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  inlet_slug TEXT NOT NULL,
  species TEXT[],
  count INT,
  method TEXT,
  lat NUMERIC, lng NUMERIC,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 6. Display Rules

- **Temperature Range**: Always show p10-p90 percentiles, never raw min/max
- **Gradient**: Display separately as °F/mile change rate
- **Narrative**: Deterministic templates based on data ranges (no AI currently)
- **Error States**: One-line messages per failure type:
  - AUTH_ERROR → "Ocean data unavailable (auth error)"
  - NO_OCEAN_PIXELS → "No ocean data in selected area"
  - DATA_NOT_PUBLISHED → "Ocean data not yet published for this date"
- **Empty States**: Friendly explanatory text for each card/section

## 7. Routing & State

- **Inlet Selection**: Stored in global Zustand store as `selectedInletId`
- **Layer Toggle**: `activeRaster` controls SST/CHL visibility
- **Date Selection**: `isoDate` for temporal queries
- **Chat State**: Tab selection maps to channel IDs
  - Cleanup: Unsubscribe Supabase channels on tab/inlet change
- **Analysis Flow**: `analysisVM` holds current analysis view model

## 8. Security & Runtime

- **Copernicus Auth**: Credentials only server-side via `Authorization: Basic` header
- **Node Runtime**: Required for Buffer/base64 operations in raster sampling
- **API Calls**: Avoid internal fetch() to own endpoints (use direct imports)
- **CORS**: Tile requests proxied through API routes to avoid browser restrictions
- **Environment**: All secrets in Vercel, never in code

## 9. Deploy & Flags

### Environment Variables
```bash
# Required for production
COPERNICUS_USER=xxx
COPERNICUS_PASS=xxx
STORMGLASS_API_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_MAPBOX_TOKEN=xxx

# Feature flags (set to 0 for production)
NEXT_PUBLIC_CHAT_MOCK=0
NEXT_PUBLIC_REPORTS_MOCK=0
```

### Deployment Steps
1. Push to `main` branch → auto-deploy to Vercel
2. Verify environment variables in Vercel dashboard
3. Test Copernicus auth: Check `/api/rasters/sample` returns real data
4. Smoke test sequence:
   - Draw 3 different polygons → verify unique SST/CHL values
   - Switch between chat tabs → verify channel changes
   - Save a snip → appears in Reports
   - Load Trends → see tide schedule

## 10. Known Limitations

- **Copernicus Errors**: When auth fails or data unavailable, UI shows inline error
- **Time Zones**: All times currently UTC (localization pending)
- **Analysis Timeout**: Currently returns mock data to avoid 504 errors
- **Offline Mode**: Bite reports queue in IndexedDB but sync not implemented
- **Fleet Data**: Currently mock data, real AIS integration pending

## 11. Future Hooks

### Trends Enhancements
- Sparkline charts for hourly activity patterns
- Species dots on map showing bite report locations
- Solunar calendar integration

### Reports Automation
- Fleet-wide highlight generation
- Pattern detection across community reports
- Export to fishing log formats

### Analysis AI
- LLM integration for narrative generation
- Pattern recognition in SST/CHL combinations
- Historical comparison with similar conditions
