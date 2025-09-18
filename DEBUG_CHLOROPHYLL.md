# 🔍 Debug Chlorophyll Visibility

## Quick Console Commands to Run

Open your browser console on the app and run these:

```javascript
// 1. Check if CHL layer exists
const map = window.map || document.querySelector('canvas')._map;
console.log('CHL layer:', map.getLayer('chl-lyr'));
console.log('CHL source:', map.getSource('chl-src'));

// 2. Force CHL visible with green enhancement
if (map.getLayer('chl-lyr')) {
  map.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  map.setPaintProperty('chl-lyr', 'raster-saturation', 0.5);
  map.setPaintProperty('chl-lyr', 'raster-hue-rotate', 30);
  map.moveLayer('chl-lyr');
  console.log('✅ CHL forced visible with green tint');
} else {
  console.log('❌ CHL layer not found - toggle it on first');
}

// 3. Check network requests
console.log('Check Network tab for /api/tiles/chl/ requests');
console.log('Should see 200 status codes');
```

## If CHL still not visible:

1. **Check Vercel Environment:**
   - Go to Vercel Dashboard
   - Check if `CMEMS_CHL_WMTS_TEMPLATE` is set
   - Should be the long URL we provided

2. **Force Refresh:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (PC)
   - Clear cache if needed

3. **Check Toggle:**
   - Make sure Chlorophyll toggle is ON in left panel
   - Try toggling OFF then ON again
