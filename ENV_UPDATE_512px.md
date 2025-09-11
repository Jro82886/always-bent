# UPDATE FOR HIGH-RES 512px TILES

## Update these in Vercel for better resolution:

```
CMEMS_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst&STYLE=cmap:thermal&FORMAT=image/png&TILEMATRIXSET=EPSG:3857@2x&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}

NEXT_PUBLIC_SST_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=SST_GLO_PHY_L4_NRT_010_043/cmems_obs-sst_glo_phy_nrt_l4_P1D-m_202303/analysed_sst&STYLE=cmap:thermal&FORMAT=image/png&TILEMATRIXSET=EPSG:3857@2x&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}

NEXT_PUBLIC_SST_TILESIZE=512
```

## Changes:
- `TILEMATRIXSET=EPSG:3857` → `TILEMATRIXSET=EPSG:3857@2x`
- `NEXT_PUBLIC_SST_TILESIZE=256` → `NEXT_PUBLIC_SST_TILESIZE=512`

This will give you 2x resolution for sharper imagery when zoomed in!
