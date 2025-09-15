# 🧪 TRACKING INTEGRATION SAFETY TEST PLAN
## Complete Testing Protocol Before We Touch ANYTHING

---

## CURRENT STATE TEST (Do This First!)

### 1. Analysis Mode Test
Navigate to: http://localhost:3000/legendary

**CHECK THESE WORK:**
- [ ] SST toggle turns layer on/off
- [ ] CHL toggle turns layer on/off  
- [ ] Ocean Floor toggle works
- [ ] Polygons toggle works
- [ ] ABFI button shows and clicks
- [ ] Snip tool draws rectangle
- [ ] Analysis completes
- [ ] Hotspot shows purple dot
- [ ] Save analysis works

**TAKE SCREENSHOTS OF:**
- Analysis page with SST on
- Analysis page with snip rectangle
- Analysis modal open

### 2. Current Tracking Page Test
Navigate to: http://localhost:3000/tracking

**DOCUMENT:**
- What UI shows now? (Old tracking)
- Does it break Analysis when you go back?
- Screenshot the current state

---

## PROBLEMS WE NEED TO SOLVE

### Problem 1: Map Instance Confusion
**Issue**: `/legendary` creates its own map, not using MapShell
**Solution**: We need to ensure tracking uses the SAME map instance

### Problem 2: Layer State Not Preserved
**Issue**: No system saves which layers are on/off
**Solution**: Create state manager that remembers layer visibility

### Problem 3: UI Components Not Isolated
**Issue**: Components might interfere with each other
**Solution**: Ensure clean mounting/unmounting

---

## THE SAFE IMPLEMENTATION PLAN

### Step 1: Create State Preservation
```typescript
// NEW FILE: /src/lib/modeState.ts
class ModeStateManager {
  private analysisState = {
    sstVisible: false,
    chlVisible: false,
    polygonsVisible: false,
    oceanFloorVisible: false,
    snipActive: false
  };
  
  saveAnalysisState(map: mapboxgl.Map) {
    this.analysisState = {
      sstVisible: map.getLayoutProperty('sst-lyr', 'visibility') === 'visible',
      chlVisible: map.getLayoutProperty('chl-lyr', 'visibility') === 'visible',
      // ... etc
    };
  }
  
  restoreAnalysisState(map: mapboxgl.Map) {
    // Restore each layer's visibility
    if (this.analysisState.sstVisible) {
      map.setLayoutProperty('sst-lyr', 'visibility', 'visible');
    }
    // ... etc
  }
}
```

### Step 2: Test with tracking-new First
1. Navigate to `/tracking-new`
2. Verify modern UI loads
3. Go back to `/legendary`
4. **EVERYTHING MUST STILL WORK**

### Step 3: Add Safety Checks
```typescript
// In tracking page
useEffect(() => {
  // BEFORE hiding layers, save their state
  if (map) {
    modeState.saveAnalysisState(map);
  }
  
  return () => {
    // WHEN leaving, restore state
    if (map) {
      modeState.restoreAnalysisState(map);
    }
  };
}, [map]);
```

---

## VERIFICATION CHECKLIST

### Before Integration:
- [ ] Git commit current working state ✅
- [ ] Tag as `analysis-perfect-v1` ✅
- [ ] Document all working features ✅
- [ ] Test `/tracking-new` page

### During Integration:
- [ ] Layer states save when leaving Analysis
- [ ] Tracking hides Analysis layers
- [ ] Tracking shows vessel UI
- [ ] No console errors

### After Integration:
- [ ] Return to Analysis - SST still toggles
- [ ] Return to Analysis - Snip still works
- [ ] Return to Analysis - ABFI still works
- [ ] Can switch back and forth 5 times without breaking

---

## RED FLAGS - STOP IMMEDIATELY IF:

1. ❌ **SST layer disappears permanently**
   - FIX: Check if layer source was removed vs just hidden

2. ❌ **Snip tool stops drawing**
   - FIX: Check if mouse events were unbound

3. ❌ **Map goes blank**
   - FIX: Map instance was destroyed, not reused

4. ❌ **Console error: "Layer does not exist"**
   - FIX: Layer was removed instead of hidden

5. ❌ **ABFI button disappears**
   - FIX: Component unmounted incorrectly

---

## EMERGENCY RECOVERY

### Quick Fix:
```bash
# Just remove the new tracking page
rm src/app/tracking-new/page.tsx
```

### Full Recovery:
```bash
# Reset to tagged version
git reset --hard analysis-perfect-v1
```

### Nuclear Option:
```bash
# Reset to specific commit
git reset --hard 2cc92d24894da356cdf3aba04e42cb8dc788c635
```

---

## THE PROMISE

With this plan, switching between Analysis and Tracking will:
1. ✅ Keep the same map instance
2. ✅ Hide/show appropriate layers
3. ✅ Preserve all state
4. ✅ Not break ANY existing features

**But we MUST test each step!**
