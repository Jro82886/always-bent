# Ocean Data (SST/CHL) Status Report

## Current Status: ✅ Working via Proxy

The SST (Sea Surface Temperature) and CHL (Chlorophyll) layers are configured to work through proxy endpoints that handle:
- Authentication with Copernicus Marine Service
- Date fallback (tries yesterday, then 2 days ago)
- Proper time formatting (ISO8601 with milliseconds)

## How It Works

1. **Frontend requests tiles from proxy:**
   - SST: `/api/tiles/sst/{z}/{x}/{y}.png?time=latest`
   - CHL: `/api/tiles/chl/{z}/{x}/{y}.png?time=latest`

2. **Proxy handles authentication:**
   - Uses `COPERNICUS_USER` and `COPERNICUS_PASS` from server environment
   - Adds Basic Auth header to upstream requests

3. **Proxy handles time formatting:**
   - Converts dates to ISO8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
   - Defaults to yesterday's data (most recent available)
   - Falls back to 2 days ago if yesterday fails

## Environment Variables

### Required in Vercel (Server-side):
```
COPERNICUS_USER=jro82886
COPERNICUS_PASS=Jro!0788
CMEMS_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m--DEPTH-0.49402499198913574m/{TIME}/{z}/{x}/{y}.png
CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts/OCEANCOLOUR_ATL_BGC_L4_MY_009_118/cmems_obs-oc_atl_bgc-plankton_my_l4-multi-1km_P1D/CHL-SURF/{TIME}/{z}/{x}/{y}.png
```

### Optional (for direct WMTS access):
```
NEXT_PUBLIC_SST_WMTS_TEMPLATE=(same as CMEMS_SST_WMTS_TEMPLATE)
NEXT_PUBLIC_CHL_WMTS_TEMPLATE=(same as CMEMS_CHL_WMTS_TEMPLATE)
```

**Note:** The `NEXT_PUBLIC_*` variables would allow direct access from the browser but:
1. Would expose credentials in the browser (security risk)
2. Require a rebuild to take effect
3. The proxy approach is more secure and reliable

## Data Availability

- **Update Schedule:** Daily products update around 00:00 UTC
- **Lag Time:** Data is typically 1-2 days behind real-time
- **Coverage:** Global for SST, Atlantic for CHL

## Troubleshooting

If tiles aren't loading:

1. **Check proxy endpoints:**
   ```javascript
   // In browser console:
   fetch('/api/tiles/sst/7/36/48.png?time=latest')
     .then(r => console.log('SST:', r.status))
   
   fetch('/api/tiles/chl/7/36/48.png?time=latest')  
     .then(r => console.log('CHL:', r.status))
   ```

2. **Verify environment variables in Vercel:**
   - All 4 variables listed above must be set
   - No quotes around values
   - Correct username/password

3. **Check browser Network tab:**
   - Look for tile requests
   - Should see 200 OK responses
   - 404 means wrong date or coordinates
   - 401/403 means auth issues

## Current Implementation

✅ **Working:**
- Proxy endpoints handle all authentication
- Automatic date fallback
- Proper time formatting
- Both SST and CHL layers display correctly

⚠️ **Note:**
- The code attempts to use direct WMTS if `NEXT_PUBLIC_*` variables are set
- Falls back to proxy if not available
- Proxy is the recommended approach for security

## Next Steps

No action needed - the ocean data layers are working correctly through the secure proxy endpoints. The system is designed to handle authentication server-side, which is the best practice.
