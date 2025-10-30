# Milestone 2: Feature Completion Testing Guide

## Overview
This guide covers testing procedures for the **ABFI Bite Button** and **Vessel Tracking** features implemented in Milestone 2.

## 1. ABFI Bite Button Testing

### 1.1 GPS Capture Testing

**Test Case: Successful GPS Capture**
1. Navigate to any page with the ABFI Bite Button
2. Click the "ABFI Bite" button (or press 'B' key)
3. Allow location permission when prompted
4. Verify that:
   - Button shows "Logging..." state
   - Success toast appears with "Bite saved" message
   - Bite Report Card displays with current location
   - Location coordinates are accurate (compare with device GPS)

**Test Case: GPS Permission Denied**
1. Deny location permission
2. Click the ABFI Bite button
3. Verify that:
   - Warning toast appears: "Enable location to log a bite"
   - Fallback to map center location (if available)

**Test Case: Offline Mode**
1. Disable internet connection
2. Click the ABFI Bite button
3. Verify that:
   - Bite is saved locally
   - Info toast appears: "Saved offline"
   - Pending badge counter increments
   - Data syncs when connection restored

### 1.2 Ocean Conditions Data Testing

**Test Case: Environmental Data Capture**
1. Click ABFI Bite button
2. Wait for Bite Report Card to load
3. Verify the following data is displayed:
   - **SST (Sea Surface Temperature)**: Temperature in °F
   - **Chlorophyll**: Concentration in mg/m³
   - **Wind**: Speed in knots and direction
   - **Waves**: Height in feet
   - **Tide**: Phase (high/low/rising/falling)
   - **Moon**: Phase and illumination percentage
   - **Pressure**: Barometric pressure in hPa

**Test Case: SST Break Detection**
1. Record a bite in known SST front area
2. Verify that:
   - "Break nearby!" indicator appears
   - Pattern match score increases
   - Recommendations mention temperature break

### 1.3 Pattern Matching Testing

**Test Case: Pattern Confidence Score**
1. Record multiple bites
2. Verify that each report shows:
   - Pattern Match percentage (0-100%)
   - Visual progress bar
   - Contextual insights for high scores (>70%)

### 1.4 API Endpoints Testing

**Test Endpoints:**

```bash
# Test Ocean Conditions API
curl -X GET "http://localhost:3000/api/ocean-conditions?lat=35.22&lng=-75.54"

# Test Bite Reports API
curl -X POST "http://localhost:3000/api/bite-reports" \
  -H "Content-Type: application/json" \
  -d '{
    "bite_id": "test-123",
    "location": {"lat": 35.22, "lng": -75.54},
    "inlet_id": "nc-hatteras"
  }'

# Test StormIO Weather API
curl -X GET "http://localhost:3000/api/stormio?lat=35.22&lng=-75.54"
```

## 2. Vessel Tracking Testing

### 2.1 Live Data Sources

**Test Case: Supabase Fleet Vessels**
1. Navigate to the Tracking page
2. Select an inlet (e.g., Hatteras)
3. Verify that:
   - Fleet vessels appear on map (if data exists)
   - Vessel positions update every 5 seconds
   - Vessel colors match inlet associations
   - Fleet panel shows vessel details

**Database Check:**
```sql
-- Check for vessel positions in Supabase
SELECT * FROM vessels_latest
WHERE recorded_at > NOW() - INTERVAL '48 hours'
ORDER BY recorded_at DESC;
```

**Test Case: GFW Commercial Vessels**
1. Ensure GFW_API_TOKEN is configured in .env
2. Navigate to Tracking page
3. Verify that:
   - Commercial vessels (orange markers) appear
   - Vessel types shown (Trawler, Longliner, etc.)
   - Vessel tracks display when available

**API Test:**
```bash
# Test GFW Vessels API
curl -X GET "http://localhost:3000/api/gfw/vessels?bbox=-76,34,-74,36&days=4"
```

### 2.2 User GPS Tracking

**Test Case: User Vessel Position**
1. Allow location permission
2. Navigate to Tracking page
3. Verify that:
   - Green "Your Vessel" marker appears at current location
   - Position updates with device movement
   - Speed and heading display (if available)

### 2.3 Real-time Updates

**Test Case: Position Updates**
1. Open Tracking page
2. Monitor for 30 seconds
3. Verify that:
   - Vessel positions update smoothly
   - No flickering or jumping
   - Vessel trails update (if implemented)

## 3. Integration Testing

### 3.1 Bite + Vessel Context

**Test Case: Vessel Activity in Bite Reports**
1. Record a bite while vessels are visible
2. Verify Bite Report shows:
   - Nearby vessel count
   - Fleet activity indicators
   - Recommendations based on vessel presence

### 3.2 Data Synchronization

**Test Case: Offline to Online Sync**
1. Record 3 bites while offline
2. Restore connection
3. Verify that:
   - All bites sync automatically
   - Badge counter decrements
   - Server analysis completes
   - Reports appear in database

## 4. Performance Testing

### 4.1 Load Testing

**Test Case: Multiple Vessels**
- Load 100+ vessels on map
- Verify smooth scrolling and zooming
- Check memory usage stays reasonable

### 4.2 API Response Times

Expected response times:
- Ocean Conditions API: < 2 seconds
- GFW Vessels API: < 3 seconds
- StormIO API: < 1 second (cached)

## 5. Configuration Requirements

### Environment Variables
```env
# Required for full functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
STORMGLASS_API_KEY=your_stormglass_key
GFW_API_TOKEN=your_gfw_token

# Optional
NEXT_PUBLIC_GFW_DEMO=1  # Use demo mode if no API key
```

### Database Requirements
- Supabase tables: `bite_reports`, `vessel_positions`, `vessels_latest` (view)
- Proper RLS policies configured
- PostGIS extension enabled

## 6. Troubleshooting

### Common Issues

**Issue: No vessels showing**
- Check Supabase connection
- Verify vessel_positions table has recent data
- Check browser console for errors

**Issue: Ocean data not loading**
- Verify StormGlass API key
- Check API rate limits
- Try clearing cache

**Issue: Bites not syncing**
- Check authentication status
- Verify network connection
- Check browser IndexedDB storage

## 7. Test Checklist

### Bite Button
- [ ] GPS capture works
- [ ] Offline storage works
- [ ] Sync on reconnect
- [ ] Ocean conditions load
- [ ] Pattern matching displays
- [ ] Share functionality works
- [ ] Keyboard shortcut ('B') works

### Vessel Tracking
- [ ] User vessel displays
- [ ] Fleet vessels load from Supabase
- [ ] Commercial vessels from GFW
- [ ] Real-time position updates
- [ ] Vessel details panel works
- [ ] Inlet filtering works
- [ ] Color coding by inlet

### APIs
- [ ] /api/ocean-conditions returns data
- [ ] /api/bite-reports saves reports
- [ ] /api/gfw/vessels returns vessels
- [ ] /api/stormio returns weather
- [ ] All APIs handle errors gracefully

## 8. Production Readiness

Before going live:
1. Remove all console.log statements
2. Ensure API keys are secure
3. Set up monitoring for API usage
4. Configure rate limiting
5. Test on mobile devices
6. Verify GPS works on iOS/Android
7. Test with slow network conditions
8. Verify data privacy compliance

## Success Criteria

The milestone is complete when:
- ✅ Bite Button captures GPS and all ocean data
- ✅ Comprehensive bite report displays
- ✅ Vessel tracking shows real-time positions
- ✅ GFW integration provides commercial vessels
- ✅ Offline functionality works reliably
- ✅ All data syncs properly
- ✅ Performance meets requirements
- ✅ No mock data in production code