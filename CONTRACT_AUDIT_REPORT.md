# Contract Audit Report — Features Missing Explicit Contracts

Based on audit of the codebase, here are features that violate established patterns or lack explicit contracts:

## 🎯 Critical Violations Found

### 1. Camera Control (Multiple Violations)
**Files:** 
- `src/lib/MapRef.tsx:85-94` - Flies to inlet on change
- `src/components/HeaderBar.tsx:68-79` - Flies map on inlet selection
- `src/components/AnalyzeBar.tsx` - Camera moves on snip

**Proposed Contract:** Camera moves are user-initiated only via explicit zoom buttons or manual pan/drag. Inlet selection, layer toggles, and analysis tools must NOT trigger automatic camera movements. The only exception is the Snip tool's single fitBounds on mouse-up with explicit Return button.

**Guardrail Rules:**
```bash
rg -n "flyTo.*inlet|fitBounds.*inlet|easeTo.*inlet" src
rg -n "useEffect.*\.(flyTo|fitBounds|easeTo)" src
rg -n "(setSelectedInletId|onInlet).*\.(flyTo|fitBounds)" src
```

### 2. Direct Fetch Without Service Layer
**Files:**
- `src/components/LayersRuntime.tsx:39` - Direct fetch to `/api/ocean-features/live`
- `src/components/HeaderBar.tsx:47` - Direct fetch to `/api/tiles/index`

**Proposed Contract:** All data fetching must go through dedicated service modules in `src/lib/services/`. Components should never fetch directly. Services handle caching, error states, and provide typed interfaces.

**Guardrail Rules:**
```bash
rg -n "fetch\(" src/components | rg -v "services/"
rg -n "fetch\(.*api/" src/components
rg -n "new Request|new URL.*api" src/components
```

### 3. Layer Auto-Toggle Violations
**Files:**
- `src/components/ABFIToggle.tsx` - Auto-enables on date change
- `src/components/CHLToggle.tsx` - Auto-enables on date change

**Proposed Contract:** Layer visibility is exclusively controlled by user clicks. No automatic toggling based on inlet changes, date changes, or other state. Layers persist their on/off state until explicitly toggled by the user.

**Guardrail Rules:**
```bash
rg -n "useEffect.*setRasterVisible" src
rg -n "automatic.*toggle|auto.*layer" src -i
rg -n "inlet.*&&.*setVisible" src
```

### 4. Duplicate Legend Implementations
**Files:**
- `src/components/HeaderBar.tsx:156-170` - Inline color legend
- `src/components/tracking/CompactLegend.tsx` - Vessel legend
- `src/components/analysis/CommercialVesselLegend.tsx` - Another vessel legend

**Proposed Contract:** Single source of truth for legends. Extract shared `<UnifiedLegend />` component that accepts items array. Mode-specific legends compose from this base. No inline legend markup in other components.

**Guardrail Rules:**
```bash
rg -n "className.*legend|Legend.*map\(" src | rg -v "components/legends"
rg -n "<svg.*vessel|vessel.*color.*map" src
rg -n "Trawler.*Longliner.*color" src | wc -l # Should be 1
```

### 5. Hardcoded Colors Throughout
**Files:**
- `src/components/LayersRuntime.tsx:67,80` - Hardcoded hex colors for ocean features
- `src/components/HeaderBar.tsx:21` - Builds color map locally
- Multiple components using inline color values

**Proposed Contract:** All colors come from centralized palette in `src/lib/design/palette.ts`. Components import color constants, never hardcode hex/rgb values. Palette exports semantic names like `OCEAN_THERMAL`, `VESSEL_COMMERCIAL`, etc.

**Guardrail Rules:**
```bash
rg -n "#[0-9a-fA-F]{6}|rgb\(" src | rg -v "palette|design/colors"
rg -n "color:.*['\"]#|bg.*['\"]#" src/components
rg -n "COLOR_MAP|buildInletColorMap" src | rg -v "lib/design"
```

### 6. Weather Without Inlet Scoping
**Files:**
- `src/components/LiveWeatherWidget.tsx` - Needs to use selectedInletId
- Various weather displays not checking inlet context

**Proposed Contract:** All weather data must be scoped to selectedInletId. Weather components receive inlet from context/props, never fetch based on GPS or hardcoded locations. Weather services accept inlet parameter, not lat/lon.

**Guardrail Rules:**
```bash
rg -n "weather.*lat.*lon|weather.*latitude" src/components
rg -n "fetch.*weather" src | rg -v "inlet"
rg -n "weather.*useEffect" src | rg -v "selectedInletId"
```

### 7. Snip/Polygon Legacy Paths
**Files:**
- Old mock data generators still present
- Edge detection not using `/api/ocean-features/live`

**Proposed Contract:** (Already defined in SNIP_TOOL_CONTRACT_VFINAL.md)

**Guardrail Rules:** (Already added to lint-contracts.sh)

### 8. Toast/Error Handling Chaos
**Files:**
- `src/components/tracking/VesselLayer.tsx:72-92` - Custom toast implementation
- `src/components/ModernControls.tsx:647` - Another toast approach
- Direct DOM manipulation for notifications

**Proposed Contract:** Centralized toast system via `src/lib/services/toast.ts`. Components call `toast.show(message, type)`. No direct DOM manipulation. Toasts stack, auto-dismiss, and respect z-index hierarchy. Error boundaries catch and display gracefully.

**Guardrail Rules:**
```bash
rg -n "document\.createElement.*toast|toast.*appendChild" src
rg -n "alert\(|window\.alert" src
rg -n "console\.error" src/components | rg -v "catch|error boundary"
```

### 9. Date/Time Handling Inconsistency
**Files:**
- Multiple date format approaches
- `selectedDate` vs `isoDate` confusion

**Proposed Contract:** All dates stored as ISO strings (YYYY-MM-DD) in state. Display formatting happens at render time via `formatDate()` helper. Special values ('today', 'yesterday') converted to ISO immediately. UTC is default timezone.

**Guardrail Rules:**
```bash
rg -n "new Date\(\)\.get" src | rg -v "toISOString|getUTC"
rg -n "selectedDate.*today|yesterday" src/components
rg -n "Date\.now\(\)" src/components | rg -v "timestamp|id"
```

### 10. Chat/Community Features
**Files:**
- `src/lib/services/chat.ts` - Has stub mode, needs production contract

**Proposed Contract:** Chat is inlet-scoped broadcast only. No persistence, no user profiles. Messages include: id, inletId, username, text, timestamp. Max 100 messages in memory. Reconnect on inlet change. No moderation in MVP.

**Guardrail Rules:**
```bash
rg -n "chat.*user.*profile|chat.*persist" src
rg -n "subscribe.*inlet" src/lib/services | wc -l # Should equal unsubscribe count
rg -n "chat.*moderate|chat.*flag" src
```

## 📋 Recommended Priority

1. **Camera Control** - Most disruptive to UX
2. **Direct Fetches** - Architecture violation  
3. **Toast/Errors** - User-facing consistency
4. **Hardcoded Colors** - Tech debt accumulator
5. **Weather Scoping** - Data accuracy issue

## 🔧 Implementation Order

1. Create `/src/lib/contracts/` directory
2. Write each contract as TypeScript interface + markdown doc
3. Update lint-contracts.sh with all rules
4. Fix violations in priority order
5. Add contracts to CI/CD pipeline

Each contract should be ~1 paragraph description + 3-5 implementation rules + 2-3 grep guards.
