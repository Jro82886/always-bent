# Snip Tool Complete Flow Summary

## Overview
The Snip Tool is ABFI's core feature for analyzing ocean conditions to find fishing hotspots. It allows users to draw a rectangle over any area of the ocean and receive comprehensive intelligence about that spot.

## User Flow (Step by Step)

### 1. **Initial State**
- User has selected their inlet (anchors data to their waters)
- Map shows East Coast overview
- All layers (SST, CHL, Ocean Floor) are OFF by default
- Snip Tool button shows in right panel: "Select Area to Analyze"

### 2. **Layer Activation**
- User toggles SST (Sea Surface Temperature) to see thermal highways
  - Orange/red = warm water, blue/green = cool water
  - Temperature legend shows 32°F to 86°F gradient
- User toggles CHL (Chlorophyll) to see plankton blooms
  - Green = high chlorophyll concentration
  - Mid-CHL Highlight slider enhances green plumes
- User can toggle Ocean Floor for bathymetry context

### 3. **Finding Edges**
- User looks for sharp color transitions
  - 2-3°F temperature change over short distance
  - Where green chlorophyll meets blue water
  - These edges are where baitfish gather and predators hunt

### 4. **Drawing the Snip**
- User clicks "Select Area to Analyze" button
- Cursor becomes crosshair
- User clicks first corner, then second corner to draw rectangle
- Rectangle should include both sides of an edge/break

### 5. **Analysis Process**
When rectangle is completed:
- Map zooms to fit the selected area with padding
- Rectangle pulses with slate-blue glow to indicate analysis
- "Return to Overview" button appears for zoom out
- Green success banner appears: "Analysis Complete! Click rectangle for ocean intelligence"

Behind the scenes, the system:
- Extracts actual SST pixel data from tiles
- Extracts actual CHL pixel data from tiles  
- Fetches polygon features (thermal fronts, eddies)
- Queries commercial vessel activity (GFW data)
- Gets weather/moon phase for the inlet
- Runs hotspot detection algorithm

### 6. **Hotspot Detection**
The system scores each area based on:
- **Temperature breaks**: Strong gradients (>2°F change)
- **Chlorophyll edges**: Where concentration changes rapidly
- **Convergence zones**: Where multiple features align
- **Commercial activity**: Recent vessel presence
- **Polygon features**: Thermal fronts, eddies

If score > threshold → Hotspot marker appears (glowing cyan dot)

### 7. **Viewing Results**
User clicks the rectangle (or hotspot marker if present):
- Analysis modal opens automatically
- Two-column layout shows:
  - **Left**: Key metrics, hotspot locations, feature summary
  - **Right**: Detailed written analysis with sections:
    - Ocean Intelligence (SST/CHL patterns)
    - Vessel Intelligence (commercial activity)
    - Environmental Conditions (weather/moon)
    - Local Knowledge (canyon/inlet specifics)
    - Fishing Intel (species suggestions)
    - Analysis Tips (what to look for)

### 8. **Visual Overlays**
While zoomed into snip area:
- Hotspot markers: Glowing cyan dots at high-score locations
- Polygon outlines: Thin glowing lines showing thermal fronts/eddies
- Rectangle remains visible with subtle pulse effect
- All overlays use on-brand colors (cyan, green, orange)

### 9. **Persistence**
- Analysis results stored in component state
- Rectangle and markers remain until:
  - User starts new snip
  - User navigates away
  - User clicks "Return to Overview"

## Technical Implementation

### Key Components
1. **SnipTool.tsx**: Handles drawing, rectangle management, zoom behavior
2. **SnipController.tsx**: Orchestrates analysis, data extraction, modal display
3. **AnalysisModal.tsx**: Displays comprehensive results
4. **tile-data-extractor.ts**: Extracts real pixel values from SST/CHL tiles
5. **comprehensive-analyzer.ts**: Runs hotspot detection algorithm
6. **smart-water-analysis.ts**: Generates human-readable analysis text

### Data Sources
- **SST Tiles**: Copernicus WMTS (via /api/tiles/sst proxy)
- **CHL Tiles**: Copernicus WMTS (via /api/tiles/chl proxy)
- **Polygons**: Python backend (/api/polygons/live)
- **Commercial Vessels**: GFW API (filtered to trawlers, longliners, drifting)
- **Weather**: NOAA buoys (via /api/weather)
- **Moon Phase**: Stormglass API

### Critical Requirements
- Must extract REAL pixel data, not mock data
- Hotspots shown as glowing dots, not "squiggles"
- Analysis modal opens automatically after snip
- Rectangle remains visible with pulse effect
- All text uses on-brand symbols (◆ ⬢ ▲ ✦), no emojis

## Current Status
- ✅ Real pixel extraction working
- ✅ Hotspot detection algorithm implemented
- ✅ Commercial vessel integration complete
- ✅ Weather/moon phase integrated
- ✅ Analysis modal auto-opens
- ✅ Zoom-to-snip with return button
- ✅ Smart written analysis with HTML formatting
- ✅ Tutorial updated to align with flow

## Edge Cases Handled
- No SST/CHL active: Error message to enable layers
- No data in area: Analysis explains what's missing
- Low data coverage: Shows banner explaining limited analysis
- Multiple hotspots: Shows all markers, lists in modal
- Polygon delay: Continues analysis without if >5s wait
