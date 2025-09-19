// Test CHL Display - Run this in browser console on always-bent.vercel.app

console.log('=== Testing CHL Layer Display ===');

// 1. Check if CHL layer exists
const chlLayerExists = !!map.getLayer('chl-lyr');
console.log('CHL layer exists:', chlLayerExists);

// 2. If not, let's create it properly
if (!chlLayerExists) {
  console.log('Creating CHL layer...');
  
  // First add the source
  if (!map.getSource('chl-src')) {
    map.addSource('chl-src', {
      type: 'raster',
      tiles: ['/api/tiles/chl/{z}/{x}/{y}.png?time=latest'],
      tileSize: 256,
      attribution: '© Copernicus Marine Service'
    });
    console.log('✅ Added CHL source');
  }
  
  // Then add the layer
  map.addLayer({
    id: 'chl-lyr',
    type: 'raster',
    source: 'chl-src',
    minzoom: 0,
    maxzoom: 24,
    paint: {
      'raster-opacity': 0.85
    }
  });
  console.log('✅ Added CHL layer');
} else {
  // Layer exists, make sure it's visible
  map.setLayoutProperty('chl-lyr', 'visibility', 'visible');
  map.setPaintProperty('chl-lyr', 'raster-opacity', 0.85);
  console.log('✅ Made CHL layer visible');
}

// 3. Check layer order
const layers = map.getStyle().layers;
const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
console.log('CHL layer position:', chlIndex, 'out of', layers.length, 'layers');

// 4. Force refresh tiles
if (map.getSource('chl-src')) {
  const source = map.getSource('chl-src');
  source.setTiles([`/api/tiles/chl/{z}/{x}/{y}.png?time=latest&t=${Date.now()}`]);
  console.log('✅ Forced tile refresh');
}

// 5. Test a specific tile
console.log('\nTesting CHL tile directly...');
fetch('/api/tiles/chl/5/9/12?time=latest')
  .then(r => {
    console.log('Tile response:', r.status, r.statusText);
    return r.headers.get('content-type');
  })
  .then(contentType => {
    console.log('Content-Type:', contentType);
  });

// 6. Move to a known ocean location with good CHL data
console.log('\nMoving to productive waters off Cape Hatteras...');
map.flyTo({ 
  center: [-74.5, 36.5], 
  zoom: 7,
  duration: 2000 
});

console.log('\n✅ CHL layer should now be visible!');
console.log('If you see green/yellow colors, the chlorophyll is working!');
console.log('If not, check the Network tab for failed tile requests.');

