# 🎯 SAFE TRACKING INTEGRATION PLAN
## How to Add Tracking WITHOUT Breaking Analysis

---

## THE GOLDEN RULE
**NEVER MODIFY ANALYSIS MODE DIRECTLY**
- Don't touch SnipTool.tsx
- Don't touch SST/CHL toggles  
- Don't change layer ordering
- Only ADD, never REMOVE

---

## STEP-BY-STEP SAFE INTEGRATION

### Step 1: Create Mode Manager
```typescript
// NEW FILE: /src/lib/modeManager.ts
export type AppMode = 'analysis' | 'tracking' | 'community';

class ModeManager {
  private currentMode: AppMode = 'analysis';
  private map: mapboxgl.Map | null = null;
  
  setMap(map: mapboxgl.Map) {
    this.map = map;
  }
  
  switchToTracking() {
    if (!this.map) return;
    
    // Save Analysis state
    this.saveAnalysisState();
    
    // Hide Analysis layers (don't remove!)
    this.hideAnalysisLayers();
    
    // Show Tracking UI
    this.currentMode = 'tracking';
  }
  
  switchToAnalysis() {
    if (!this.map) return;
    
    // Hide Tracking layers
    this.hideTrackingLayers();
    
    // Restore Analysis state
    this.restoreAnalysisState();
    
    this.currentMode = 'analysis';
  }
  
  private saveAnalysisState() {
    // Save current visibility of SST, CHL, etc
    const state = {
      sst: this.map.getLayoutProperty('sst-lyr', 'visibility'),
      chl: this.map.getLayoutProperty('chl-lyr', 'visibility'),
      // ... other layers
    };
    localStorage.setItem('analysis_state', JSON.stringify(state));
  }
  
  private restoreAnalysisState() {
    const state = JSON.parse(localStorage.getItem('analysis_state') || '{}');
    // Restore each layer's visibility
  }
}

export const modeManager = new ModeManager();
```

### Step 2: Update Tracking Page (MINIMAL CHANGE)
```typescript
// /app/tracking/page.tsx
import { TrackingUI } from '@/components/tracking/TrackingUI';
import { useMapbox } from '@/lib/MapCtx';
import { modeManager } from '@/lib/modeManager';
import { useEffect } from 'react';

export default function TrackingPage() {
  const map = useMapbox();
  
  useEffect(() => {
    if (map) {
      modeManager.setMap(map);
      modeManager.switchToTracking();
    }
    
    return () => {
      // When leaving tracking, restore analysis
      modeManager.switchToAnalysis();
    };
  }, [map]);
  
  if (!map) return <div>Loading map...</div>;
  
  return <TrackingUI map={map} showUser={true} />;
}
```

### Step 3: Protect Analysis Layers
```typescript
// Add to SnipTool.tsx (ONLY THIS SAFETY CHECK)
useEffect(() => {
  // Safety: Only run SnipTool if in Analysis mode
  const currentPath = window.location.pathname;
  if (currentPath.includes('tracking')) {
    return; // Don't initialize in tracking mode
  }
  // ... rest of initialization
}, []);
```

---

## WHAT TRACKING UI SHOULD DO

### On Mount:
```typescript
// TrackingUI.tsx
useEffect(() => {
  if (!map) return;
  
  // 1. Hide Analysis-specific layers
  const analysisLayers = ['sst-lyr', 'chl-lyr', 'snip-rectangle-fill', 
                          'snip-rectangle-outline', 'edge-lines'];
  analysisLayers.forEach(id => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', 'none');
    }
  });
  
  // 2. Show Tracking-specific layers
  // Add vessel markers, tracks, etc.
  
  // 3. Change basemap if needed
  // map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
  
}, [map]);
```

### On Unmount:
```typescript
// Clean up tracking-specific elements
return () => {
  // Remove tracking layers
  // Don't touch analysis layers - modeManager will restore them
};
```

---

## TESTING PROTOCOL

### Before Making Changes:
1. Open Analysis mode
2. Turn on SST layer
3. Draw a snip rectangle
4. Complete an analysis
5. Verify hotspot appears
6. **SCREENSHOT EVERYTHING**

### After Adding Tracking:
1. Navigate to Tracking
2. Verify tracking UI appears
3. Go BACK to Analysis
4. **EVERYTHING SHOULD BE EXACTLY AS BEFORE**
5. SST should still work
6. Snip should still work

### If Something Breaks:
```bash
# IMMEDIATE ROLLBACK
git reset --hard HEAD
git clean -fd

# Or use your saved commit
git reset --hard [your-saved-hash]
```

---

## COMMIT STRATEGY

### Make TINY commits:
```bash
# Commit 1: Add mode manager
git add src/lib/modeManager.ts
git commit -m "Add mode manager for safe mode switching"

# Commit 2: Update tracking page
git add src/app/tracking/page.tsx
git commit -m "Wire tracking page to use TrackingUI"

# Test here - if broken, easy rollback

# Commit 3: Add safety to SnipTool
git add src/components/SnipTool.tsx
git commit -m "Add tracking mode safety check to SnipTool"
```

---

## RED FLAGS - STOP IF YOU SEE:

1. ❌ SST layer not toggling
2. ❌ Snip rectangle not drawing
3. ❌ Analysis button not working
4. ❌ Layers rendering in wrong order
5. ❌ Map flickering when switching modes
6. ❌ Console errors about missing layers

---

## THE NUCLEAR OPTION

If everything goes wrong and you need me:

1. Share these files:
   - This document
   - ANALYSIS_MODE_BACKUP.md
   - Output of `git status`
   - Output of `git diff`
   - Screenshot of console errors

2. I can rebuild from this info!

---

**Remember**: We're ADDING tracking, not REPLACING analysis.
Think of it like putting a new app on your phone - the other apps still work!

BREATHE. We've got this! 🚀
