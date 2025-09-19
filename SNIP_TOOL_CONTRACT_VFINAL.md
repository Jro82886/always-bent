# ✂️ Snip Tool — Contract vFinal (Source of Truth)

**Purpose**: User draws a box → we analyze real SST/CHL pixels + ocean-feature polygons in that box → show crisp, structured intel.

**Camera rule**: Snip may fit to the snip bounds once (on mouse-up) with padding and a Return to Overview button. No other implicit camera moves.

## Flow (must match exactly)

### 1. Draw
- Activate from UnifiedCommandCenter
- Cursor = crosshair; panel shows "Click and drag to analyze ocean area"
- Rectangle style: slate fill #0f172a @ 45% opacity; outline #334155
- Live area readout; min area = 10 km²

### 2. Analyze (on mouse-up)
- Save current camera (for Return)
- Fit to snip bounds with padding (L350/R400/T48/B48), 1.5s ease
- Keep rectangle visible; subtle pulse while analyzing
- Call real extractors:
  - `extractTileDataFromCanvas` (primary) → stats (min/max/mean/p50/p90/n, coverage%)
  - Fallback WebGL pixel sampler only if primary fails

### 3. Multi-Layer Analysis (compute + fetch)
- **SST**: gradients, fronts (>0.5 °F/mile = high)
- **CHL**: green/blue edges, concentration shifts
- **POLYGONS** (Ocean Features) via `/api/ocean-features/live`:
  - Detect edges/gradients server-side → GeoJSON Polygons
  - Filter by snip bbox; score 0–1; return features tagged: `thermal_front`, `eddy`, `convergence`, `chl_edge`
- **Vessels**: 4-day rec history + GFW commercial overlay (read-only)
- **Weather** (inlet-scoped) and Moon
- **Hotspot scoring** (Jeff's logic): High/Moderate bands

### 4. Map Visuals
- **Hotspots**: glowing dots (no squiggles), size/opacity by confidence
- **Polygons**: thin glowing outlines with subtle fill; click → details
- **Return to Overview** button restores saved camera (ESC also works)

### 5. Analysis Modal (auto-open)
- Two-column layout, top "Comprehensive Analysis" summary
- Sections (concise bullets, on-brand glyphs ◆ ⬢ ▲):
  - Ocean Intel (SST/CHL, fronts/edges, polygons found)
  - Vessel Intel
  - Environmental (weather/moon)
  - Local Knowledge (canyons)
  - Fishing Intel (species by temp bands)
- Low coverage banner if coverage% < 20% for any layer

### 6. Persistence & Clear
- Rectangle stays until Clear Snip
- Clear removes rect, hotspots, polygon overlays, and closes modal
- Clear does NOT touch camera or layer toggles

## 🛠️ Surgical Implementation Plan

### A) State & Events
Add snipStore (Zustand/Context):
```typescript
type SnipState = {
  rectBbox: [[number,number],[number,number]] | null;
  cameraBefore: {center:[number,number], zoom:number, bearing:number, pitch:number} | null;
  analyzing: boolean;
  results: SnipResults | null; // per-layer stats + polygons + hotspots
  start(): void; 
  finish(res: SnipResults): void; 
  clear(): void;
};
```

Events: `snip:start(rect)`, `snip:finish(results)`, `snip:clear()`

### B) Draw & Zoom (one place)
Component: `SnipTool.tsx`
On mouse-up:
```typescript
store.setState({ cameraBefore: getCamera(map) });
map.fitBounds(rectBbox, { 
  padding: {left:350, right:400, top:48, bottom:48}, 
  duration: 1500, 
  essential: true 
});
```

### C) Real Data Extraction (no mocks)
```typescript
type LayerStats = { 
  min: number; 
  max: number; 
  mean: number; 
  p50: number; 
  p90: number; 
  n: number; 
  coveragePct: number; 
};

type SnipResults = { 
  sst?: LayerStats; 
  chl?: LayerStats; 
  polygons: Feature[]; 
  hotspots: Hotspot[]; 
};
```

### D) Ocean Features (POLYGONS)
- Endpoint: `/api/ocean-features/live?bbox=…&date=…`
- Server: run gradient/edge detection → GeoJSON
- Client: dedicated polygons layer with thin outline + subtle fill

### E) Hotspots
- Compute from SST gradients + CHL edges + vessel activity
- Render as glowing dots (not lines)
- Layer group: `snip-hotspots`

### F) Modal
- Component: `SnipAnalysisModal.tsx`
- Auto-open after results
- Z-index above side panels
- Concise sections with glow CSS (no emojis)

### G) Controls that MUST NOT happen
- Snip must NOT auto-toggle SST/CHL
- Snip must NOT modify inlet or Command Bridge state
- Only camera move is the one fitBounds on release + Return

## 🧽 Legacy Decommission Plan

Remove/disable:
1. Mock data paths
2. Old "Edge Mode" / squiggle overlays
3. Old banners like "Analysis Complete"
4. Any snip-triggered camera moves beyond the one fit
5. Any snip-triggered layer toggles
6. Legacy polygon code paths not using `/api/ocean-features/live`

## 🧪 5-Minute QA
1. Draw a box ≥10 km² → camera fits once, rect pulses, stays visible
2. Modal auto-opens with sections; low coverage banner shows where appropriate
3. Hotspots render as dots, polygons overlay clickable; Return to Overview restores saved camera
4. Toggle SST OFF and snip again → no SST section; CHL remains
5. No layer auto-toggles; inlet doesn't change; Command Bridge state untouched

## 🧷 Guardrail (CI)

Add to `scripts/lint-contracts.sh`:
```bash
# Snip: block extra camera moves, auto toggles, mock data
rg -n "(fitBounds|flyTo|easeTo).*snip|snip.*(fitBounds|flyTo|easeTo)" src | rg -v "fitBounds\\(rectBbox" && { echo "❌ Unexpected snip camera move"; FAIL=1; }
rg -n "snip.*(toggle|set.*Visibility|setSst|setChl)" src && { echo "❌ Snip layer toggle"; FAIL=1; }
rg -n "features/snip.*(mock|fake|placeholder|Math\\.random|/mocks?/)" src && { echo "❌ Snip mock data present"; FAIL=1; }
```
