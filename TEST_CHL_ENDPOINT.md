# Test Chlorophyll Endpoint

Run this in your terminal to test if Copernicus CHL is working:

```bash
# Test with yesterday's date
curl -v "https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D_202311/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=5&TILEROW=12&TILECOL=11&TIME=2025-09-17T00:00:00.000Z" \
  -H "Authorization: Basic $(echo -n 'jrosenkilde:fevhuh-wuvmo2-mafFus' | base64)" \
  -o test-chl-tile.png
```

If this works and downloads a PNG file, then the issue is in our app.
If this fails with 400, then it's a Copernicus issue.

## Common Issues:

1. **Wrong date format** - Copernicus needs ISO8601 with milliseconds
2. **Data not available yet** - Try 2-3 days ago
3. **Wrong layer path** - The layer ID might have changed
4. **Authentication** - Credentials might be wrong

## Quick Fix in Console:

```javascript
// Force chlorophyll to use a specific date
const map = window.map || document.querySelector('canvas')._map;
if (map.getSource('chl-src')) {
  map.removeSource('chl-src');
}
map.addSource('chl-src', {
  type: 'raster',
  tiles: ['/api/tiles/chl/{z}/{x}/{y}?time=2025-09-15'],
  tileSize: 256
});
```
