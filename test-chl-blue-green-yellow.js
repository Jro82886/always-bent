// Complete CHL Blue-Green-Yellow Test
// Run this in browser console at always-bent.vercel.app

console.log('=== CHL Blue-Green-Yellow Layer Test ===');
console.log('Testing chlorophyll with proper ocean colors...\n');

// Step 1: Check current state
const hasLayer = !!map.getLayer('chl-lyr');
const hasSource = !!map.getSource('chl-src');
console.log('Current state:');
console.log('- CHL layer exists:', hasLayer);
console.log('- CHL source exists:', hasSource);

// Step 2: Clean slate - remove existing
if (hasLayer) {
  map.removeLayer('chl-lyr');
  console.log('✓ Removed existing layer');
}
if (hasSource) {
  map.removeSource('chl-src');
  console.log('✓ Removed existing source');
}

// Step 3: Test the API endpoint first
console.log('\n📡 Testing CHL API endpoint...');
fetch('/api/tiles/chl/5/9/12?time=latest')
  .then(r => {
    console.log('API Response:', r.status, r.statusText);
    console.log('Headers:', Object.fromEntries(r.headers.entries()));
    if (!r.ok) {
      return r.text().then(t => {
        console.error('❌ API Error:', t);
        console.log('\n⚠️  IMPORTANT: Add CMEMS_CHL_WMTS_TEMPLATE to Vercel!');
      });
    } else {
      console.log('✅ API endpoint is working!');
      return r.blob().then(b => console.log('Tile size:', b.size, 'bytes'));
    }
  });

// Step 4: Add the CHL layer with blue-green-yellow colors
setTimeout(() => {
  console.log('\n🎨 Adding CHL layer with blue-green-yellow colormap...');
  
  // Add source
  map.addSource('chl-src', {
    type: 'raster',
    tiles: ['/api/tiles/chl/{z}/{x}/{y}.png?time=latest'],
    tileSize: 256,
    attribution: '© Copernicus Marine Service'
  });
  console.log('✓ Added CHL source');

  // Add layer with optimal settings
  map.addLayer({
    id: 'chl-lyr',
    type: 'raster',
    source: 'chl-src',
    minzoom: 0,
    maxzoom: 24,
    paint: {
      'raster-opacity': 0.85,
      'raster-saturation': 0,
      'raster-contrast': 0,
      'raster-brightness-min': 0,
      'raster-brightness-max': 1
    }
  });
  console.log('✓ Added CHL layer');

  // Make sure it's visible
  map.setLayoutProperty('chl-lyr', 'visibility', 'visible');
  console.log('✓ Set layer to visible');

  // Check layer order
  const layers = map.getStyle().layers;
  const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
  console.log('✓ Layer position:', chlIndex, 'of', layers.length);

  // Step 5: Move to productive waters
  console.log('\n📍 Moving to Cape Hatteras (productive waters)...');
  map.flyTo({ 
    center: [-75.5, 35.5], 
    zoom: 7,
    duration: 2000 
  });

  console.log('\n✅ CHL TEST COMPLETE!');
  console.log('\n🎨 Color Guide:');
  console.log('  🔵 BLUE = Low chlorophyll (open ocean)');
  console.log('  🟢 GREEN = Medium-high chlorophyll (productive waters)');
  console.log('  🟡 YELLOW = Highest chlorophyll (plankton blooms)');
  console.log('\n🐟 Fish hang out in the GREEN and YELLOW areas!');
  
  // Step 6: Toggle test
  console.log('\n🔄 Toggle CHL on/off with:');
  console.log('  ON:  map.setLayoutProperty("chl-lyr", "visibility", "visible")');
  console.log('  OFF: map.setLayoutProperty("chl-lyr", "visibility", "none")');
  
}, 1000);

// Step 7: Debug helper
console.log('\n🔧 Debug commands:');
console.log('- Check visibility: map.getLayoutProperty("chl-lyr", "visibility")');
console.log('- Check opacity: map.getPaintProperty("chl-lyr", "raster-opacity")');
console.log('- Force refresh: map.getSource("chl-src").setTiles(["/api/tiles/chl/{z}/{x}/{y}.png?time=latest&t=" + Date.now()])');
