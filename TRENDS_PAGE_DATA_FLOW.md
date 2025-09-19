# Trends Page Data Flow & Schema

## Current Implementation Overview

The Trends page provides "Ocean Intelligence Overview" - a comprehensive dashboard showing environmental conditions, tide predictions, moon phases, and bite predictions.

## Data Flow

### 1. **Page Load Sequence**
```
1. User navigates to /legendary/trends
2. TrendsModeFixed component loads
3. useInletFromURL() syncs inlet selection from URL
4. fetchEnvironmentalData() is called
```

### 2. **Data Fetching**
```javascript
// Current flow (line 151-242)
useEffect(() => {
  const fetchEnvironmentalData = async () => {
    if (!inlet) return;
    
    // Fetch Stormglass data (now /api/stormio)
    const stormioResponse = await fetch(`/api/stormio?lat=${inlet.center[1]}&lng=${inlet.center[0]}`);
    
    if (stormioResponse.ok) {
      const stormioData = await stormioResponse.json();
      
      // Transform to EnvironmentalData format
      setEnvironmentalData({
        tides: stormioData.tides.events,
        moonPhase: stormioData.moon,
        sunrise/sunset: stormioData.sun,
        waterTemp: stormioData.weather.sstC,
        windSpeed: stormioData.weather.windKt,
        pressure: stormioData.weather.pressureHpa,
        // etc...
      });
      
      // Calculate bite prediction
      const factors: BiteFactors = {
        moonPhase: stormioData.moon.illumPct / 100,
        tidePhase: getCurrentTidePhase(stormioData.tides.events),
        waterTemp: stormioData.weather.sstC * 9/5 + 32,
        // etc...
      };
      
      const prediction = calculateBitePrediction(factors);
      setBitePrediction(prediction);
    }
  };
  
  fetchEnvironmentalData();
  // Refresh every hour
  const interval = setInterval(fetchEnvironmentalData, 60 * 60 * 1000);
}, [inlet]);
```

## Component State

### EnvironmentalData Interface
```typescript
interface EnvironmentalData {
  tides: TideData[];        // Array of high/low tides
  moonPhase: MoonPhase;     // Current moon phase & illumination
  sunrise: string;          // Sunrise time
  sunset: string;           // Sunset time
  waterTemp: number;        // Water temperature (F)
  airTemp: number;          // Air temperature (F)
  windSpeed: number;        // Wind speed (knots)
  windDirection: string;    // Wind direction (compass)
  pressure: number;         // Barometric pressure (mb)
  visibility: number;       // Visibility (miles)
  cloudCover: number;       // Cloud cover (%)
}
```

### Display Sections

1. **Environmental Conditions Bar** (line 293-350)
   - Moon phase with icon
   - Next tide (type & time)
   - Sunrise/sunset times
   - Water temperature
   - Wind speed & direction
   - Barometric pressure

2. **Tide Chart** (line 353-411)
   - Visual SVG tide curve
   - 4 tide events for the day
   - Each tide shows: time, type (high/low), height

3. **Bite Prediction** (line 414-467)
   - Current conditions rating (excellent/good/fair/poor)
   - Activity score (0-100%)
   - Best fishing times
   - Positive factors (e.g., "Incoming tide", "Optimal water temperature")
   - Negative factors (e.g., "High winds", "Poor water temperature")

4. **Activity Pattern Chart** (line 471-488)
   - Hourly activity levels
   - Expected bite counts per time period

5. **Species Distribution** (line 492-514)
   - Top species percentages
   - Activity trends (up/down/stable)

6. **Intelligence Insights** (line 517-560)
   - AI-generated insights about conditions
   - Temperature breaks
   - Moon influence

## Data Sources

### Primary Source: Stormglass API (via /api/stormio)
```typescript
// StormioSnapshot format
{
  weather: {
    sstC: number;           // Sea surface temp (Celsius)
    windKt: number;         // Wind speed (knots)
    windDir: string;        // Wind direction
    swellFt: number;        // Swell height (feet)
    swellPeriodS: number;   // Swell period (seconds)
    pressureHpa: number;    // Pressure (hPa)
    pressureTrend?: 'rising' | 'falling' | 'steady';
  },
  moon: {
    phase: string;          // "Waxing Gibbous", etc.
    illumPct: number;       // 0-100
  },
  tides: {
    next: { type: 'high'|'low'; timeIso: string; heightM?: number },
    events?: Array<{ type: 'high'|'low'; timeIso: string; heightM?: number }>
  },
  sun: {
    sunriseIso: string;
    sunsetIso: string;
  },
  lastIso: string;          // Timestamp
}
```

### Calculated Data
1. **Bite Prediction** - Uses `calculateBitePrediction()` from `/lib/analysis/bite-predictor.ts`
2. **Activity Patterns** - Currently using mock data (lines 260-279)
3. **Species Distribution** - Currently using mock data (lines 281-288)

## Update Frequency
- Environmental data: Fetched on mount, then every 60 minutes
- All data is inlet-specific (changes when user selects different inlet)

## Missing/Mock Data
Currently using mock/placeholder data for:
1. Historical activity patterns
2. Species distribution
3. Vessel activity correlation
4. Multi-day forecasts

## Key Functions

### Helper Functions
- `calculateMoonPhase()` - Astronomical moon phase calculation
- `calculateSunTimes()` - Sunrise/sunset calculation based on lat/lon
- `generateTidePredictions()` - Mock tide data (to be replaced)
- `getCompassDirection()` - Convert degrees to compass direction
- `getMoonPhaseIcon()` - Get emoji for moon phase

### External Dependencies
- `calculateBitePrediction()` - Bite prediction algorithm
- `getCurrentSeason()` - Determine current season
- `getCurrentTidePhase()` - Determine current tide phase

## Performance Considerations
- Data is cached for 60 minutes
- No real-time updates (polling-based)
- All calculations done client-side
- Mock data prevents API rate limiting during development
