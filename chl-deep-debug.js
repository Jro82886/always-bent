// DEEP CHLOROPHYLL DEBUG - Run this entire block

console.log('=== DEEP CHL DEBUG ===');

// 1. Check current layer properties
if (map.getLayer('chl-lyr')) {
  console.log('1. Current CHL paint properties:');
  const props = ['raster-opacity', 'raster-saturation', 'raster-contrast', 
                 'raster-brightness-min', 'raster-brightness-max', 'raster-hue-rotate'];
  props.forEach(prop => {
    console.log(`   ${prop}:`, map.getPaintProperty('chl-lyr', prop));
  });
  
  console.log('\n2. Layer visibility:', map.getLayoutProperty('chl-lyr', 'visibility'));
}

// 2. List ALL layers in order
console.log('\n3. ALL LAYERS (top to bottom):');
const layers = map.getStyle().layers;
layers.reverse().forEach((layer, i) => {
  const isChl = layer.id === 'chl-lyr';
  const isSst = layer.id === 'sst-lyr';
  console.log(`   ${i}: ${layer.id} (${layer.type})${isChl ? ' <-- CHL HERE' : ''}${isSst ? ' <-- SST HERE' : ''}`);
});

// 3. Test with EXTREME visibility
console.log('\n4. Applying EXTREME visibility settings...');
if (map.getLayer('chl-lyr')) {
  // Remove any opacity
  map.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  // Extreme saturation
  map.setPaintProperty('chl-lyr', 'raster-saturation', 2);
  // High contrast
  map.setPaintProperty('chl-lyr', 'raster-contrast', 1);
  // Full brightness range
  map.setPaintProperty('chl-lyr', 'raster-brightness-min', 0);
  map.setPaintProperty('chl-lyr', 'raster-brightness-max', 1);
  // Green hue
  map.setPaintProperty('chl-lyr', 'raster-hue-rotate', 60);
  
  // Force visible
  map.setLayoutProperty('chl-lyr', 'visibility', 'visible');
  
  console.log('   ✅ Extreme settings applied');
}

// 4. Check bounds
console.log('\n5. Checking map bounds vs tile coverage:');
const bounds = map.getBounds();
const zoom = map.getZoom();
console.log('   Current bounds:', bounds.toString());
console.log('   Current zoom:', zoom);
console.log('   Center:', map.getCenter());

// 5. Try to force a specific tile to load
console.log('\n6. Testing tile in current view...');
const center = map.getCenter();
const tile = map.project(center);
const tileX = Math.floor(tile.x / 256);
const tileY = Math.floor(tile.y / 256);
const tileZ = Math.floor(zoom);

fetch(`/api/tiles/chl/${tileZ}/${tileX}/${tileY}?time=latest`)
  .then(r => {
    console.log(`   Tile ${tileZ}/${tileX}/${tileY} status:`, r.status);
    return r.blob();
  })
  .then(blob => {
    // Display this tile on screen
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid lime;width:256px;height:256px;';
    img.src = url;
    img.title = 'CHL tile from your current view - click to remove';
    img.onclick = () => { img.remove(); URL.revokeObjectURL(url); };
    document.body.appendChild(img);
    console.log('   ✅ Tile displayed in bottom-right corner (green border)');
  });

// 6. Check if maybe it's a Mapbox style issue
console.log('\n7. Current Mapbox style:', map.getStyle().name || 'custom');

// 7. Test by creating a completely new layer at the very top
console.log('\n8. Creating test layer at absolute top...');
if (map.getLayer('chl-test')) map.removeLayer('chl-test');
if (map.getSource('chl-test')) map.removeSource('chl-test');

map.addSource('chl-test', {
  type: 'raster',
  tiles: ['/api/tiles/chl/{z}/{x}/{y}?time=latest'],
  tileSize: 256
});

map.addLayer({
  id: 'chl-test',
  type: 'raster',
  source: 'chl-test',
  paint: {
    'raster-opacity': 1,
    'raster-saturation': 2,
    'raster-contrast': 1,
    'raster-hue-rotate': 45
  }
});

// Move to absolute top
const topLayer = layers[0]; // Already reversed, so 0 is top
if (topLayer) {
  map.moveLayer('chl-test', topLayer.id);
}
console.log('   ✅ Test layer added at very top');

console.log('\n=== END DEBUG ===');
console.log('Check bottom-right corner for a sample CHL tile with green border');
console.log('If you see the tile there but not on map, it\'s a layer ordering issue');
