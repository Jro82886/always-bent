# Configuration Guide

## Environment Variables

### Client-Side Feature Flags

These variables control frontend behavior and are safe to expose in the browser:

- **`NEXT_PUBLIC_CHAT_MOCK`** (default: `0`)
  - `0` = Use real Supabase for chat messages and presence
  - `1` = Use mock data for demo/testing (no backend required)
  
- **`NEXT_PUBLIC_REPORTS_MOCK`** (default: `0`)
  - `0` = Fetch real reports highlights from Supabase
  - `1` = Show mock highlights for demo purposes

- **`NEXT_PUBLIC_DEMO_FORCE_INLET`** (default: `0`)
  - `0` = Normal inlet selection behavior
  - `1` = Always use default inlet (Ocean City, MD) for demo
  - Prevents crashes when no inlet is selected
  
- **`NEXT_PUBLIC_DEMO_DEFAULT_INLET`** (default: `md-ocean-city`)
  - The inlet ID to use when demo mode is enabled
  - Only applies when `NEXT_PUBLIC_DEMO_FORCE_INLET=1`

### Server-Side Configuration

These secrets must be kept secure and are only available in API routes:

- **`COPERNICUS_USER`** / **`COPERNICUS_PASS`**
  - Required for fetching SST/CHL ocean data from Copernicus WMTS
  - Get credentials at: https://marine.copernicus.eu
  
- **`STORMGLASS_API_KEY`**
  - Required for weather, tides, and astronomy data
  - Get API key at: https://stormglass.io

- **`SUPABASE_SERVICE_ROLE_KEY`**
  - Server-side admin key for Supabase operations
  - Never expose this in client code

### Database & Services

- **`DATABASE_URL`**
  - PostgreSQL connection string (usually provided by Supabase)
  
- **`NEXT_PUBLIC_SUPABASE_URL`** / **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
  - Public Supabase credentials for client-side operations
  
- **`NEXT_PUBLIC_MAPBOX_TOKEN`**
  - Mapbox GL JS access token for map rendering

## Feature Flag Usage

### Enabling Mock Mode (Development)

```bash
# Full mock mode for local development
NEXT_PUBLIC_CHAT_MOCK=1
NEXT_PUBLIC_REPORTS_MOCK=1
```

### Production Mode

```bash
# Real data mode (default)
NEXT_PUBLIC_CHAT_MOCK=0
NEXT_PUBLIC_REPORTS_MOCK=0
```

## Deployment Checklist

1. **Verify all server secrets** are set in Vercel/deployment platform
2. **Set feature flags** appropriately (usually all `0` for production)
3. **Test Copernicus auth** with: `curl -u $COPERNICUS_USER:$COPERNICUS_PASS [WMTS_URL]`
4. **Verify Supabase connection** in Community and Reports sections
5. **Check Mapbox token** is valid and has proper scopes
