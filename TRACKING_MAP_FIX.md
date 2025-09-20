# 🗺️ Tracking Page Map Fix Guide

## Current Status
The Tracking page map has been updated with proper East Coast bounds and error handling.

---

## ✅ Implemented Fixes

### 1. East Coast Bounding Box
```typescript
const EAST_COAST_BOUNDS = [
  [-82.0, 24.0], // SW corner (Florida Keys / Gulf side buffer)
  [-65.0, 45.0], // NE corner (Maine + offshore buffer)
];
```

### 2. Map Initialization
- **No inlet selected**: Map fits to East Coast bounds with padding
- **Inlet selected**: Map flies to inlet center with proper zoom
- **Console logging**: Added "Map Loaded - Tracking Mode" for debugging
- **Error handling**: Catches and logs map errors without breaking UI

### 3. Dynamic View Updates
- When inlet changes, map smoothly transitions
- Overview mode uses `fitBounds` for consistent framing
- Inlet mode uses `flyTo` for smooth animation

---

## 🔧 Debugging Checklist

### Check These First:
1. **Mapbox Token**
   ```javascript
   console.log('Mapbox Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
   ```
   - Should not be undefined
   - Should start with `pk.`
   - Check Vercel env vars if missing

2. **Console Errors**
   - Open DevTools → Console
   - Look for:
     - `401 Unauthorized` = bad token
     - `CORS` errors = proxy issues
     - `404` = wrong style URL

3. **Map Load Event**
   - Should see "Map Loaded - Tracking Mode" in console
   - If not, map container might be missing

4. **Network Tab**
   - Check for failed tile requests
   - SST/CHL tiles might 403 if proxy is down
   - Mapbox tiles should always load

---

## 🚨 Common Issues & Solutions

### Map Shows Blank/Black Screen
```javascript
// Add to map init for debugging:
map.current.on('styledata', () => {
  console.log('Style loaded');
});

map.current.on('sourcedata', (e) => {
  console.log('Source loaded:', e.sourceId);
});
```

### SST/CHL Layers Breaking Map
```javascript
// Temporarily disable in layer components:
if (false) { // Disable SST/CHL for now
  map.addSource('sst-source', {...});
}
```

### Inlet Bounds Missing
```javascript
// Fallback if inlet has no bounds:
const center = inlet?.lng && inlet?.lat 
  ? [inlet.lng, inlet.lat] 
  : [-73.5, 40.5]; // NY default
```

---

## 📍 Layer Order (When Adding Back)

1. **Basemap** (Mapbox Dark)
2. **SST/CHL Rasters** (if proxy working)
3. **Inlet Polygons** (boundaries)
4. **Vessel Clusters** (rec boats)
5. **Commercial Layer** (GFW)
6. **User Vessel** (always on top)

```javascript
// Example layer ordering:
map.addLayer({
  id: 'sst-layer',
  type: 'raster',
  source: 'sst-source',
  paint: { 'raster-opacity': 0.7 }
}, 'inlet-polygons'); // Add before this layer
```

---

## 🎯 Next Steps

1. **Verify Map Renders**
   - [ ] East Coast overview loads
   - [ ] Inlet selection zooms correctly
   - [ ] No console errors

2. **Hook Up Toggles**
   - [ ] My Vessel toggle shows user location
   - [ ] My Fleet shows nearby boats
   - [ ] Commercial shows GFW overlay

3. **Polish UI**
   - [ ] Left rail cards use glowy pills
   - [ ] Consistent with Community/Reports style
   - [ ] Legend shows active layers

---

## 🔐 Environment Variables Required

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1I...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Make sure these are set in:
- `.env.local` (development)
- Vercel Environment Variables (production)

---

## 🚀 Testing Commands

```bash
# Check if token is loaded
npm run dev
# Open browser console and check for "Map Loaded - Tracking Mode"

# Test inlet switching
# 1. Load page (should show East Coast)
# 2. Select inlet from dropdown
# 3. Map should fly to inlet
# 4. Select "East Coast Overview"
# 5. Map should return to full bounds
```
