# 🛠️ Tracking Page Console Debug Guide

## Quick Debug Steps

1. **Open DevTools Console** (F12 or Right-click → Inspect → Console)

2. **Check for errors first:**
   - Look for red errors about Mapbox token
   - Look for CORS/network errors
   - Look for "Map init effect running" log

3. **Run these commands in console:**

```javascript
// Check if map is exposed
window.map

// If map exists, check its state
window.map.loaded()
window.map.getZoom()
window.map.getCenter()

// Check sources
Object.keys(window.map.getStyle().sources)

// Check layers
window.map.getStyle().layers.map(l => l.id)

// Check if inlet regions exist
window.map.getSource('inlet-regions')
window.map.getLayer('inlet-regions-fill')
```

## Expected Console Output

When page loads, you should see:
```
Map init effect running
- map.current exists: false
- mapContainer.current exists: true
Mapbox token: pk.eyJ1I...
Creating new map instance...
Map Loaded - Tracking Mode
Map exposed to window.map for debugging
Fitting to East Coast bounds  // or "Flying to inlet: [name]"
Map fully ready
```

## Common Issues

### No console logs at all
- Component might not be mounting
- Check if you're on `/legendary/tracking` URL
- Try hard refresh (Ctrl+Shift+R)

### "Mapbox token: MISSING"
- Check `.env.local` has `NEXT_PUBLIC_MAPBOX_TOKEN`
- Restart dev server after adding token
- Check Vercel env vars for production

### Map loads but no inlet regions
- Run: `window.map.getLayer('inlet-regions-fill')`
- Should return layer object, not undefined
- Check if InletRegions component is rendering

### Map is black/blank
- Check Network tab for failed tile requests
- Look for 401/403 errors
- Try: `window.map.setStyle('mapbox://styles/mapbox/streets-v12')`

## Debug Helper Loaded?

If you see this message in console:
```
🛠️ TRACKING DEBUG TOOLS LOADED
```

Then you can use:
- `debugTracking()` - Run all checks
- `debugMap()` - Find map instance
- `debugInlets(map)` - Check inlet regions

## Copy-Paste Debug

```javascript
// Quick check - paste this whole block
console.log('=== TRACKING DEBUG ===');
console.log('Map exists:', !!window.map);
if (window.map) {
  console.log('Map loaded:', window.map.loaded());
  console.log('Style:', window.map.getStyle().name);
  console.log('Sources:', Object.keys(window.map.getStyle().sources));
  console.log('Zoom:', window.map.getZoom());
  const inletLayer = window.map.getLayer('inlet-regions-fill');
  console.log('Inlet regions:', !!inletLayer);
  if (inletLayer) {
    console.log('Inlet opacity:', window.map.getPaintProperty('inlet-regions-fill', 'fill-opacity'));
  }
}
```
