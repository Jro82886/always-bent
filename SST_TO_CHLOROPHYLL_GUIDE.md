# Complete SST Implementation Guide - For Replicating with Chlorophyll

## 🎯 OVERVIEW
We have a working SST (Sea Surface Temperature) implementation that needs to be replicated for Chlorophyll. This guide contains EVERYTHING needed to wire up Chlorophyll the exact same way.

## 📍 CURRENT SST ARCHITECTURE

### 1. Environment Variables (Currently Working for SST)
```bash
# SST Template - THIS IS THE KEY URL PATTERN
CMEMS_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m--DEPTH-0.49402499198913574m/{TIME}/{z}/{x}/{y}.png

# Chlorophyll Template - NEEDS TO BE WIRED THE SAME WAY
CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_BGC_001_028/cmems_mod_glo_bgc-bio_anfc_0.25deg_P1D-m--CHL-SURF/{TIME}/{z}/{x}/{y}.png

# Authentication (Same for both)
COPERNICUS_USER=jro82886
COPERNICUS_PASS=Jro!0788
```

### 2. API Route Structure
**Location:** `/src/app/api/tiles/sst/[z]/[x]/[y]/route.ts`

**Key Features:**
- Dynamic route parameters: `[z]/[x]/[y]`
- Handles both SST and CHL through the same route
- Smart date fallback (tries yesterday, then 2 days ago)
- Basic auth with Copernicus credentials
- Proper caching headers

### 3. Critical Implementation Details

#### Time Format Requirements
```javascript
// Copernicus expects: YYYY-MM-DDTHH:mm:ss.sssZ
// Example: 2025-09-17T00:00:00.000Z

// The route builds this format:
const buildDailyIso = (d: Date) => {
  const dd = new Date(d);
  dd.setUTCHours(0, 0, 0, 0);
  return dd.toISOString(); // Returns YYYY-MM-DDTHH:mm:ss.sssZ
};
```

#### Fallback Logic (CRITICAL!)
```javascript
// Copernicus data is usually 1-2 days behind
// So we try: yesterday first, then 2 days ago
const fallbackDates = [];
for (let daysAgo = 1; daysAgo <= 2; daysAgo++) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  fallbackDates.push(buildDailyIso(date));
}
```

#### Authentication
```javascript
const u = process.env.COPERNICUS_USER || '';
const p = process.env.COPERNICUS_PASS || '';
const auth = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
```

### 4. Frontend Layer Configuration
**Location:** `/src/lib/imagery/layers.ts`

```typescript
export const OCEAN_LAYERS = {
  SST: {
    srcId: 'sst-src',
    lyrId: 'sst-lyr',
    template: '/api/tiles/sst/{z}/{x}/{y}.png',
    tileSize: 512,
  },
  CHL: {
    srcId: 'chl-src', 
    lyrId: 'chl-lyr',
    template: '/api/tiles/chl/{z}/{x}/{y}.png', // NEEDS THIS ROUTE
    tileSize: 512,
  }
};
```

## 🔧 WHAT NEEDS TO BE DONE FOR CHLOROPHYLL

### 1. Create New API Route
**Path:** `/src/app/api/tiles/chl/[z]/[x]/[y]/route.ts`

This should be nearly IDENTICAL to the SST route, just change:
- The template variable to use `CMEMS_CHL_WMTS_TEMPLATE`
- Any SST-specific headers to say 'chl' instead

### 2. Key Differences Between SST and CHL

#### Dataset Names
- **SST:** `GLOBAL_ANALYSISFORECAST_PHY_001_024` (Physical model)
- **CHL:** `GLOBAL_ANALYSISFORECAST_BGC_001_028` (Biogeochemical model)

#### Layer Names
- **SST:** `cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m--DEPTH-0.49402499198913574m`
- **CHL:** `cmems_mod_glo_bgc-bio_anfc_0.25deg_P1D-m--CHL-SURF`

#### Resolution
- **SST:** 0.083 degree resolution
- **CHL:** 0.25 degree resolution (coarser)

## 📡 COPERNICUS WMTS DETAILS

### Base URL Structure
```
https://wmts.marine.copernicus.eu/teroWmts/{DATASET}/{LAYER}/{TIME}/{z}/{x}/{y}.png
```

### Authentication Required
- Method: Basic Auth
- Username: jro82886
- Password: Jro!0788

### Time Parameter Format
- Must be ISO 8601 with milliseconds
- Example: `2025-09-17T00:00:00.000Z`
- Daily products use midnight UTC

### Available Chlorophyll Layers (from Copernicus)
```
GLOBAL_ANALYSISFORECAST_BGC_001_028 offers:
- CHL-SURF: Surface chlorophyll concentration
- CHL-10m: Chlorophyll at 10m depth
- CHL-30m: Chlorophyll at 30m depth
```

## 🚨 CRITICAL GOTCHAS

1. **Date Lag**: Copernicus data is typically 1-2 days behind real-time
2. **Authentication**: Must use Basic Auth, not API keys
3. **Time Format**: Must include milliseconds (.000Z)
4. **Tile Size**: Use 512x512 for better performance
5. **Caching**: Set proper cache headers to avoid hitting Copernicus too often
6. **Error Handling**: Must handle 400 errors when date not available

## 📋 IMPLEMENTATION CHECKLIST

For Claude on your phone to implement Chlorophyll:

- [ ] Create `/src/app/api/tiles/chl/[z]/[x]/[y]/route.ts`
- [ ] Copy SST route logic exactly
- [ ] Change `CMEMS_SST_WMTS_TEMPLATE` to `CMEMS_CHL_WMTS_TEMPLATE`
- [ ] Update debug headers to say 'x-chl-date' instead of 'x-sst-date'
- [ ] Test with fallback dates (yesterday and 2 days ago)
- [ ] Verify authentication is working
- [ ] Check tile rendering in the map
- [ ] Add CHL toggle to UI (similar to SST toggle)

## 🔍 TESTING ENDPOINTS

### Test SST (Working Now)
```
/api/tiles/sst/5/9/11.png?time=latest
```

### Test CHL (After Implementation)
```
/api/tiles/chl/5/9/11.png?time=latest
```

## 💡 PRO TIPS

1. **Start with a copy**: Literally copy the SST route file and modify
2. **Keep the fallback logic**: It's essential for reliability
3. **Use the same auth**: Both use the same Copernicus credentials
4. **Test with curl first**: Before integrating with the map
5. **Check GetCapabilities**: To see available dates for each dataset

## 🎯 SUCCESS CRITERIA

When properly implemented, Chlorophyll should:
- Load tiles through `/api/tiles/chl/` proxy
- Authenticate with Copernicus
- Fall back to available dates automatically
- Cache responses appropriately
- Display on the map with proper opacity controls
- Toggle on/off independently from SST

---

**SHARE THIS WITH CLAUDE ON YOUR PHONE**
This guide contains everything needed to replicate our stable SST implementation for Chlorophyll. The key is to keep the exact same pattern - proxy route, authentication, fallback logic, and caching.
