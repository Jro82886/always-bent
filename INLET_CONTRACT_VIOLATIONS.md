# 🚨 Inlet Contract Violations Found

## 1. Camera Moves on Inlet Selection (MUST REMOVE)

### ❌ src/components/AnalyzeBar.tsx:163
```typescript
map.flyTo({ center: inlet.center, zoom: inlet.zoom, essential: true });
```
**Context**: In `reset()` function - needs investigation if user-initiated

### ❌ src/components/ModernControls.tsx:280
```typescript
flyToInlet60nm(map, inlet);
```
**Context**: Inside inlet selection handler - REMOVE

### ❌ src/components/tracking/UnifiedTrackingPanel.tsx:58
```typescript
flyToInlet60nm(map, selectedInlet);
```
**Context**: In `handleInletSelect` - REMOVE

### ❌ src/lib/MapRef.tsx:95
```typescript
flyToInlet60nm(map, inlet);
```
**Context**: In useEffect watching selectedInletId - REMOVE

### ❌ src/components/InletSelect.tsx:82
```typescript
flyToInlet60nm(map, inlet);
```
**Context**: In inlet selection onClick - REMOVE

## 2. Auto-Inlet Selection from GPS (MUST REMOVE/MAKE OPT-IN)

### ❌ src/app/legendary/tracking/page.tsx:55-67
```typescript
// Only auto-select inlet if user has explicitly shown their location
if (!hasAutoSelected && mapFullyReady && !selectedInletId && showYou) {
  const autoSelect = autoSelectInlet(
    { lat: position.lat, lng: position.lng },
    selectedInletId
  );
  
  if (autoSelect.shouldAutoSelect && autoSelect.inlet) {
    setSelectedInletId(autoSelect.inlet.id);
```
**Context**: Auto-selects inlet based on GPS position - REMOVE or make opt-in

## 3. Utility Functions That May Need Removal

### ⚠️ src/lib/inletBounds.ts:42
```typescript
export function flyToInlet60nm(map: mapboxgl.Map | null, inlet: Inlet)
```
**Context**: This function itself may need to be removed if no longer used

### ⚠️ src/lib/findClosestInlet.ts
```typescript
// Contains auto-select logic
```
**Context**: May need to be removed or modified to be opt-in only

## 4. Comments Referencing Old Behavior

### 📝 src/components/LayersRuntime.tsx:145
```typescript
// When the inlet changes: after flyTo completes, refresh active XYZ layer
```
**Context**: Comment references flyTo behavior that should no longer exist

## Action Items

1. **Remove all camera moves** from inlet selection handlers
2. **Remove GPS auto-selection** or make it strictly opt-in with user consent
3. **Delete unused utility functions** like `flyToInlet60nm` if no longer needed
4. **Update comments** to reflect new behavior
5. **Add the lint script** to package.json and CI/CD

## Verification

After fixes, run:
```bash
./scripts/lint-inlet.sh
```

Should output all ✅ checks.
