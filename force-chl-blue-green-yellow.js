// Force CHL to display with Blue-Green-Yellow colors
// Run this in browser console at always-bent.vercel.app

console.log('=== Forcing CHL Blue-Green-Yellow Display ===');

// Remove existing CHL layer if present
if (map.getLayer('chl-lyr')) {
  map.removeLayer('chl-lyr');
  console.log('Removed existing CHL layer');
}
if (map.getSource('chl-src')) {
  map.removeSource('chl-src');
  console.log('Removed existing CHL source');
}

// Add CHL source with style parameter for blue-green-yellow
map.addSource('chl-src', {
  type: 'raster',
  tiles: ['/api/tiles/chl/{z}/{x}/{y}.png?time=latest&style=jet'],
  tileSize: 256,
  attribution: '© Copernicus Marine Service'
});

// Add the layer with good visibility
map.addLayer({
  id: 'chl-lyr',
  type: 'raster',
  source: 'chl-src',
  minzoom: 0,
  maxzoom: 24,
  paint: {
    'raster-opacity': 0.85,
    'raster-saturation': 0.2,  // Slight saturation boost
    'raster-contrast': 0.1     // Slight contrast boost
  }
});

console.log('✅ Added CHL layer with blue-green-yellow colormap');

// Make sure it's visible
map.setLayoutProperty('chl-lyr', 'visibility', 'visible');

// Move to a good test location
map.flyTo({ 
  center: [-74.5, 36.5],  // Off Cape Hatteras - productive waters
  zoom: 7,
  duration: 2000 
});

console.log('\n✅ CHL layer configured for blue-green-yellow display!');
console.log('Blue = Low chlorophyll (open ocean)');
console.log('Green = Medium chlorophyll');  
console.log('Yellow = High chlorophyll (productive waters)');

// Test the endpoint
fetch('/api/tiles/chl/5/9/12?time=latest&style=jet')
  .then(r => {
    console.log('\nTile test:', r.status, r.statusText);
    if (!r.ok) {
      return r.text().then(t => console.error('Error:', t));
    }
    return r.blob();
  })
  .then(blob => {
    if (blob && blob.size > 1000) {
      console.log('✅ Tile loaded successfully, size:', blob.size, 'bytes');
    }
  });
