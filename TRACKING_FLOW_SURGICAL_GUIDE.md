# 🛰️ ABFI Tracking System - Surgical Implementation Guide

## Current State Analysis

### What's Working ✅
1. **Page Structure** (`/legendary/tracking/page.tsx`)
   - Map initialization with Mapbox
   - Command Bridge header integration
   - Inlet selection awareness
   - Component composition (VesselLayer, CommercialVesselLayer, UnifiedTrackingPanelLeft)
   - Everything OFF by default (power saving)

2. **API Endpoints** (partially implemented)
   - `/api/tracking/position` - Records vessel positions
   - `/api/tracking/fleet` - Gets fleet positions with trails
   - `/api/tracking/activity` - (exists but not analyzed yet)

3. **Components**
   - `VesselLayer` - Handles user position, fleet, and tracks
   - `CommercialVesselLayer` - GFW commercial vessel data
   - `UnifiedTrackingPanelLeft` - Control panel with toggles
   - `DepartureMonitor` - Detects when leaving inlet
   - `CompactLegend` - Visual legend for vessel types

### What's Using Mock Data 🔧
1. Fleet positions (MOCK_FLEET array in VesselLayer)
2. Commercial vessels (MOCK_COMMERCIAL array)
3. Track generation (generateTrack function)

### What's Missing ❌
1. Real-time position updates to database
2. WebSocket/polling for live fleet updates
3. Actual GFW API integration
4. User authentication for position tracking
5. Privacy controls implementation
6. Historical track persistence

## Data Flow Architecture

### 1. Position Tracking Flow
```
User Device → GPS → VesselLayer Component
                           ↓
                    POST /api/tracking/position
                           ↓
                    vessel_positions table
                           ↓
                    GET /api/tracking/fleet
                           ↓
                    Other Users' Maps
```

### 2. Database Schema (Current)
```sql
-- vessel_positions table
{
  id: UUID,
  user_id: UUID,
  username: TEXT,
  inlet_id: TEXT,
  lat: FLOAT,
  lng: FLOAT,
  speed: FLOAT,
  heading: FLOAT,
  session_id: TEXT,
  timestamp: TIMESTAMPTZ
}

-- loitering_events table (detected automatically)
{
  id: UUID,
  user_id: UUID,
  inlet_id: TEXT,
  lat: FLOAT,
  lng: FLOAT,
  start_time: TIMESTAMPTZ,
  end_time: TIMESTAMPTZ,
  duration_minutes: INT,
  avg_speed: FLOAT,
  confidence_score: FLOAT
}
```

## Surgical Implementation Plan

### Phase 1: Wire Up Real Position Tracking ⚡

**1. Fix VesselLayer to Send Real Positions**
```typescript
// In VesselLayer.tsx, around line 150
const sendPosition = async (position: GeolocationPosition) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return;
  
  await fetch('/api/tracking/position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.data.user.id,
      username: captainName || 'Anonymous',
      inlet_id: selectedInletId,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      session_id: sessionId // Generate on component mount
    })
  });
};
```

**2. Replace Mock Fleet with Real Data**
```typescript
// In VesselLayer.tsx, replace MOCK_FLEET usage
const fetchFleetPositions = async () => {
  const res = await fetch(`/api/tracking/fleet?inlet_id=${selectedInletId}&hours=4`);
  const data = await res.json();
  return data.fleet.vessels;
};

// Use in useEffect with polling
useEffect(() => {
  if (!showFleet) return;
  
  const updateFleet = async () => {
    const vessels = await fetchFleetPositions();
    updateFleetMarkers(vessels);
  };
  
  updateFleet();
  const interval = setInterval(updateFleet, 30000); // 30s refresh
  
  return () => clearInterval(interval);
}, [showFleet, selectedInletId]);
```

### Phase 2: Privacy & Permissions 🔐

**1. Location Fuzzing for Privacy**
```typescript
// Add to position submission
const fuzzyPosition = (lat: number, lng: number, privacyLevel: number) => {
  // Level 1: No fuzzing (exact)
  // Level 2: ±0.001° (~100m)
  // Level 3: ±0.01° (~1km)
  const fuzz = privacyLevel === 1 ? 0 : privacyLevel === 2 ? 0.001 : 0.01;
  return {
    lat: lat + (Math.random() - 0.5) * fuzz * 2,
    lng: lng + (Math.random() - 0.5) * fuzz * 2
  };
};
```

**2. Add Privacy Controls to Panel**
```typescript
// In UnifiedTrackingPanelLeft
<select 
  value={privacyLevel} 
  onChange={(e) => setPrivacyLevel(Number(e.target.value))}
  className="bg-slate-700 text-xs rounded px-2 py-1"
>
  <option value={1}>Exact Position</option>
  <option value={2}>~100m Fuzzing</option>
  <option value={3}>~1km Fuzzing</option>
</select>
```

### Phase 3: Commercial Vessel Integration 🚢

**1. GFW API Integration**
```typescript
// New file: src/lib/tracking/gfwClient.ts
export async function getGFWVessels(bounds: LngLatBounds) {
  const token = process.env.NEXT_PUBLIC_GFW_TOKEN;
  const response = await fetch(`https://gateway.api.globalfishingwatch.org/v2/vessels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      datasets: ['public-global-fishing-vessels:v2.0'],
      geometry: {
        type: 'Polygon',
        coordinates: [boundsToPolygon(bounds)]
      },
      'start-date': new Date(Date.now() - 24*60*60*1000).toISOString(),
      'end-date': new Date().toISOString()
    })
  });
  
  return response.json();
}
```

**2. Update CommercialVesselLayer**
```typescript
// Replace mock data with real GFW call
useEffect(() => {
  if (!showCommercial || !map) return;
  
  const bounds = map.getBounds();
  const fetchCommercial = async () => {
    const vessels = await getGFWVessels(bounds);
    updateCommercialMarkers(vessels);
  };
  
  fetchCommercial();
}, [showCommercial, map]);
```

### Phase 4: Real-time Updates ⚡

**1. WebSocket Connection (Optional Enhancement)**
```typescript
// src/lib/tracking/realtimeClient.ts
import { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToFleetUpdates(
  inlet_id: string, 
  onUpdate: (vessel: VesselUpdate) => void
) {
  const channel = supabase
    .channel(`fleet:${inlet_id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'vessel_positions',
      filter: `inlet_id=eq.${inlet_id}`
    }, (payload) => {
      onUpdate(payload.new as VesselUpdate);
    })
    .subscribe();
    
  return () => channel.unsubscribe();
}
```

**2. Or Simple Polling (Current Approach)**
```typescript
// Already implemented in Phase 1 with 30s interval
// Can reduce to 10-15s for more real-time feel
```

### Phase 5: Track Persistence & History 📊

**1. Track Storage Strategy**
```typescript
// Store significant track points (not every GPS update)
const shouldStoreTrackPoint = (
  lastPoint: TrackPoint, 
  newPoint: TrackPoint
) => {
  const timeDiff = Date.now() - lastPoint.timestamp;
  const distanceDiff = calculateDistance(lastPoint, newPoint);
  
  // Store if: 5+ minutes passed OR 0.5+ nm traveled OR significant turn
  return timeDiff > 300000 || distanceDiff > 0.5 || 
         Math.abs(newPoint.heading - lastPoint.heading) > 30;
};
```

**2. Track Retrieval API**
```typescript
// GET /api/tracking/tracks?user_id=X&hours=4
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const hours = parseInt(searchParams.get('hours') || '4');
  
  const tracks = await supabase
    .from('vessel_tracks')
    .select('*')
    .eq('user_id', user_id)
    .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: true });
    
  return NextResponse.json({ tracks: tracks.data });
}
```

## Testing Checklist ✅

### Local Testing
1. [ ] Enable "Show You" - verify position marker appears
2. [ ] Check position is sent to API (Network tab)
3. [ ] Enable "Show Fleet" - verify other vessels appear
4. [ ] Toggle "Show Tracks" - verify trail lines render
5. [ ] Change inlet - verify fleet updates for that inlet
6. [ ] Test privacy levels - verify position fuzzing works

### API Testing
```bash
# Test position recording
curl -X POST http://localhost:3000/api/tracking/position \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "username": "Test Captain",
    "inlet_id": "ny-montauk",
    "lat": 41.0710,
    "lng": -71.9360,
    "speed": 15.5,
    "heading": 270
  }'

# Test fleet retrieval
curl http://localhost:3000/api/tracking/fleet?inlet_id=ny-montauk&hours=4
```

### Production Testing
1. [ ] Multiple users in same inlet see each other
2. [ ] Tracks persist across sessions
3. [ ] Commercial vessels show real GFW data
4. [ ] Performance with 50+ vessels on screen
5. [ ] Privacy controls respected

## Security Considerations 🔒

1. **Authentication Required**
   - Only logged-in users can submit positions
   - User can only update their own position

2. **Privacy by Default**
   - Location sharing is opt-in
   - Fuzzing levels available
   - Can hide from specific users (future)

3. **Rate Limiting**
   - Position updates max 1/second
   - Fleet queries max 2/minute per user

4. **Data Retention**
   - Positions older than 7 days auto-delete
   - Tracks compressed after 24 hours

## Performance Optimizations 🚀

1. **Viewport Culling**
   - Only fetch vessels in current map bounds
   - Unrender markers outside viewport

2. **Trail Decimation**
   - Reduce track points for older data
   - Use Douglas-Peucker algorithm

3. **Batched Updates**
   - Group position updates every 5 seconds
   - Single API call for multiple movements

4. **Caching**
   - Cache fleet positions for 30 seconds
   - Cache commercial vessels for 5 minutes

## Migration Path

### Week 1: Core Functionality
- Wire real position tracking
- Replace mock fleet data
- Basic privacy controls

### Week 2: Commercial Integration
- GFW API connection
- Commercial vessel display
- Performance optimization

### Week 3: Polish & Features
- Track persistence
- Historical playback
- Advanced privacy options

### Week 4: Production Hardening
- Load testing
- Security audit
- Performance tuning

## Environment Variables Needed

```env
# Add to .env.local and Vercel
NEXT_PUBLIC_GFW_TOKEN=xxx  # Global Fishing Watch API
SUPABASE_SERVICE_ROLE_KEY=xxx  # For server-side DB access
NEXT_PUBLIC_TRACKING_ENABLED=true  # Feature flag
```

## Success Metrics 📊

1. **Adoption**: 50%+ of users enable tracking
2. **Engagement**: Average session >10 minutes
3. **Performance**: <100ms position update latency
4. **Privacy**: <5% disable due to privacy concerns
5. **Reliability**: 99.9% uptime for tracking service

---

## Quick Start Commands

```bash
# 1. Test the APIs
npm run test:tracking

# 2. Run tracking in dev mode
npm run dev

# 3. Monitor real-time logs
supabase functions logs --tail

# 4. Check database
psql $DATABASE_URL -c "SELECT * FROM vessel_positions ORDER BY timestamp DESC LIMIT 10;"
```

This is your surgical guide to making Tracking fully operational. Start with Phase 1 (real positions) and work through systematically. Each phase builds on the previous one.
