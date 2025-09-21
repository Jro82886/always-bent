# 🚀 Quick Vercel Environment Setup

## Copy & Paste These Into Vercel:

### Required Variables:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYWx3YXlzYmVudCIsImEiOiJjbTJqeWJhcGUwZnppMmtzNjJtcDN6bnFnIn0.U7aqDmXmN1gvk-0VcpHnog
NEXT_PUBLIC_MEMBERSTACK_APP_ID=app_cmfpavrtq00zb0wws6asv8xf3
NEXT_PUBLIC_SUPABASE_URL=https://hobvjmmambhonsugehge.supabase.co
```

### If You Have Them:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key from Supabase Dashboard]
NEXT_PUBLIC_POLYGONS_URL=[Your Backend URL if deployed]
DATABASE_URL=[Your Supabase Database URL]
```

## Steps:
1. Go to: https://vercel.com/[your-username]/always-bent/settings/environment-variables
2. Click "Add New"
3. Paste each line above as:
   - Key: NEXT_PUBLIC_MAPBOX_TOKEN
   - Value: pk.eyJ1Ijoiα...
4. Select all environments (Production, Preview, Development)
5. Click "Save"

## After Adding:
Vercel will automatically redeploy your app with the new variables!
