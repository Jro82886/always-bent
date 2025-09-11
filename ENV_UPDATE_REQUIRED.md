# Environment Variables Update Required

## UPDATE THESE IN VERCEL IMMEDIATELY:

### SST Configuration (WORKING VALUES)
```
CMEMS_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst&STYLE=cmap:thermal&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}

NEXT_PUBLIC_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst&STYLE=cmap:thermal&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}

NEXT_PUBLIC_SST_TILESIZE=256
```

### Keep These As-Is
```
COPERNICUS_USER=(your username)
COPERNICUS_PASS=(your password)
```

## CRITICAL CHANGES FROM PREVIOUS CONFIG:

1. **Base URL**: `/teroWmts` NOT `/teroWmts/SST_GLO_PHY_L4_NRT_010_043`
2. **Layer**: Full path `SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst`
3. **TileMatrixSet**: `EPSG:3857` NOT `GoogleMapsCompatible`
4. **Style**: `cmap:thermal` (their default colormap)
5. **TIME placeholder**: Using `{TIME}` uppercase for consistency

## VERIFIED WORKING URL:
```
https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst&STYLE=cmap:thermal&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=5&TILEROW=12&TILECOL=9&TIME=2025-09-10T00:00:00.000Z
```

Returns: HTTP 200 with image/png

## After updating Vercel env:
1. Trigger a new deployment
2. Clear browser cache
3. Test at /legendary
# SST Working! 🌊
