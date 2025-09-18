# 🔐 ABFI Environment Variables - Best Practices

## Current Working Configuration

### Chlorophyll Layer (CONFIRMED WORKING)
```bash
CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D_202311/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}
```

### Copernicus Credentials (CONFIRMED WORKING)
```bash
COPERNICUS_USER=jrosenkilde
COPERNICUS_PASS=fevhuh-wuvmo2-mafFus
```

## Best Practices Implementation

### 1. Local Development (.env.local)
- Never commit .env.local to git
- Use the setup-env.sh script to manage variables
- Run `npm run validate-env` to check configuration

### 2. Production (Vercel)
- Set all variables in Vercel Dashboard
- Use the same values as local
- Enable "Automatically expose System Environment Variables"

### 3. Environment Validation
```javascript
// src/lib/config/environment.ts
// ✅ Centralized configuration with validation
// ✅ Type-safe access to environment variables
// ✅ Runtime validation of required variables
```

### 4. Security Best Practices
- ✅ Never hardcode credentials in source code
- ✅ Use environment-specific variables
- ✅ Validate variables at startup
- ✅ Use NEXT_PUBLIC_ prefix only for client-side variables

## Complete Variable List

### Ocean Data (Copernicus)
- `COPERNICUS_USER` - Your Copernicus username
- `COPERNICUS_PASS` - Your Copernicus password
- `CMEMS_SST_WMTS_TEMPLATE` - SST layer endpoint
- `CMEMS_CHL_WMTS_TEMPLATE` - Chlorophyll layer endpoint

### Map Services
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token

### Database (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)
- `DATABASE_URL` - PostgreSQL connection string

## Quick Setup Commands

```bash
# 1. Run the setup script
./setup-env.sh

# 2. Validate your environment
npm run validate-env

# 3. Start development
npm run dev
```

## Troubleshooting

### Chlorophyll not showing?
1. Check `CMEMS_CHL_WMTS_TEMPLATE` is set
2. Verify credentials with: `npm run validate-env`
3. Check browser console for 502 errors
4. Ensure Vercel has the same variables

### 502 Errors on tiles?
- Missing environment variables
- Wrong credentials
- Copernicus service temporarily down

## Architecture Benefits

This setup provides:
- ✅ Single source of truth for configuration
- ✅ Easy environment switching
- ✅ Secure credential management
- ✅ Runtime validation
- ✅ Type safety with TypeScript
