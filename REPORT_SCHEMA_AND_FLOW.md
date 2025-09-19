# ABFI Report Schema & Data Flow

## Overview
ABFI has multiple types of reports that flow through the system. This document defines the schemas and explains exactly how data flows from user action to storage to display.

## Report Types

### 1. **Bite Reports** (Quick ABFI Button)
When a user presses the ABFI bite button on the map.

#### Schema: `bite_reports` table
```sql
bite_reports {
  id: UUID
  bite_id: TEXT (client-generated UUIDv7)
  user_id: UUID
  user_name: TEXT
  created_at: TIMESTAMPTZ
  
  -- Location
  location: GEOGRAPHY(POINT)
  lat: DECIMAL(10,8)
  lon: DECIMAL(11,8)
  accuracy_m: DECIMAL
  inlet_id: TEXT
  
  -- Context (snapshot at bite time)
  context: JSONB {
    weather?: {  // From Stormglass API
      sstC: number
      windKt: number
      windDir: string
      swellFt: number
      swellPeriodS: number
      pressureHpa: number
    }
    moon?: { phase: string, illumPct: number }
    tides?: { next: { type: string, time: string, height: number } }
    sun?: { sunriseIso: string, sunsetIso: string }
  }
  
  -- User Input
  notes: TEXT
  fish_on: BOOLEAN
  species: TEXT
  
  -- Analysis
  status: 'pending_analysis' | 'analyzed' | 'analysis_failed'
  analysis: JSONB
  confidence_score: INTEGER
}
```

#### Flow:
1. User presses ABFI button
2. Client captures location, fetches `/api/stormio?lat={lat}&lng={lng}`
3. Saves to `bite_reports` with weather snapshot
4. Shows in Community feed as "⚡ BITE" report

---

### 2. **Catch Reports** (Community Reports)
Full fishing reports with species, conditions, etc.

#### Schema: `catch_reports` table
```sql
catch_reports {
  id: UUID
  user_id: UUID
  captain_name: TEXT
  boat_name: TEXT
  
  -- Catch Details
  species: TEXT
  lat: FLOAT
  lng: FLOAT
  selected_inlet: TEXT
  
  -- Conditions (if from Snip Tool)
  sst_temp: FLOAT
  chl_level: FLOAT
  conditions: JSONB {
    weather?: { /* Stormglass snapshot */ }
    analysis?: { /* From Snip Tool */ }
  }
  
  notes: TEXT
  is_abfi_bite: BOOLEAN  // True if from ABFI button
  created_at: TIMESTAMPTZ
}
```

#### Flow:
1. User submits via:
   - Community "Share Your Catch" modal
   - Snip Tool "Save as Report" 
   - ABFI Bite button (is_abfi_bite = true)
2. If from Snip Tool, includes full analysis + weather snapshot
3. Displays in Community feed with inlet chip

---

### 3. **Analysis Reports** (Snip Tool Results)
Temporary analysis results from the Snip Tool.

#### TypeScript Schema:
```typescript
type AnalysisResult = {
  // Area analyzed
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
  bbox: [number, number, number, number]
  inletName: string
  
  // Analysis results
  summary: string
  recommendations: string[]
  
  // Ocean data
  oceanConditions?: {
    sst?: number
    sstGradient?: number
    chl?: number
    currentSpeed?: number
    distanceToEdge?: number
  }
  
  // Vessel activity
  vesselActivity?: {
    nearbyCount: number
    activityLevel: 'high' | 'medium' | 'low'
    tracks?: Array<{
      type: 'gfw' | 'recreational'
      vesselName: string
      points: [number, number][]
    }>
  }
  
  // Hotspot detection
  hotspot?: {
    location: [number, number]
    confidence: number
  }
  
  // Environmental snapshot (from Stormglass)
  conditions?: {
    weather: { /* Stormglass data */ }
    moon: { phase: string, illumPct: number }
    tides: { events: Array<...> }
    lastIso: string
  }
}
```

#### Flow:
1. User draws polygon with Snip Tool
2. System analyzes:
   - SST/CHL from map tiles
   - Vessel tracks (GFW + user data)
   - Weather from `/api/stormio`
3. Shows modal with analysis
4. User can "Save as Report" → creates `catch_report` with full snapshot

---

## Data Flow Scenarios

### Scenario 1: User Presses ABFI Button
```
1. Client: Capture GPS location
2. Client: POST /api/bite-reports with location
3. Server: Fetch Stormglass data for location
4. Server: Save to bite_reports with weather snapshot
5. Server: Return success
6. Client: Show confirmation
7. Community: Display as "⚡ BITE" in feed
```

### Scenario 2: User Completes Snip Analysis
```
1. Client: Draw polygon on map
2. Client: Extract SST/CHL from visible tiles
3. Client: Fetch vessel tracks in area
4. Client: GET /api/stormio for weather
5. Client: Run analysis algorithm
6. Client: Show modal with results
7. User: Clicks "Save as Report"
8. Client: POST /api/reports with full analysis + conditions
9. Server: Save to catch_reports
10. Community: Display with analysis badge
```

### Scenario 3: Manual Community Report
```
1. User: Opens "Share Your Catch" modal
2. User: Fills species, notes, location
3. Client: POST /api/reports
4. Server: Optionally fetch current Stormglass (display only)
5. Server: Save to catch_reports
6. Community: Display in feed
```

---

## Important Rules

### Weather Data (Stormglass)
1. **ALWAYS** use `/api/stormio` endpoint
2. **NEVER** call Stormglass directly from client
3. **ALWAYS** save weather snapshot with reports
4. Saved snapshots are immutable (ground truth)

### Report Display
1. If report has saved conditions → show saved data
2. If no conditions → optionally fetch current (display only)
3. Bite reports show "⚡ BITE" badge
4. Analysis reports show "🔬 Analysis" badge

### Privacy
1. Location fuzzing applied server-side
2. Exact coordinates only visible to report owner
3. Public sees inlet-level location

### Retention
1. Bite reports: Auto-delete after 7 days
2. Catch reports: Permanent
3. Analysis results: Not saved unless user chooses

---

## API Endpoints

### `/api/bite-reports`
- POST: Create new bite report
- GET: Fetch recent bites (last 3 days)

### `/api/reports` 
- POST: Create catch report
- GET: Fetch community reports

### `/api/stormio`
- GET: Fetch weather/ocean conditions
- Params: `lat`, `lng`
- Returns: Normalized Stormglass data

### `/api/analyze`
- POST: Run ocean analysis
- Body: `{ bbox, layers, inletId }`
- Returns: Analysis results

---

## Database Queries

### Recent Community Activity
```sql
-- Get all reports for inlet in last 24h
SELECT * FROM catch_reports 
WHERE selected_inlet = $1 
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get analyzed bites with good conditions
SELECT * FROM bite_reports
WHERE status = 'analyzed'
  AND confidence_score > 70
  AND created_at > NOW() - INTERVAL '3 days'
ORDER BY confidence_score DESC;
```

### User's Reports
```sql
-- All user's reports
SELECT * FROM catch_reports 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- User's bites
SELECT * FROM bite_reports
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

---

## Frontend State Management

### Local Storage
- `abfi_community_reports`: Cached community feed
- `abfi_bite_logs`: Offline bite queue
- `abfi_analysis_history`: Recent analyses

### React State
- `useStore`: Current inlet, layers
- `AnalysisContext`: Active analysis
- `CommunityContext`: Feed + filters

---

This is the complete data flow. When live user data comes in, it follows these exact patterns.