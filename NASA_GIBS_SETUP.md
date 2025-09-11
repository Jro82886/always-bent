# NASA GIBS SST Setup Guide

## Environment Variables (.env.local)

```bash
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_MAPBOX_TOKEN

# NASA GIBS SST
ABFI_SST_TILE_BASE=https://gibs.earthdata.nasa.gov/wmts/epsg3857/best
ABFI_SST_TILE_LAYER=MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily
# Alternative daytime layer:
# ABFI_SST_TILE_LAYER=MODIS_Aqua_L3_SST_Thermal_4km_Day_Daily
ABFI_SST_TILE_MATRIX=GoogleMapsCompatible_Level9
ABFI_SST_DEFAULT_TIME=today

# Copernicus (for other ocean data if needed)
# COPERNICUS_USER=your_username
# COPERNICUS_PASS=your_password
```

## Features Implemented

### ✅ Complete NASA GIBS Integration
- **Proxy Route**: `/api/tiles/sst/[z]/[x]/[y]/route.ts`
- **Time Resolution**: Auto-fallback (today → yesterday → 2 days ago)
- **Error Handling**: Comprehensive safeguards and monitoring
- **Visual Feedback**: Connection status and legend badges

### ✅ Auto-Fallback System
- **Smart Detection**: Probes tiles to find the latest available data
- **User Feedback**: Shows "(yesterday)" or "(2 days ago)" badges
- **Reliability**: Always shows something, never blank

### ✅ Safety Guardrails
- **Layer Validation**: Checks existence before manipulation
- **Error Recovery**: Graceful fallbacks on failures
- **Connection Monitoring**: Real-time status updates
- **Opacity Controls**: Range validation and error handling

### ✅ Attribution Compliance
- **NASA Requirements**: Proper credit for GIBS data
- **ESRI Attribution**: For ocean basemap data

## Usage

1. **Environment Setup**: Copy variables to `.env.local`
2. **Auto-Resolution**: SST automatically finds latest available data
3. **Visual Indicators**: Status badges show data age
4. **Error Resilience**: System handles network issues gracefully

## Technical Details

- **Coordinate System**: EPSG:3857 (Web Mercator)
- **Tile Matrix**: GoogleMapsCompatible_Level9 (9 zoom levels)
- **Data Source**: MODIS Aqua L3 SST Thermal 4km Night Daily
- **Update Frequency**: Daily composites
- **Fallback Chain**: today → -1d → -2d (3-day window)

## Debugging

- **Console Logs**: Monitor tile loading and auto-resolution
- **Network Tab**: Check tile requests to `/api/tiles/sst/`
- **Status Indicator**: Visual feedback on connection health
- **Legend Badge**: Shows which date's data is displayed
