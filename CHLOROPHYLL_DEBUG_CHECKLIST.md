# 🔍 Chlorophyll Layer Debug Checklist

## Quick Facts
- SST works perfectly with same pattern
- We have correct credentials
- We tested the endpoint and it returns valid PNG tiles

## Possible Issues to Check

### 1. **Environment Variable in Vercel**
```
CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D_202311/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}
```
- ❓ Is this EXACTLY copied to Vercel (no line breaks)?
- ❓ Did you redeploy after adding?

### 2. **Browser Console Errors**
Check for:
- 502/503 errors from `/api/tiles/chl/`
- "CHL layer added successfully" message
- Any CORS errors

### 3. **Layer Visibility Issues**
The layer might be loading but not visible because:
- **Opacity**: Currently 0.8 - might be too transparent
- **Layer ordering**: Might be under ocean layer
- **Zoom level**: maxzoom is 12 (SST doesn't have this limit)
- **Date**: Chlorophyll data might not exist for "today"

### 4. **Vercel Function Logs**
Check Vercel logs for:
- "CHL Route - Environment check"
- Any timeout errors (Copernicus can be slow)

## Let's Test Each Issue

### Test 1: Check if tiles are loading
In browser DevTools Network tab:
1. Filter by "chl"
2. Look for requests like `/api/tiles/chl/6/20/24`
3. Check response status (200 = good, 502 = bad)

### Test 2: Force visibility
In browser console:
```javascript
// Make CHL super visible
const map = window.map || document.querySelector('canvas')._map;
if (map && map.getLayer('chl-lyr')) {
  map.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  map.moveLayer('chl-lyr'); // Move to top
  console.log('CHL layer forced to top with 100% opacity');
}
```

### Test 3: Check layer exists
```javascript
const map = window.map || document.querySelector('canvas')._map;
console.log('CHL layer exists:', !!map.getLayer('chl-lyr'));
console.log('CHL source exists:', !!map.getSource('chl-src'));
```

## Most Likely Issues

Based on SST working but CHL not:
1. **Environment variable not set in Vercel** (most likely)
2. **maxzoom: 12 limiting visibility** at high zoom
3. **Date issue** - chlorophyll might need yesterday's date

## Quick Fix to Try

Remove maxzoom limit:
