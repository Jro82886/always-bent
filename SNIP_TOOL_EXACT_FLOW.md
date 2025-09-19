# Snip Tool - Exact Technical Flow & Display

## Current Implementation Status

### 1. DRAW PHASE
**File**: `src/components/SnipTool.tsx`
- User clicks "Draw Analysis Area" button
- Map enters drawing mode (crosshair cursor)
- User draws rectangle on map
- Rectangle shows with dashed cyan border

### 2. ZOOM PHASE ⚠️ (Currently Breaking)
**File**: `src/components/SnipController.tsx` (handleAnalyze function)
- **Expected**: Map should animate zoom to drawn rectangle bounds
- **Code**: 
  ```typescript
  map.fitBounds(bounds, {
    padding: { top: 100, bottom: 100, left: 100, right: 100 },
    duration: 1500,
    essential: true,
    animate: true
  });
  ```
- **Timing**: 1.5 second zoom animation
- **Debug**: Console shows `[SNIP] Starting zoom to bounds:`

### 3. VISUALIZATION PHASE
**File**: `src/components/SnipController.tsx`
- **Starts**: 1700ms after zoom initiated (setTimeout)
- **Displays**:
  1. Vessel tracks as lines on map:
     - Blue lines = Commercial vessels (GFW)
     - Green lines = Recreational vessels
  2. Legend in top-right corner showing vessel types
  3. Hotspot marker (if detected) - pulsing red circle with confidence %
- **Duration**: Shows for 2.5 seconds before analysis

### 4. ANALYSIS PHASE
**File**: `src/components/SnipController.tsx`
- **Starts**: 4000ms after zoom initiated
- **Actions**:
  1. Sets `isAnalyzing = true`
  2. Creates global cleanup function `__cleanupSnipVisualization`
  3. Shows "Analysis Complete" tooltip on polygon
  4. Opens AnalysisModal with comprehensive report

### 5. CLEANUP PHASE
**File**: `src/components/AnalysisModal.tsx`
- **Triggers**: When modal closes or "Snip Another Area" clicked
- **Actions**:
  1. Calls `__cleanupSnipVisualization()` to remove:
     - All vessel track layers
     - Vessel legend
     - Hotspot markers
  2. Removes analysis tooltip
  3. If "Snip Another Area": Restarts drawing mode after 300ms

## Current Issues

1. **ZOOM NOT WORKING**: The `map.fitBounds()` call appears to be executing but the visual zoom animation is not happening
2. **Possible causes**:
   - Map state conflict
   - Animation being cancelled
   - Bounds calculation issue
   - Map not ready for animation

## Key Functions & Locations

1. **Drawing Logic**: `src/components/SnipTool.tsx` - `startDrawing()` function
2. **Analysis Trigger**: `src/components/SnipController.tsx` - `handleAnalyze()` function
3. **Vessel Data**: `src/lib/analysis/vessel-analysis.ts` - `getVesselTracksInArea()`
4. **Cleanup**: Global function `__cleanupSnipVisualization` stored on window
5. **Modal**: `src/components/AnalysisModal.tsx` - handles display and cleanup trigger

## Expected User Experience

1. Click "Draw Analysis Area"
2. Draw rectangle around area of interest
3. **SEE MAP ZOOM INTO RECTANGLE** (1.5s animation)
4. See vessel tracks appear with legend
5. View tracks for 2.5 seconds
6. Analysis modal opens with report
7. Can save, share, or "Snip Another Area"
8. All visualizations cleaned up on modal close

## Console Debug Messages

- `[SNIP] Starting zoom to bounds: [[lng,lat],[lng,lat]]`
- `Zoom animation completed`
- `Adding X vessel tracks to visualization`
- `[SNIP] Starting analysis phase`
