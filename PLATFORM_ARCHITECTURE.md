# Always Bent Platform Architecture

## Core Philosophy: Intelligence vs. Coordination

### 📊 ANALYSIS TAB - Historical Intelligence
**"Where have vessels been fishing? Where are the hotspots?"**

**Purpose:** Find where fish are based on ocean conditions and historical vessel activity patterns

**What You See:**
- SST/Chlorophyll ocean data layers
- Snip tool for drawing analysis areas
- When you snip an area:
  - Hotspot detection (yellow pulsing dots)
  - Historical vessel tracks (last 4 days)
  - Recreational vessels (cyan tracks)
  - Commercial vessels (orange tracks from GFW)
  - Click hotspots or tracks for detailed analysis

**Key Features:**
- Pattern recognition
- Temperature break identification
- Chlorophyll edge detection
- Historical vessel convergence points
- Confidence scoring for fishing spots

---

### 📍 TRACKING TAB - Live Positions
**"Where is everyone RIGHT NOW?"**

**Purpose:** Real-time fleet coordination and vessel management

**What You See:**
- Live vessel positions as dots on the map
- Your current location (if sharing)
- Your fleet's real-time positions
- Tournament mode competitors
- Active vessel movements
- 7-day tracking history available

**Key Features:**
- Real-time position updates
- Fleet coordination
- Tournament tracking
- Privacy controls
- Inlet-based organization

---

## The Key Architectural Difference

| Aspect | Analysis Tab | Tracking Tab |
|--------|-------------|--------------|
| **Time Focus** | Historical (Past 4 days) | Real-time (Now) |
| **Data Type** | Patterns & Intelligence | Live Positions |
| **Primary Use** | Finding fish | Coordinating boats |
| **Vessel Display** | Track lines (where they've been) | Position dots (where they are) |
| **Ocean Data** | Primary focus (SST/CHL) | Secondary/Hidden |
| **User Goal** | "Where should I go?" | "Where is everyone?" |

---

## Data Flow

### Analysis Mode Data Sources:
1. **Ocean Data**: Copernicus Marine (SST/CHL tiles)
2. **Historical Tracks**: Supabase (user vessels) + GFW API (commercial)
3. **Hotspot Detection**: Algorithm analyzing temp gradients + vessel convergence
4. **Confidence Scoring**: Multi-factor analysis of conditions

### Tracking Mode Data Sources:
1. **Live Positions**: Supabase real-time subscriptions
2. **Fleet Data**: User's network vessels
3. **Tournament Data**: Shared competition positions
4. **Privacy Layer**: User-controlled visibility settings

---

## User Journey

### Typical Workflow:
1. **Morning Planning** → Analysis Tab
   - Check SST/CHL conditions
   - Snip areas of interest
   - Identify hotspots with high confidence
   - See where boats have been successful

2. **On the Water** → Tracking Tab
   - Share your position
   - See where fleet members are
   - Avoid crowded spots
   - Coordinate with other boats

3. **Reporting Success** → ABFI Button
   - Log catches at specific locations
   - Contribute to community intelligence
   - Build historical database

---

## Technical Separation Rationale

### Why Two Tabs?

1. **Performance**: 
   - Analysis requires heavy tile loading (SST/CHL)
   - Tracking needs real-time websocket connections
   - Separation prevents performance conflicts

2. **User Context**:
   - Different mindsets (planning vs. executing)
   - Different data needs (historical vs. live)
   - Different interaction patterns (analysis vs. monitoring)

3. **Data Privacy**:
   - Analysis data can be community-shared
   - Tracking data requires privacy controls
   - Separation ensures clear boundaries

---

## Future Integration Points

While maintaining separation, these features could bridge both modes:

1. **Quick Switch**: Maintain map position when switching tabs
2. **Overlay Option**: Optionally show live positions on Analysis
3. **Historical Playback**: Show track animation in Tracking
4. **Unified Hotspots**: Share hotspot detection between modes
5. **Cross-Reference**: Click vessel in Tracking → See their historical pattern

---

## Implementation Notes

- Analysis Tab uses static data with periodic updates
- Tracking Tab uses WebSocket for real-time updates
- Both share the same Mapbox instance but different layer sets
- State management keeps modes independent but coordinated
- Privacy settings apply globally but affect each mode differently

---

*This architecture ensures clean separation of concerns while maintaining a cohesive user experience. The distinction between "intelligence gathering" and "real-time coordination" is fundamental to the platform's value proposition.*
