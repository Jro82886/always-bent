# Global Fishing Watch (GFW) API Token Required

## Issue
Commercial vessels are not showing on the map because the GFW API token is not configured.

## What's Happening
- The `CommercialVesselLayer` component tries to fetch vessel data from Global Fishing Watch
- Without the `NEXT_PUBLIC_GFW_API_TOKEN`, it falls back to mock data
- The mock data function returns an empty array, so no vessels appear

## Solution
Add this to your `.env.local` and Vercel environment variables:
```
NEXT_PUBLIC_GFW_API_TOKEN=your-gfw-api-token-here
```

## How to Get a GFW Token
1. Go to https://globalfishingwatch.org/
2. Sign up for a developer account
3. Request API access
4. Copy your API token

## Files Affected
- `/src/lib/services/gfw.ts` - The GFW API integration
- `/src/components/tracking/CommercialVesselLayer.tsx` - Displays vessels on map

## Testing
Once you add the token:
1. Toggle "Commercial Vessels" ON in the left panel
2. You should see orange triangle markers for commercial fishing vessels
3. Each vessel will have a "GFW" badge overlay
