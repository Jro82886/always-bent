# Force Chlorophyll Visible - Console Commands

Run these in your browser console:

```javascript
// 1. Check if CHL layer exists
const map = window.map || document.querySelector('canvas')._map;
console.log('CHL layer exists:', !!map.getLayer('chl-lyr'));
console.log('CHL source exists:', !!map.getSource('chl-src'));

// 2. Force CHL visible with enhancement
(() => {
  const map = window.map || document.querySelector('canvas')._map;
  
  // Remove and re-add to ensure fresh start
  if (map.getLayer('chl-lyr')) map.removeLayer('chl-lyr');
  if (map.getSource('chl-src')) map.removeSource('chl-src');
  
  // Add fresh with latest time
  map.addSource('chl-src', {
    type: 'raster',
    tiles: ['/api/tiles/chl/{z}/{x}/{y}?time=latest'],
    tileSize: 256
  });
  
  map.addLayer({
    id: 'chl-lyr',
    type: 'raster',
    source: 'chl-src',
    paint: {
      'raster-opacity': 1,
      'raster-saturation': 0.5,
      'raster-hue-rotate': 20,
      'raster-contrast': 0.3,
      'raster-brightness-min': 0.1,
      'raster-brightness-max': 0.9
    }
  });
  
  // Move to top
  map.moveLayer('chl-lyr');
  console.log('✅ CHL forced visible with green enhancement');
})();

// 3. Check network tab
console.log('Now check Network tab for /api/tiles/chl/ requests');
console.log('Should see 200 status codes if working');
```

## If CHL still not showing:

Try with a specific date that definitely has data:
```javascript
// Force September 15th data
(() => {
  const map = window.map || document.querySelector('canvas')._map;
  if (map.getSource('chl-src')) {
    map.removeSource('chl-src');
  }
  map.addSource('chl-src', {
    type: 'raster',
    tiles: ['/api/tiles/chl/{z}/{x}/{y}?time=2025-09-15'],
    tileSize: 256
  });
  console.log('✅ Using Sept 15th data');
})();
```
