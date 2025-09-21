# 🔍 Vercel Environment Variables Check

## Required Environment Variables

Please ensure these are set in your Vercel project settings:

### 1. **Critical for App Function**
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYWx3YXlzYmVudCIsImEiOiJjbTJqeWJhcGUwZnppMmtzNjJtcDN6bnFnIn0.U7aqDmXmN1gvk-0VcpHnog
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmfpavrtq00zb0wws6asv8xf3
```

### 2. **Database & Backend**
```
NEXT_PUBLIC_SUPABASE_URL=https://zspnmxnhclhxusmqyxmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
DATABASE_URL=[Your Database URL]
```

### 3. **Ocean Data Services**
```
NEXT_PUBLIC_POLYGONS_URL=[Your Polygons Backend URL]
NEXT_PUBLIC_SST_TILES_URL=[SST Tiles URL]
NEXT_PUBLIC_CHL_TILES_URL=[Chlorophyll Tiles URL]
```

### 4. **Copernicus Credentials** (for GitHub Actions)
```
COPERNICUS_USER=[Your Username]
COPERNICUS_PASS=[Your Password]
```

## How to Add in Vercel:

1. Go to: https://vercel.com/[your-team]/always-bent/settings/environment-variables
2. Add each variable
3. Select all environments (Production, Preview, Development)
4. Click "Save"

## Most Common Issue:

The client-side error is usually because `NEXT_PUBLIC_MAPBOX_TOKEN` is missing or incorrect.

## Quick Test:

Visit: https://always-bent-ldunjunxa-jro82886s-projects.vercel.app/api/health

This should show which services are configured correctly.
