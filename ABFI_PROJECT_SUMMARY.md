# 🎣 Always Bent Fishing Intelligence (ABFI) - Project Summary

## Overview
ABFI is a cutting-edge fishing intelligence platform that analyzes ocean conditions to identify optimal fishing spots. Built with Next.js, Mapbox GL, and Supabase, it provides real-time SST (Sea Surface Temperature) analysis with ML-ready infrastructure.

## Current System Architecture

### 1. **Frontend Stack**
- **Framework**: Next.js 14 (App Router)
- **Map**: Mapbox GL JS
- **Styling**: Tailwind CSS
- **State**: React hooks
- **Location**: `/src/app/legendary/page.tsx` (main map interface)

### 2. **Data Layers**
- **SST (Sea Surface Temperature)**: 
  - Source: Copernicus Marine Service (ODYSSEA L4 NRT daily product)
  - Proxy: `/api/tiles/sst/{z}/{x}/{y}.png`
  - Smart fallback: Yesterday → 2 days ago
  - High-res: 512px tiles
  - Visual: Thermal colormap with adjustable opacity

- **Bathymetry**: 
  - Source: ESRI Ocean Basemap
  - Shows ocean depth/underwater terrain
  - 60% opacity overlay

- **Chlorophyll** (ready but not active):
  - Source: Copernicus
  - Proxy: `/api/tiles/chl/{z}/{x}/{y}.png`

### 3. **Core Features**

#### ✅ **Working Features**
1. **SST Display**
   - Toggle on/off with button
   - Opacity control slider
   - Color legend (0°C to 30°C)
   - Smooth coastline rendering

2. **Analyze Area Tool**
   - Click button to activate
   - Click two corners to draw rectangle
   - Shows area in km² and mi²
   - Green rectangle with 0.3 opacity
   - Triggers analysis (currently mock data)

3. **Map Controls**
   - Constrained to US East Coast (150nm strip)
   - Zoom/pan controls
   - Cooperative gestures (Ctrl+scroll to zoom)

#### 🚧 **In Development**
1. **SST Analysis Engine**
   - Edge detection (≥0.5°F/mile)
   - Hard breaks (≥2°F/mile)
   - Eddy detection (circular features)
   - Filament detection (elongated edges)
   - Hotspot scoring algorithm

2. **ML Infrastructure**
   - Supabase tables ready:
     - `snip_analyses` - Store analysis results
     - `catch_reports` - User fishing reports
     - `vessel_tracks` - GPS tracking
     - `ml_patterns` - Learned patterns
     - `hotspot_intelligence` - Predicted hotspots

### 4. **API Architecture**

#### Proxy Endpoints
```
/api/tiles/sst/{z}/{x}/{y}.png
  - Authenticates with Copernicus
  - Handles date fallback (yesterday → 2 days ago)
  - Returns PNG tiles with caching
  - Headers: x-sst-date shows which date loaded

/api/tiles/chl/{z}/{x}/{y}.png
  - Similar structure for chlorophyll
```

#### Environment Variables
```bash
# Copernicus Credentials
COPERNICUS_USER=your_username
COPERNICUS_PASS=your_password

# WMTS Templates
CMEMS_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?...
NEXT_PUBLIC_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?...
NEXT_PUBLIC_SST_TILESIZE=512

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hobvjmmambhonsugehge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 5. **Key Components**

#### Map Components
- `SSTLayer.tsx` - Manages SST tile layer
- `SSTLegend.tsx` - Temperature color scale
- `SnipTool.tsx` - Rectangle drawing for analysis
- `SnipController.tsx` - Orchestrates analysis workflow
- `SnipAnalysisReport.tsx` - Shows analysis results

#### Analysis System
- `sst-analyzer.ts` - Jeff's algorithm (client-side for MVP)
- Mock data generator for testing
- Will migrate to Python server-side later

### 6. **Database Schema (Supabase)**
```sql
-- Core tables
profiles           -- User profiles
snip_analyses      -- Analysis results with GeoJSON
catch_reports      -- User fishing reports
vessel_tracks      -- GPS tracking data
ml_patterns        -- Learned patterns
hotspot_intelligence -- AI predictions

-- All tables have:
- PostGIS geometry support
- RLS (Row Level Security)
- Proper indexes for performance
- ML-ready structure
```

### 7. **Known Issues & Solutions**

#### Fixed Issues ✅
1. **SST 400/403 errors** → Added proxy with auth
2. **Date availability** → Smart fallback system
3. **Rectangle not visible** → Direct map layers instead of MapboxDraw
4. **Map grabbing during draw** → Disabled dragPan when drawing
5. **Vercel env vars** → Force redeploy after adding

#### Current Challenges
1. **Rectangle visibility** - Added logging to debug
2. **Analysis fails** - Using mock data until real SST extraction
3. **Performance** - Will optimize with CDN caching

### 8. **Development Workflow**

#### Git Strategy
- **Branch**: Always push to `main` (production)
- **No staging** - Direct to production per user preference
- **Commits**: Descriptive messages with emojis

#### Testing
- Browser console for debugging (F12)
- Check network tab for tile loading
- Verify in production after deploy

### 9. **Next Steps (Priority Order)**

1. **Fix Rectangle Drawing**
   - Debug why rectangle isn't showing
   - Check console logs for errors

2. **Connect Real SST Data**
   - Extract pixel values from tiles
   - Feed to analysis algorithm

3. **Implement Catch Reports**
   - UI for submitting catches
   - Link to analysis areas

4. **Add Vessel Tracking**
   - Record fishing paths
   - Privacy controls

5. **ML Training**
   - Correlate catches with conditions
   - Generate predictions

### 10. **Jeff's Vision**
- **Snip any area** → Get instant analysis
- **See edges/eddies** → Overlaid on map
- **Track catches** → Build intelligence
- **ML predictions** → Find tomorrow's hotspots
- **Community data** → Anonymized insights

### 11. **Technical Decisions Made**

1. **Client-side analysis for MVP** - Faster to implement
2. **Copernicus over NOAA** - Better resolution, daily updates
3. **Supabase over custom backend** - Faster development
4. **Direct map clicks over MapboxDraw** - More reliable
5. **2-day data lag** - Most reliable for NRT products

### 12. **User Preferences Noted**
- Simple, clear naming (e.g., "Analyze Area")
- Direct to production deployment
- High image quality over cost savings
- Step-by-step implementation when complex
- Proactive problem identification

## Quick Start for New Developer

1. **Clone & Install**
```bash
git clone https://github.com/Jro82886/always-bent.git
cd always-bent
npm install
```

2. **Setup Environment**
```bash
cp env.example .env.local
# Add credentials from Vercel dashboard
```

3. **Run Development**
```bash
npm run dev
# Open http://localhost:3000/legendary
```

4. **Key Files to Know**
- `src/app/legendary/page.tsx` - Main map
- `src/components/SnipTool.tsx` - Drawing tool
- `src/app/api/tiles/sst/` - SST proxy
- `src/lib/analysis/sst-analyzer.ts` - Analysis logic

5. **Debugging Tips**
- Check browser console for logs
- Network tab shows tile loading
- Look for 🚨 SST DEBUG messages
- Rectangle drawing logs with 📍 🖱️ ✅

## Contact & Resources
- **GitHub**: https://github.com/Jro82886/always-bent
- **Production**: https://always-bent.vercel.app/legendary
- **Copernicus**: https://marine.copernicus.eu
- **Vision**: Jeff knows exactly what he wants - ask him!

---

*"This will change the fishing industry" - Amanda & Jeff*

*Built with ❤️ and 🎣 by the ABFI team*
