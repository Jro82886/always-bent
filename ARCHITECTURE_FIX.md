# 🏗️ ARCHITECTURE FIX - Single Map, Proper State Management

## THE PROBLEMS (Confirmed)
1. ❌ `/legendary` creates its OWN map (doesn't use MapShell)
2. ❌ No state preservation when switching tabs
3. ❌ Components don't clean up properly

## THE SOLUTION

### Step 1: Fix Map Instance Problem
**Current Bad Setup:**
```
/legendary → Creates own map ❌
/tracking → Uses useMapbox() but gets null ❌
/imagery → Uses MapShell correctly ✅
```

**Fixed Architecture:**
```
App Layout
  └── MapShell (ONE map instance)
       ├── /legendary (uses context map)
       ├── /tracking (uses context map)
       └── /community (uses context map)
```

### Step 2: Implement State Management
**Using the ModeManager I just created:**

```typescript
// When entering Tracking:
useEffect(() => {
  modeManager.switchMode('tracking');
  return () => {
    // Automatically saves state when leaving
  };
}, []);
```

### Step 3: Component Lifecycle Management
**Proper cleanup pattern:**

```typescript
// In each mode component:
useEffect(() => {
  // Mount: Register event listeners
  const handleModeChange = (e) => {
    if (e.detail.to !== 'analysis') {
      // Clean up analysis-specific stuff
      cleanupSnipTool();
    }
  };
  
  window.addEventListener('modechange', handleModeChange);
  
  // Unmount: Clean up
  return () => {
    window.removeEventListener('modechange', handleModeChange);
    // Remove any mode-specific event listeners
  };
}, []);
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Unified Layout (SAFE)
Create NEW file that properly wraps everything:

```typescript
// src/app/legendary-v2/layout.tsx
export default function UnifiedLayout({ children }) {
  return (
    <MapShell>
      {children}
    </MapShell>
  );
}
```

### Phase 2: Update Legendary Page (CAREFUL)
Remove map creation, use context instead:

```typescript
// src/app/legendary-v2/page.tsx
export default function LegendaryV2() {
  const map = useMapbox(); // Gets from MapShell
  
  useEffect(() => {
    if (!map) return;
    modeManager.setMap(map);
    modeManager.switchMode('analysis');
  }, [map]);
  
  // Rest of your Analysis UI...
}
```

### Phase 3: Update Tracking Page (SAFE)
```typescript
// src/app/tracking-v2/page.tsx
export default function TrackingV2() {
  const map = useMapbox(); // Same map!
  
  useEffect(() => {
    if (!map) return;
    modeManager.switchMode('tracking');
  }, [map]);
  
  return <TrackingUI map={map} />;
}
```

---

## TESTING PROTOCOL

### Test 1: Map Sharing
1. Open `/legendary-v2`
2. Add a marker at specific location
3. Switch to `/tracking-v2`
4. **Marker should still be there** (same map!)

### Test 2: State Preservation
1. Turn on SST in Analysis
2. Switch to Tracking
3. Switch back to Analysis
4. **SST should still be on**

### Test 3: Clean Transitions
1. Start snipping in Analysis
2. Switch to Tracking mid-draw
3. **Should cleanly cancel snip**
4. Switch back
5. **Should be able to start new snip**

---

## ROLLBACK PLAN

If anything breaks:
```bash
# Just use the old pages
/legendary (still works)
/tracking (still works)

# Delete the v2 versions
rm -rf src/app/legendary-v2
rm -rf src/app/tracking-v2
```

---

## BEST PRACTICES WE'RE FOLLOWING

### 1. Single Source of Truth
- ONE map instance via MapShell
- ONE state manager (ModeManager)
- ONE place for layer definitions

### 2. Explicit State Management
- Save state before leaving mode
- Restore state when entering mode
- Clear documentation of what belongs where

### 3. Proper React Patterns
- useEffect cleanup functions
- Context for shared state
- Event emitters for cross-component communication

### 4. Defensive Programming
- Check if map exists before using
- Check if layers exist before modifying
- Graceful fallbacks

---

## WHY THIS WILL WORK

1. **Same pattern as `/imagery`** - which already works!
2. **ModeManager handles complexity** - components stay simple
3. **No breaking changes** - old pages still exist
4. **Incremental migration** - test each step

Want me to start implementing this properly?
