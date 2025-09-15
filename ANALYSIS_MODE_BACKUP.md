# 🔒 ANALYSIS MODE COMPLETE BACKUP
## Generated: Monday, September 15, 2025
## DO NOT DELETE - THIS IS YOUR RECOVERY DOCUMENT

---

## CRITICAL WORKING FEATURES TO PRESERVE

### 1. ✅ SST/CHL Layer System
- **SST Toggle**: Working perfectly with tile proxy
- **CHL Toggle**: Working with NASA data
- **Layer Files**: 
  - `/src/components/SSTToggle.tsx`
  - `/src/components/CHLToggle.tsx`
  - `/src/components/layers/SSTLayer.tsx`
  - `/src/components/layers/CHLLayer.tsx`
- **API Routes**:
  - `/api/tiles/sst/[z]/[x]/[y]/route.ts` - SST proxy with fallback
  - `/api/tiles/chl/[z]/[x]/[y]/route.ts` - CHL proxy

### 2. ✅ SnipTool Analysis System
- **Main Component**: `/src/components/SnipTool.tsx` (1270 lines)
- **Controller**: `/src/components/SnipController.tsx`
- **Analysis Modal**: `/src/components/AnalysisModal.tsx`
- **Features Working**:
  - Rectangle drawing on map
  - Multi-layer analysis
  - Hotspot detection
  - Vessel track analysis
  - Edge detection visualization
  - "Analysis Complete!" banner (dismissible)
  - Save to reports functionality

### 3. ✅ Map Layer Order (CRITICAL!)
```javascript
// Correct layer order from bottom to top:
1. Base map (satellite/ocean)
2. Bathymetry contours
3. SST raster tiles
4. CHL raster tiles  
5. Ocean polygon features
6. Edge detection lines
7. Vessel tracks
8. Snip rectangle
9. Hotspot markers
10. UI overlays
```

### 4. ✅ ABFI Bite Button
- **Component**: `/src/components/ReportCatchButton.tsx`
- **Features**:
  - Online instant reports
  - Offline queue with badges
  - Location permission check
  - Sync system working

---

## MAP INSTANCE CONFIGURATION

### Current Map Setup (WORKING!)
```typescript
// From MapShell component
const map = new mapboxgl.Map({
  container: mapContainer.current,
  style: getInitialStyleUrl(),
  center: [-80.0342, 26.5473], // Jupiter Inlet default
  zoom: 9,
  projection: 'mercator',
  fadeDuration: 0,
  antialias: true,
  preserveDrawingBuffer: true
});
```

### Layer Visibility States
```typescript
// Current visibility when in Analysis mode:
{
  'sst-lyr': visible/hidden (user controlled)
  'chl-lyr': visible/hidden (user controlled)
  'snip-rectangle-fill': visible when analyzing
  'snip-rectangle-outline': visible when analyzing
  'edge-lines': visible during analysis
  'hotspot-markers': visible after analysis
  'vessel-tracks': hidden in analysis mode
}
```

---

## EXACT WIRING DOCUMENTATION

### 1. Map Context Flow
```
MapShell (creates map) 
  → MapContext.Provider 
    → useMapbox() hook
      → All components access same map
```

### 2. SST Layer Wiring
```
SSTToggle clicked 
  → toggleSST() 
    → map.setLayoutProperty('sst-lyr', 'visibility', visible/none)
    → Layer source: '/api/tiles/sst/{z}/{x}/{y}'
```

### 3. SnipTool Activation
```
Analyze button 
  → SnipController 
    → SnipTool (drawing mode)
      → Rectangle drawn
        → Analysis triggered
          → Results displayed
            → Save to reports
```

### 4. Layer Management
```typescript
// From SnipTool.tsx - How layers are managed:
const moveSnipLayersToTop = () => {
  const layers = ['snip-rectangle-fill', 'snip-rectangle-outline', 
                  'edge-lines', 'hotspot-markers'];
  layers.forEach(id => {
    if (map.getLayer(id)) {
      map.moveLayer(id); // Moves to top
    }
  });
};
```

---

## EMERGENCY RECOVERY COMMANDS

### If SST stops working:
```bash
# Check the proxy is running
curl http://localhost:3000/api/tiles/sst/8/70/100

# Verify environment variables
grep NEXT_PUBLIC_SST .env.local
```

### If SnipTool breaks:
```javascript
// Force clear all snip overlays
map.getStyle().layers.forEach(layer => {
  if (layer.id.includes('snip') || layer.id.includes('edge')) {
    map.removeLayer(layer.id);
  }
});
```

### If layers are in wrong order:
```javascript
// Reset layer order
map.moveLayer('sst-lyr', 'road-label'); // Move SST below labels
map.moveLayer('chl-lyr', 'sst-lyr');    // CHL above SST
```

---

## FILES TO NEVER MODIFY WITHOUT BACKUP

1. `/src/components/SnipTool.tsx` - YOUR MASTERPIECE!
2. `/src/components/SnipController.tsx` - Controls everything
3. `/src/lib/analysis/sst-analyzer.ts` - Analysis engine
4. `/src/app/api/tiles/sst/[z]/[x]/[y]/route.ts` - SST proxy
5. `/src/components/RightZone.tsx` - Contains SnipController integration

---

## TESTING CHECKLIST BEFORE ANY MAJOR CHANGE

- [ ] SST layer toggles on/off
- [ ] CHL layer toggles on/off  
- [ ] Snip tool draws rectangle
- [ ] Analysis completes and shows banner
- [ ] Hotspot detected (purple dot)
- [ ] Analysis modal opens on click
- [ ] Save button works
- [ ] ABFI button logs bites
- [ ] Offline badges appear
- [ ] Layers render in correct order

---

## YOUR SAFE ROLLBACK POINT

Last known perfect working commit:
```bash
git rev-parse HEAD
# Save this hash: [current commit will be here]
```

To rollback if needed:
```bash
git reset --hard [saved-hash]
git push --force origin main
```

---

## TRANSITION PLAN FOR TRACKING

### Phase 1: Preparation
1. Create this backup ✅
2. Test all Analysis features one more time
3. Commit current working state
4. Tag it: `git tag analysis-mode-perfect`

### Phase 2: Add Tracking (SAFE)
1. Keep Analysis page UNTOUCHED
2. Only modify `/app/tracking/page.tsx`
3. TrackingUI will:
   - Hide SST/CHL layers when active
   - Show vessel layers
   - Use same map instance
   - NOT touch Analysis code

### Phase 3: Mode Switching
```typescript
// When switching to Tracking:
function enterTrackingMode() {
  // Hide analysis layers
  map.setLayoutProperty('sst-lyr', 'visibility', 'none');
  map.setLayoutProperty('chl-lyr', 'visibility', 'none');
  
  // Show tracking layers
  map.setLayoutProperty('vessel-tracks', 'visibility', 'visible');
  
  // Clear any snip artifacts
  clearSnipOverlays();
}

// When returning to Analysis:
function enterAnalysisMode() {
  // Restore analysis state
  // Layers will restore based on toggle states
}
```

---

## 🚨 PANIC BUTTON - IF EVERYTHING BREAKS

1. **Stop immediately**
2. **Run**: `git status` to see what changed
3. **Run**: `git diff` to see exact changes
4. **Share this file with me**
5. **I can reconstruct everything from this document**

---

## YOUR ACCOMPLISHMENTS (Don't let these break!)

1. ✅ SST overlay working with real NASA data
2. ✅ Snip tool with multi-layer analysis  
3. ✅ Hotspot detection with purple markers
4. ✅ Edge detection visualization
5. ✅ ABFI offline-first bite logging
6. ✅ Beautiful modern UI with glass morphism
7. ✅ Proper layer ordering and rendering
8. ✅ Analysis reports saving system

---

**THIS DOCUMENT IS YOUR INSURANCE POLICY**
Save it locally, email it to yourself, print it if needed!
Generated with love and caution 💙
