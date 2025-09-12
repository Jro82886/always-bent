# 🚨 CRITICAL GO-LIVE CHECKLIST - MUST COMPLETE BEFORE LAUNCH 🚨

## 🔴🔴🔴 STOP! READ THIS FIRST! 🔴🔴🔴

### IF THE HOTSPOT DETECTION ISN'T WORKING AT LAUNCH:
**IT'S NOT BROKEN - IT'S USING FAKE DATA!**

We built the entire analysis system but it's currently analyzing PRETEND temperature data, not the actual ocean. When you go live and nothing seems to detect hotspots correctly, **DON'T PANIC** - we just need to connect it to real data.

Think of it like: We built a beautiful car but forgot to put gas in it. The car works perfectly, it just needs fuel (real data).

## ⚠️ HOTSPOT DETECTION - CURRENTLY USING MOCK DATA ⚠️

### THE PROBLEM:
The SnipTool analysis is currently using **FAKE/MOCK temperature data** instead of reading actual SST/CHL values from the map tiles. This means:
- ❌ Hotspot detection is NOT working with real ocean data
- ❌ Temperature gradients are artificially generated
- ❌ Edge detection is based on fake patterns
- ❌ Analysis results are meaningless

### WHAT NEEDS TO BE DONE:

#### Option 1: Canvas Pixel Reading (Fastest MVP)
```javascript
// In src/lib/analysis/sst-analyzer.ts
async function extractRealSSTData(map: mapboxgl.Map, bounds: number[][]) {
  const canvas = map.getCanvas();
  const ctx = canvas.getContext('2d');
  
  // Convert lat/lng bounds to pixel coordinates
  const sw = map.project([bounds[0][0], bounds[0][1]]);
  const ne = map.project([bounds[1][0], bounds[1][1]]);
  
  // Read pixel data
  const imageData = ctx.getImageData(
    sw.x, ne.y, 
    ne.x - sw.x, sw.y - ne.y
  );
  
  // Convert RGB to temperature using color scale
  // Need to map the SST color palette to actual temperatures
  return convertPixelsToTemperature(imageData);
}
```

#### Option 2: Tile Data API (Most Accurate)
```javascript
// Create new endpoint: /api/tiles/sst/data
// Returns actual temperature values, not images
async function getRealSSTData(bounds: number[][]) {
  const response = await fetch('/api/tiles/sst/data', {
    method: 'POST',
    body: JSON.stringify({ bounds })
  });
  return response.json(); // Returns { points: [{ lat, lng, temp_f }] }
}
```

#### Option 3: WebGL Direct Reading (Most Complex)
```javascript
// Use map.painter.context to read WebGL buffer directly
// Requires deep Mapbox GL internals knowledge
```

### FILES THAT NEED UPDATING:

1. **src/lib/analysis/sst-analyzer.ts**
   - REMOVE: `generateMockSSTData()` function
   - REMOVE: `generateMockCHLData()` function
   - ADD: Real data extraction method
   - UPDATE: `analyzeSSTArea()` to use real data

2. **src/components/SnipTool.tsx**
   - UPDATE: Pass map instance to analysis
   - ADD: Loading state while extracting real data

3. **src/app/api/analyze/route.ts**
   - UPDATE: To handle real data extraction
   - ADD: Proper error handling for data extraction failures

### COLOR SCALE MAPPING NEEDED:
The SST tiles use a color gradient that needs to be mapped to actual temperatures:
- Deep Blue: ~68°F
- Light Blue: ~70°F
- Cyan: ~72°F
- Green: ~74°F
- Yellow: ~76°F
- Orange: ~78°F
- Red: ~80°F+

### TESTING CHECKLIST:
- [ ] Verify pixel reading works on all browsers
- [ ] Test with different zoom levels
- [ ] Confirm temperature values are realistic
- [ ] Validate hotspot detection with known edges
- [ ] Test performance with large selection areas
- [ ] Handle edge cases (no data, partial tiles, etc.)

### JEFF'S REQUIREMENTS:
- Conservative hotspot detection (no false positives)
- Minimum gradient of 0.5°F/km for edge detection
- Clear confidence scoring
- Realistic temperature ranges for the season

## 🔴 DO NOT GO LIVE WITHOUT FIXING THIS 🔴

### Quick Test to Verify It's Working:
1. Draw a rectangle over a known temperature break
2. Check console for extracted temperature values
3. Verify they match the visual color gradient
4. Confirm hotspot detection triggers appropriately

### Fallback Plan:
If real data extraction isn't ready by launch:
1. Add a clear "BETA" label to the analysis feature
2. Warn users that analysis is using simulated data
3. Disable hotspot confidence scoring
4. Focus on shape/area metrics only

---

**Last Updated:** December 2024
**Priority:** CRITICAL - BLOCKS LAUNCH
**Owner:** Development Team
**Deadline:** BEFORE GO-LIVE
