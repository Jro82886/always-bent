# Legendary Tracking Page - Comprehensive Functionality Guide

## Overview
The Tracking page (`/legendary/tracking`) is a real-time vessel monitoring system that displays multiple vessel types on an interactive Mapbox GL map. It features sophisticated layering, clustering, and filtering based on inlet selection.

## Core Architecture

### 1. **Main Component Structure**
- **TrackingContent** (`src/app/legendary/tracking/TrackingContent.tsx`)
  - Manages the Mapbox GL map instance (persisted globally)
  - Coordinates all vessel layers and UI components
  - Handles inlet-based view changes
  - Manages vessel visibility states

### 2. **Map Initialization**
- Uses Mapbox GL with dark style and globe projection
- Token: `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`
- Persists map instance globally to avoid recreation on re-renders
- Initial view depends on inlet selection:
  - **Overview**: Fits East Coast bounds (Florida to Maine)
  - **Specific Inlet**: Flies to inlet center with preset zoom

## Vessel Types & Layers

### 1. **Your Vessel** (User's GPS Position)
- **Component**: `VesselLayerClean`
- **Color**: Emerald green (#10B981)
- **Features**:
  - Real-time GPS tracking (when permission granted)
  - Speed and heading display
  - Track history (optional toggle)
  - Mock data fallback when GPS unavailable

### 2. **Fleet Vessels** (Recreational Boats)
- **Component**: `RecBoatsClustering`
- **Colors**: Based on home inlet (each inlet has unique color)
- **Features**:
  - Clustering at low zoom levels
  - Individual boats at high zoom
  - Inlet-based filtering:
    - Overview: Shows ALL boats with inlet colors
    - Specific inlet: Shows ONLY that inlet's boats
  - Popup shows vessel name, captain, speed, home port
  - Track history (optional toggle)
  - Currently using mock data (5 vessels)

### 3. **Commercial Vessels** (Global Fishing Watch)
- **Component**: `CommercialVesselLayer`
- **API**: GFW API with 7-day history
- **Types & Colors**:
  - Longliner: Coral red (#FF6B6B)
  - Drifting Longline: Turquoise (#4ECDC4)
  - Trawler: Ocean blue (#45B7D1)
- **Features**:
  - Real-time data from GFW API
  - Fishing event detection
  - Track history (optional toggle)
  - Toast notifications for errors/status
  - Loading states

## UI Components

### 1. **HeaderBar** (Top)
- Shows "Command Bridge" branding
- Inlet selector dropdown
- Tab navigation (Analysis, Tracking, Community, Trends)

### 2. **TrackingToolbar** (Left Side)
- **Weather Card**:
  - Real-time conditions for selected inlet
  - Wind, waves, temperature
  - Updates every 30 seconds
  - Hidden in overview mode
  
- **Vessel Controls**:
  - You: Toggle user vessel + tracks
  - Fleet: Toggle recreational boats + tracks
  - Commercial: Toggle GFW vessels + tracks
  - Each has independent track toggle

- **Actions**:
  - Fly to Inlet: Centers map on selected inlet
  - Chat: Navigates to Community page

### 3. **EnhancedTrackingLegend** (Right Side)
- **Your Vessel Section**:
  - Shows active/hidden/no GPS status
  - Current speed when active
  
- **Fleet Vessels Section**:
  - Overview mode: Lists all inlets with vessel counts
  - Specific inlet: Shows only that inlet's vessels
  - Catch report indicators (yellow dots)
  - Total vessel count
  
- **Info Section**:
  - Contextual help based on current view

### 4. **GFWLegend** (Below Enhanced Legend)
- Only visible when commercial vessels toggled ON
- Shows vessel type counts
- Color-coded vessel types
- Data attribution to Global Fishing Watch

## Inlet Selection Logic

### **East Coast Overview** (`selectedInletId = null` or `'overview'`)
- Map shows entire East Coast
- ALL fleet vessels visible with their home inlet colors
- Commercial vessels cover entire East Coast
- Weather card hidden
- Legend shows vessels grouped by inlet

### **Specific Inlet Selected** (e.g., `'md-ocean-city'`)
- Map zooms to inlet area
- ONLY fleet vessels from that inlet shown
- Commercial vessels limited to inlet vicinity
- Weather shows inlet-specific conditions
- Legend shows only selected inlet's vessels

## Data Flow

### 1. **Fleet Vessels**
```typescript
getAllVessels(selectedInletId) → {
  user: mockUserVessel,
  fleet: filteredByInlet,
  commercial: fromGFW
}
```

### 2. **Commercial Vessels**
```typescript
/api/gfw/vessels?bbox={bounds}&days=7
→ Filter: longliners, drifting longlines, trawlers
→ Include: fishing events
→ Transform to vessel objects
```

### 3. **State Management**
- Global state: `useAppState()` for inlet selection
- Local state: Vessel visibility toggles
- URL sync: Inlet parameter (`?inlet=md-ocean-city`)

## Visual Features

### 1. **Inlet Regions**
- Glowing boundaries for each inlet
- Always visible at 16% opacity
- Provides visual context

### 2. **Clustering**
- Fleet vessels cluster below zoom 10
- Cluster size indicates vessel count
- Click to expand clusters

### 3. **Popups**
- Click vessels for detailed info
- Shows vessel name, type, speed, home port
- Time since last update

## Error Handling

### 1. **GPS Permissions**
- Graceful fallback to mock position
- Clear messaging in toolbar

### 2. **GFW API Errors**
- Toast notifications for:
  - Server down
  - API not configured
  - No vessels found
- Continues showing other vessel types

### 3. **Map Errors**
- Token validation
- Console logging for debugging

## Performance Optimizations

### 1. **Map Persistence**
- Global instance prevents recreation
- Smooth transitions between views

### 2. **Data Updates**
- Throttled vessel updates (2 second minimum)
- Weather updates every 30 seconds
- Cached GFW data (5 minutes)

### 3. **Conditional Rendering**
- Layers only mount when visible
- Components wait for map ready state

## Current Implementation Status

### ✅ **Working**
- Map initialization and persistence
- Inlet selection and view changes
- Commercial vessel integration (GFW)
- Weather data integration
- All UI components
- Toast notifications
- Vessel type legends

### 🚧 **Mock Data**
- User GPS position
- Fleet vessels (5 mock boats)
- Catch reports

### 📋 **Future Integration**
- Real user GPS tracking
- Live fleet vessel positions via Supabase
- Actual catch report data
- Real-time vessel updates
- AIS data integration

## Key Files
- `/src/app/legendary/tracking/TrackingContent.tsx` - Main page
- `/src/components/tracking/VesselLayerClean.tsx` - User vessel
- `/src/components/tracking/RecBoatsClustering.tsx` - Fleet vessels
- `/src/components/tracking/CommercialVesselLayer.tsx` - GFW vessels
- `/src/components/tracking/TrackingToolbar.tsx` - Left controls
- `/src/components/tracking/EnhancedTrackingLegend.tsx` - Right legend
- `/src/components/tracking/GFWLegend.tsx` - Commercial legend
- `/src/lib/vessels/vesselDataService.ts` - Vessel data logic
