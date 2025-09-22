# Vercel Environment Variables Setup

## Required Environment Variables

Add these to your Vercel project settings → Environment Variables:

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://hobvjmmambhonsugehge.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your anon key - get from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Your service role key - regenerate after testing!]
DATABASE_URL=[Your database URL from Supabase]
```

### 2. Global Fishing Watch
```
GFW_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJBbHdheXMgQmVudCBGaXNoaW5nIEludGVsbGlnZW5jZSIsInVzZXJJZCI6NDk3NDUsImFwcGxpY2F0aW9uTmFtZSI6IkFsd2F5cyBCZW50IEZpc2hpbmcgSW50ZWxsaWdlbmNlIiwiaWQiOjMyNjgsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzg3NjgwNSwiZXhwIjoyMDczMjM2ODA1LCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.Zx5RG1whprsmiDWNR9Bc7bf19zsbJ2CRRVACzXRpLJGaI2VniIHR2BDYK2jdnt2pnrMEu6KUApjuyXgxqBMYmdpgBjTLI8C9T-Yz0eoPJ_p9Ocjiqh_LE4LFlFO9ujgwFoVY29smwHiLQlaWdyPPAyeIPnr2RY9ictDVa1WErSoZDEXb_yO2g6BHOCOms0leE9-x_OHSI47bL5endkEq84Jd-CFcNYt6ykdwGyfUG_uY2dnn3keoSSZ0PwI_aL4nXK3TBAIYojeiH_mucV4mPSrzjl-ThVGI0gixFsf_yY0vi_1-OeyB8KPPigK5TcqLP7C_n2QJwN1qFDQTWqB6DtoChgnuo7y95MGbtT3Wqa4n3zHg95s-nr_NDJV0al434WkLDJWFsACTM6-QIAdjTKtRgeTPcEzliRb_d2mETIHanFAABB0RImrioWClV_ieyiAxwCBDeDhWmz8aH-Yv1ZkOixP6-uhEmrLKPQdmxqqEHdJ6WUR9t4ppZAdRf7Jd
```

### 3. Other Required Variables
```
NEXT_PUBLIC_MAPBOX_TOKEN=[Your Mapbox token]
STORMGLASS_API_KEY=[Your StormGlass API key for weather]
```

### 4. Optional Variables
```
# Copernicus for SST/CHL
COPERNICUS_USER=[If you have Copernicus account]
COPERNICUS_PASS=[If you have Copernicus account]

# Feature Flags
NEXT_PUBLIC_FLAG_REPORTS_CONTRACT=true
NEXT_PUBLIC_FLAG_COMMUNITY_CHAT_DRAWER=true
NEXT_PUBLIC_FLAG_USER_LOCATION_RESTRICT_TO_INLET=false
```

## Setup Steps

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable above
4. Click "Save"
5. Redeploy your project

## Database Setup

Run the SQL in `setup-fleet-database.sql` in your Supabase SQL editor to create the necessary views for fleet tracking.

## Security Notes

⚠️ **IMPORTANT**: After testing, regenerate the Supabase service role key for production use!
