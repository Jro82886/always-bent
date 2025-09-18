# Debug Chlorophyll Tiles

## 1. Check Network Tab
Open DevTools > Network tab and filter by "chl"
- Are CHL tiles returning 200 status?
- Click on a tile request - what's the response?

## 2. Console Commands to Force Visibility

Run these in browser console:

```javascript
// Check if layer exists
console.log('CHL Layer exists:', !!map.getLayer('chl-lyr'));
console.log('CHL Source exists:', !!map.getSource('chl-src'));

// Force maximum visibility
if (map.getLayer('chl-lyr')) {
  map.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  map.setPaintProperty('chl-lyr', 'raster-saturation', 0.5);
  map.setPaintProperty('chl-lyr', 'raster-contrast', 0.5);
  map.setPaintProperty('chl-lyr', 'raster-brightness-min', 0);
  map.setPaintProperty('chl-lyr', 'raster-brightness-max', 1);
  map.setPaintProperty('chl-lyr', 'raster-hue-rotate', 30);
  console.log('CHL visibility maximized!');
}

// Check layer order
const layers = map.getStyle().layers;
const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
const landIndex = layers.findIndex(l => l.id.includes('land'));
console.log('CHL layer index:', chlIndex);
console.log('Land layer index:', landIndex);
console.log('CHL should be below land:', chlIndex < landIndex);
```

## 3. Test Direct Tile URL

```bash
# Test a CHL tile directly
curl -I "http://localhost:3000/api/tiles/chl/5/9/12?time=latest"
```

## 4. Check Environment Variables

```javascript
// In browser console
fetch('/api/tiles/chl/5/9/12?time=latest')
  .then(r => {
    console.log('Status:', r.status);
    return r.text();
  })
  .then(text => {
    if (text.includes('not configured')) {
      console.error('CMEMS_CHL_WMTS_TEMPLATE not set!');
    } else {
      console.log('Response:', text.substring(0, 100));
    }
  });
```
