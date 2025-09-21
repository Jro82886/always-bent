# Tracking Page Flow - Complete Understanding

## Overview
The Tracking page is a real-time vessel tracking system that displays user location, fleet vessels, and commercial vessels on an interactive Mapbox map.

## Page Load Flow

### 1. Initial Page Load (`/legendary?mode=tracking`)
```
NavTabs → Link clicked → URL changes to /legendary?mode=tracking
↓
src/app/legendary/tracking/page.tsx
- Dynamic import of TrackingContent (SSR disabled)
- Shows "Loading map..." while loading
↓
TrackingContent.tsx loads
```

### 2. Map Initialization
```
TrackingContent component mounts
↓
useEffect (empty deps) runs once:
- Sets Mapbox access token
- Creates/reuses global map instance
- Configures globe projection
- Sets dark style
- Adds navigation controls
↓
Map 'load' event:
- Configures fog/atmosphere
- Sets initial view (inlet or East Coast)
- Marks map as ready
```

### 3. State Management
```
Component State:
- mapFullyReady: boolean
- showYou/showTracks: boolean (user vessel)
- showFleet/showFleetTracks: boolean (fleet vessels)
- showCommercial/showCommercialTracks: boolean (GFW vessels)
- userPosition: GPS coordinates
↓
Global State (useAppState):
- selectedInletId: Current inlet selection
- Syncs with URL via useInletFromURL hook
```

### 4. Vessel Layers

#### A. User Vessel (VesselLayerClean)
```
If showYou is true:
- Requests browser geolocation permission
- Updates position every 30 seconds
- Shows green vessel marker
- Optionally shows track history
- Emits position to parent via onPositionUpdate
```

#### B. Fleet Vessels (RecBoatsClustering)
```
If showFleet is true:
- Currently uses mock data (3 vessels)
- Future: Supabase realtime subscription
- Shows color-coded by inlet
- Clusters when zoomed out
- Shows individual vessels when zoomed in
```

#### C. Commercial Vessels (CommercialVesselLayer)
```
If showCommercial is true:
↓
Fetch from /api/gfw/vessels:
- Passes inlet bounding box
- 4-day history (GFW is 3 days behind)
- 5-minute cache per inlet
↓
If GFW_API_TOKEN exists:
- Fetches real vessel data
- Shows vessel type icons (longliner, trawler, etc)
- Shows vessel details on click
↓
If no token or error:
- Shows toast notification
- "No vessels in this area"
- "GFW server down, try back later"
```

### 5. UI Components

#### TrackingToolbar (Bottom)
```
Contains toggle buttons:
- You (vessel icon) - Your position
- Tracks (wavy lines) - Show track history
- Fleet (group icon) - Recreational boats
- Commercial (ship icon) - GFW vessels
↓
Weather Widget:
- Fetches from /api/stormio
- Shows wind, waves, pressure
- Updates every 30 seconds
↓
Community Button:
- Navigate to community chat
```

#### HeaderBar (Top)
```
- Inlet selector dropdown
- Changes map view on selection
- Overview = East Coast view
- Specific inlet = Zoomed view
```

#### TrackingLegend (Right side)
```
Shows active vessel counts:
- Your vessel status
- Fleet vessels nearby
- Commercial vessels count
- Color coding guide
```

### 6. Map Interactions

#### Inlet Selection Flow
```
User selects inlet in HeaderBar
↓
useAppState.setSelectedInletId(inletId)
↓
TrackingContent useEffect triggers:
- map.flyTo() to inlet coordinates
- Specific zoom level per inlet
↓
Vessel layers re-fetch for new area:
- CommercialVesselLayer fetches new bbox
- Fleet vessels filter by location
```

#### Toggle Vessel Types
```
User clicks toggle in toolbar
↓
setState updates (e.g., setShowCommercial)
↓
Corresponding layer component:
- Mounts/unmounts based on state
- Fetches data on mount
- Adds/removes map markers
```

### 7. Data Flow

#### Location Services
```
Browser Geolocation API
↓
VesselLayerClean component
- watchPosition() for updates
- Stores track in component state
- Could persist to localStorage
```

#### Commercial Vessel Data
```
GFW API Token in environment
↓
/api/gfw/vessels endpoint
- Validates token
- Calls GFW API v3
- Transforms vessel format
- Returns vessel array
↓
CommercialVesselLayer
- Creates Mapbox markers
- Shows vessel popups
- Handles errors gracefully
```

#### Weather Data
```
StormGlass API Token
↓
/api/stormio endpoint
- Fetches weather/tide/moon
- 30-second cache
- Falls back to mock
↓
TrackingToolbar widget
- Displays current conditions
- Auto-refreshes
```

### 8. Error Handling

1. **No Location Permission**
   - Shows "Location access needed" in legend
   - You toggle disabled

2. **No GFW Token**
   - Toast: "Vessel tracking service not configured"
   - No commercial vessels shown

3. **GFW Server Error**
   - Toast: "GFW server down, try back later"
   - Retries after 5-minute cache expires

4. **No Vessels Found**
   - Toast: "No commercial vessels detected in this area"
   - Normal behavior for empty areas

### 9. Performance Optimizations

1. **Global Map Instance**
   - Map persists across re-renders
   - Only destroyed on page navigation

2. **Vessel Data Caching**
   - 5-minute cache per inlet
   - Prevents excessive API calls

3. **Dynamic Imports**
   - Components load on demand
   - SSR disabled for map components

4. **Throttled Updates**
   - GPS updates every 30 seconds
   - Weather updates every 30 seconds

### 10. Future Enhancements

1. **Real Fleet Data**
   - Replace mock with Supabase realtime
   - User vessels share positions
   - Friend/crew system

2. **Vessel Persistence**
   - Store tracks in Supabase
   - Historical playback
   - Trip analysis

3. **Enhanced Clustering**
   - Better performance with many vessels
   - Custom cluster icons
   - Cluster details on hover

4. **Offline Support**
   - Cache vessel positions
   - Queue position updates
   - Sync when online

## Summary

The Tracking page is a sophisticated real-time vessel tracking system that:
- Shows your position, fleet vessels, and commercial traffic
- Integrates with multiple APIs (Mapbox, GFW, StormGlass)
- Handles errors gracefully with user-friendly messages
- Optimizes performance with caching and persistence
- Provides rich interactivity with vessel details and weather

The flow is: **Initialize map → Sync inlet selection → Toggle vessel types → Fetch/display vessels → Handle interactions**
