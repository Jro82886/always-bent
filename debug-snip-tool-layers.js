#!/usr/bin/env node

console.log(`
=== SNIP TOOL LAYER DETECTION DEBUG ===

The problem: SST/CHL layers are VISIBLE on the map, but the analysis report says 
"Ocean data layers are not currently active. Enable layers to see live analysis."

ROOT CAUSE ANALYSIS:

1. The frontend is correctly detecting layers with resolveSSTLayer():
   - Checks for 'sst-lyr' (canonical)
   - Falls back to legacy IDs: 'sst-layer', 'raster-sst', 'sst-wmts'
   - Checks visibility !== 'none' AND opacity > 0.01

2. The detection seems to be working (based on console logs showing "[SST] Canon layer found")

3. The API is being called with the correct parameters:
   - timeISO: "2025-09-24T00:00:00Z" (midnight UTC for daily data)
   - layers: ["sst", "chl"] (when toggles are true)

4. The API response structure is correct:
   - Returns: { stats: { sst: {...}, chl: {...} } }
   - Frontend correctly reads from data.stats.sst and data.stats.chl

5. The narrative builder checks:
   - If !a.toggles.sst → returns "SST (off): information not available — toggle ON to include."
   - If !a.sst || a.sst.mean === null → returns "SST: no data returned for the selected time."

POSSIBLE ISSUES:

1. TIMING ISSUE: The layer detection might be happening BEFORE the layers are fully loaded
   - Solution: Add a delay or wait for map idle event

2. LAYER ID MISMATCH: The actual layer ID might be different in production
   - Check: What layers are actually on the map?
   - Run in console: Array.from(map.style._order).filter(id => id.includes('sst'))

3. VISIBILITY CHECK FAILING: The visibility property might be set differently
   - Check: map.getLayoutProperty('sst-lyr', 'visibility')
   - Check: map.getPaintProperty('sst-lyr', 'raster-opacity')

4. TOGGLE STATE NOT UPDATING: The toggles object might not be getting the correct state
   - Check the activeLayers object in SnipTool.tsx around line 1041

5. API NOT RETURNING DATA: The /api/rasters/sample might be returning null values
   - Check Network tab for actual response
   - Look for: { stats: { sst: null } } or { stats: { sst: { mean_f: null } } }

DEBUG STEPS:

1. In the browser console, when SST is visible:
   \`\`\`javascript
   // Check what SST layers exist
   Array.from(map.style._order).filter(id => id.includes('sst'))
   
   // Check visibility of canonical layer
   map.getLayoutProperty('sst-lyr', 'visibility')
   map.getPaintProperty('sst-lyr', 'raster-opacity')
   
   // Check if resolveSSTLayer works
   const sst = resolveSSTLayer(map);
   console.log('SST layer resolved:', sst);
   \`\`\`

2. Add more logging to SnipTool.tsx around line 1041:
   \`\`\`typescript
   const activeLayers = {
     sst: resolveSSTLayer(map) !== null,
     chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
     gfw: false // hidden for now
   };
   console.log('[SNIP] Active layers detected:', activeLayers);
   \`\`\`

3. Check the actual API request in Network tab:
   - Is it sending layers: ["sst", "chl"]?
   - What is the response?

4. Add logging to the narrative builder to see what it receives:
   \`\`\`typescript
   console.log('[NARRATIVE] Building with analysis:', a);
   console.log('[NARRATIVE] Toggles:', a.toggles);
   console.log('[NARRATIVE] SST data:', a.sst);
   \`\`\`

The issue is likely one of:
- Layer ID mismatch (production uses different IDs)
- Timing (checking before layers are ready)
- API returning null data
- Toggle state not being set correctly

Focus on #2 and #4 first - those are most likely.
`);

console.log(`
QUICK FIX TO TRY:

In SnipTool.tsx, around line 1147, add a small delay before checking layers:

\`\`\`typescript
// Wait a bit for layers to be ready
await new Promise(resolve => setTimeout(resolve, 100));

// Check active layers from map
const activeLayers = {
  sst: resolveSSTLayer(map) !== null,
  chl: map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
  gfw: false // hidden for now
};
console.log('[SNIP] Active layers after delay:', activeLayers);
\`\`\`
`);
