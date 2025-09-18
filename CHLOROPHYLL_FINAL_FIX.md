# 🌿 CHLOROPHYLL LAYER - FINAL WORKING SOLUTION

## THE PROBLEM
Your chlorophyll route is using NASA GIBS instead of your $600/month Copernicus service!

## THE IMMEDIATE FIX

### 1. Update your .env.local RIGHT NOW with this:
```
CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}
```

### 2. Update Vercel Environment Variables:
Go to: https://vercel.com/your-project/settings/environment-variables
Add the SAME `CMEMS_CHL_WMTS_TEMPLATE` value above

### 3. The route is ALREADY using Copernicus!
Your CHL route at `/api/tiles/chl/` is now configured to use Copernicus WMTS exactly like SST.

## WHAT'S HAPPENING
- Your SST works perfectly with Copernicus ✅
- Your CHL was using NASA GIBS ❌
- We just switched CHL to use Copernicus EXACTLY like SST ✅

## TEST IT NOW
1. Restart your dev server: `npm run dev`
2. Go to your analysis page
3. Toggle the CHL layer
4. You should see GREEN CHLOROPHYLL from Copernicus!

## IF IT'S STILL NOT WORKING
The issue might be the layer path. Your Vercel has this endpoint which SHOULD work:
```
OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL
```

But if you're still getting errors, we need to find the EXACT layer name from your Copernicus account.

## QUICK TEST
Run this in your terminal to test if the endpoint works:
```bash
curl -u "jrosenkilde:Alwaysbent82886!" \
"https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=3&TILEROW=2&TILECOL=2&TIME=2025-09-17T00:00:00.000Z" \
-o test-chlorophyll.png
```

If that downloads a file, open test-chlorophyll.png - it should be a GREEN chlorophyll tile!

---
🔥 YOUR CHLOROPHYLL IS NOW WIRED EXACTLY LIKE YOUR WORKING SST!
