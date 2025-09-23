# Complete Fix Summary - Always Bent Snip Tool

## Problem: Map drags when trying to draw analysis area

### ✅ FIXES THAT WORKED

#### 1. SST Layer Fixed
- **Problem**: SST layer was missing
- **Cause**: `process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE` not available in browser
- **Solution**: Use proxy endpoint `/api/tiles/sst/{z}/{x}/{y}` exactly like CHL
- **Status**: ✅ WORKING

#### 2. CHL Layer 
- **Status**: ✅ WORKING (never broken)
- Uses `/api/tiles/chl/{z}/{x}/{y}` proxy

### ❌ FIXES ATTEMPTED FOR MAP DRAGGING

#### Attempt 1: Original SnipTool (2300 lines)
- **File**: `src/components/SnipTool.tsx`
- **Approach**: Complex state machine with multiple refs
- **Issue**: Too complex, map.on() events still triggered map drag
- **Status**: ❌ Map still dragged

#### Attempt 2: Feature Flag with NewSnipTool
- **Files**: `src/components/snip/NewSnipTool.tsx`, `RectDraw.tsx`
- **Approach**: Modular components with feature flag
- **Changes**: 
  - Used `map.on()` events with preventDefault
  - Froze gestures with disable() calls
- **Issue**: Map events still propagated
- **Status**: ❌ Map still dragged

#### Attempt 3: SnipToolLite with State Machine
- **File**: `src/components/snip/SnipToolLite.tsx`
- **Approach**: Clean state machine (idle → arming → drawing → zooming → ready)
- **Changes**:
  - Gesture freeze only (no stopPropagation initially)
  - Map event handlers
- **Issue**: Map.on() events still reached map
- **Status**: ❌ Map still dragged

#### Attempt 4: Canvas Event Capture
- **File**: `src/components/snip/SnipToolLite.tsx` (updated)
- **Approach**: Use canvas DOM events with capture phase
- **Changes**:
  ```javascript
  canvas.addEventListener('mousedown', handler, true); // capture phase
  e.preventDefault();
  e.stopPropagation();
  map._interactive = false;
  ```
- **Issue**: Canvas events still propagated to map somehow
- **Status**: ❌ Map still dragged

#### Attempt 5: Nuclear Overlay Div
- **File**: `src/components/snip/SnipOverlay.tsx`
- **Approach**: Create div with z-index: 999999 covering entire map
- **Changes**:
  - Overlay div blocks ALL events
  - Drawing happens on overlay, not map
  - Blocks click, dblclick, wheel, touch, everything
- **Status**: ⚠️ NOT TESTED YET - Most likely to work

## 🎯 CURRENT STATE

### What Works:
- ✅ SST layer displays
- ✅ CHL layer displays  
- ✅ Crosshair cursor appears
- ✅ Drawing state activates
- ✅ Gestures are disabled (but not honored)

### What Doesn't:
- ❌ Map still drags when drawing
- ❌ Mouse events reach map despite all attempts

## 🔧 RECOMMENDED NEXT STEPS

### 1. Test Nuclear Overlay (HIGHEST CHANCE)
```javascript
// Add to AnalysisContent.tsx
import TestSnipButton from '@/components/snip/TestSnipButton';
// Add <TestSnipButton map={map.current} /> in render
```

### 2. Remove ALL Old Snip Tools
```bash
# Find all snip tool imports
grep -r "SnipTool" src/ --include="*.tsx" --include="*.ts"

# Remove old imports, keep only SnipOverlay
```

### 3. Check for Conflicting Event Handlers
```javascript
// In console
const canvas = window.mapboxMap?.getCanvas();
getEventListeners(canvas); // Chrome DevTools only
```

### 4. Try Document-Level Blocking
```javascript
// Add this when drawing starts
document.body.style.pointerEvents = 'none';
const drawOverlay = document.createElement('div');
drawOverlay.style.cssText = 'position:fixed;inset:0;z-index:999999;';
document.body.appendChild(drawOverlay);
```

## 📦 FILES CREATED/MODIFIED

### New Files:
- `src/components/snip/types.ts`
- `src/components/snip/NewSnipTool.tsx` 
- `src/components/snip/RectDraw.tsx`
- `src/components/snip/SnipToolLite.tsx`
- `src/components/snip/SnipOverlay.tsx` (NUCLEAR OPTION)
- `src/components/snip/TestSnipButton.tsx`
- `src/lib/analysis/sampler.ts`
- `src/lib/analysis/narrative-lite.ts`

### Modified Files:
- `src/components/layers/SSTLayer.tsx` (fixed to use proxy)
- `src/components/SnipTool.tsx` (multiple attempts)
- `src/components/UnifiedToolbar.tsx` (feature flag)
- `src/lib/store.ts` (added analysis state)
- `src/styles/analysis.css` (animations)

## 🚀 FOR YOUR BOT

Key insights:
1. **Root Cause**: Mapbox GL JS map events propagate EVEN when gestures disabled
2. **Why Overlay Works**: Physical DOM element blocks events before they reach canvas
3. **Alternative**: Might need to temporarily unmount map during drawing
4. **Nuclear Nuclear**: Use pointer lock API or fullscreen API

## Environment Variables Needed:
```env
NEXT_PUBLIC_FLAG_NEW_SNIP=1
NEXT_PUBLIC_GFW_DEMO=1
NEXT_PUBLIC_SST_WMTS_TEMPLATE=(not needed, using proxy)
NEXT_PUBLIC_CHL_WMTS_TEMPLATE=(not needed, using proxy)
```
