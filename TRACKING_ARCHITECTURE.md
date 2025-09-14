# 🚢 Tracking System Architecture

## Navigation Flow (Option 2 - Separate Pages)

```
NavTabs Component
├── /legendary → Analysis Page
│   ├── Full map with SST/CHL layers
│   ├── LeftZone (layer controls)
│   ├── RightZone (analysis tools)
│   └── SnipTool, InletRegions, etc.
│
├── /tracking → Tracking Page ✅ (We're building this)
│   ├── Clean map instance
│   ├── SimpleVesselMarkers
│   ├── Right-side control panel
│   └── Compact legend
│
├── /trends → Trends Page
│   └── Dashboard view
│
└── /community → Community Page
    └── Community features
```

## Tracking Page Components

### 1. **Main Page** (`/app/tracking/page.tsx`)
- Uses `MapShell` for consistent map initialization
- Manages vessel visibility states
- Integrates all tracking components

### 2. **Vessel Markers** (`SimpleVesselMarkers.tsx`)
- **You**: White dot with cyan glow + pulse animation
- **Fleet**: Inlet-colored dots (matches selected inlet)
- **Commercial**: Orange triangles (GFW vessels)

### 3. **Control Panel** (Right side)
- Toggle switches for:
  - You (show/hide)
  - Fleet (show/hide)
  - Commercial (show/hide)
  - Show Tracks (historical paths)
- Vessel info summary

### 4. **Legend** (`MapLegend.tsx`)
- Compact, collapsible
- Shows only visible elements
- Positioned center-top for tracking

## Data Flow

```
User selects inlet → Updates global state (useAppState)
                  ↓
Tracking page reads selectedInletId
                  ↓
SimpleVesselMarkers applies inlet colors to fleet
                  ↓
Map flies to inlet location (60nm view)
```

## Key Features

1. **Clean Separation**: Each page has its own map instance
2. **Performance**: Only loads tracking-specific components
3. **State Management**: Uses global state for inlet selection
4. **Visual Consistency**: Matches inlet colors from dropdown
5. **User Experience**: Clean, modern, intuitive controls

## Visual Design

### Color Palette
- **You**: `#ffffff` (white) with `#00DDEB` (cyan) glow
- **Fleet**: Dynamic based on selected inlet
  - Montauk: `#e74c3c` (red)
  - Block Island: `#3498db` (blue)
  - Newport: `#9b59b6` (purple)
  - Martha's Vineyard: `#e67e22` (orange)
  - Nantucket: `#1abc9c` (teal)
  - Cape Cod: `#f39c12` (gold)
  - Provincetown: `#e91e63` (pink)
  - Plymouth: `#2ecc71` (green)
- **Commercial**: `#f39c12` (orange)

### Animations
- User marker: Continuous pulse + ripple effect
- Fleet markers: Subtle glow
- Commercial: Static triangles

## Benefits of This Architecture

1. **Modularity**: Each page is self-contained
2. **Maintainability**: Easy to update tracking without affecting analysis
3. **Performance**: Lazy loading of page-specific components
4. **Scalability**: Can add more tracking features without bloating other pages
5. **User Experience**: Fast tab switching, clean state management
