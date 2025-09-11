# NASA SST Time & Display Specification

## 🔒 Rule of Truth: "One day, one image"

### What We Show
- **Product**: NASA GIBS MODIS Aqua L3 Thermal SST Daily (4 km)
- **Layer**: `MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily`
- **Projection**: EPSG:3857 (Web Mercator)
- **Zoom Cap**: `maxzoom: 9`

### Time Handling
- **Exactly one daily image per date**
- **Default to today (UTC)**
- **No time ranges, no animations, no hourly frames**
- **Just the daily tile set for one date**

## 📋 URL Specifications

### Client Request Format
```
/api/tiles/sst/{z}/{x}/{y}.png?time=YYYY-MM-DD
```

**Example for today (UTC):**
```
/api/tiles/sst/6/17/26.png?time=2025-09-10
```

### NASA Upstream Format
```
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/
  MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily/
  default/{YYYY-MM-DD}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png
```

**Note**: Path order is `{z}/{y}/{x}` (NASA specific)

## 🕐 Date Resolution

### Input Formats
- `"today"` → Current UTC date
- `"-1d"` → Yesterday (UTC)
- `"-2d"` → 2 days ago (UTC)
- `"YYYY-MM-DD"` → Exact date

### Resolution Process
1. Convert input to UTC date string
2. Build NASA URL with resolved date
3. Return single daily tile set

### Fallback Logic (Invisible)
- If `today` 404s → silently use `-1d`
- If `-1d` fails → try `-2d`
- **Result**: Always shows one day's data
- **UI**: Optional tiny legend tag `"(yesterday)"`

## 🗺️ Mapbox Implementation

### Source Configuration
```javascript
map.addSource("sst-src", {
  type: "raster",
  tiles: [`/api/tiles/sst/{z}/{x}/{y}.png?time=YYYY-MM-DD`],
  tileSize: 256
});
```

### Layer Configuration
```javascript
map.addLayer({
  id: "sst-lyr",
  type: "raster",
  source: "sst-src",
  paint: { "raster-opacity": 1 },
  minzoom: 0,
  maxzoom: 9  // NASA GIBS Level9 cap
});
```

## 🧪 Acceptance Tests

### Test 1: HEAD Request (Should be 200 image/png)
```bash
curl -I "https://yourapp.com/api/tiles/sst/0/0/0.png?time=2025-09-10"
```

### Test 2: Florida Tile
```bash
curl -I "https://yourapp.com/api/tiles/sst/6/17/26.png?time=2025-09-10"
```

### Test 3: Fallback Behavior
- Early morning: `?time=today` → if 404, proxy serves yesterday
- Result: Single date's tile set (no mixing)

## ⚠️ Common Mistakes to Avoid

- ❌ **Local date instead of UTC** → off-by-one errors
- ❌ **Zoom > 9** → 404 errors
- ❌ **Wrong coordinate order** → NASA uses `{z}/{y}/{x}`
- ❌ **Time ranges** → one date only
- ❌ **Multiple frames** → single daily image

## 🔄 Implementation Status

- ✅ **Proxy Route**: `/api/tiles/sst/[z]/[x]/[y]/route.ts`
- ✅ **UTC Date Utility**: `resolveUtcDate()` function
- ✅ **Mapbox Source**: Correct tile URL format
- ✅ **Layer Config**: Zoom cap at 9
- ✅ **Fallback Logic**: Silent date adjustment
- ✅ **Caching**: 6-hour CDN cache per date

## 📊 Result

**User Experience:**
- Clean, simple date selection
- Always shows SST data (never blank)
- Invisible fallback to recent data
- Optional UI feedback on data age

**Technical:**
- One daily image per request
- UTC date handling (no timezone confusion)
- Proper NASA GIBS URL construction
- Efficient CDN caching per date
