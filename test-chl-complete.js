// Complete CHL diagnostic and fix
(function() {
  const m = window.abfiMap || window.map;
  
  if (!m) {
    console.log('❌ Map not found');
    return;
  }
  
  console.log('=== CHL Complete Diagnostic ===');
  
  // 1. Check if CHL source and layer exist
  const source = m.getSource('chl-src');
  const layer = m.getLayer('chl-lyr');
  
  console.log('CHL source exists:', !!source);
  console.log('CHL layer exists:', !!layer);
  
  if (!source || !layer) {
    console.log('❌ CHL not properly initialized. Try toggling the CHL button.');
    return;
  }
  
  // 2. Check current properties
  console.log('\n=== Current Properties ===');
  console.log('Visibility:', m.getLayoutProperty('chl-lyr', 'visibility'));
  console.log('Opacity:', m.getPaintProperty('chl-lyr', 'raster-opacity'));
  
  // 3. Check tile URL
  console.log('\n=== Tile Configuration ===');
  if (source.tiles && source.tiles.length > 0) {
    console.log('Tile URL:', source.tiles[0]);
    
    // Parse the URL to check parameters
    const url = source.tiles[0];
    console.log('Has time parameter:', url.includes('time='));
    console.log('Full URL parts:', url.split('?'));
  }
  
  // 4. Force visibility and optimal settings
  console.log('\n=== Applying Fixes ===');
  
  // Set visibility
  m.setLayoutProperty('chl-lyr', 'visibility', 'visible');
  console.log('✅ Set visibility to visible');
  
  // Set full opacity
  m.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  console.log('✅ Set opacity to 100%');
  
  // Reset all paint properties to defaults
  m.setPaintProperty('chl-lyr', 'raster-saturation', 0);
  m.setPaintProperty('chl-lyr', 'raster-contrast', 0);
  m.setPaintProperty('chl-lyr', 'raster-brightness-min', 0);
  m.setPaintProperty('chl-lyr', 'raster-brightness-max', 1);
  m.setPaintProperty('chl-lyr', 'raster-hue-rotate', 0);
  console.log('✅ Reset all paint properties');
  
  // 5. Check layer order
  const layers = m.getStyle().layers;
  const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
  console.log(`\n=== Layer Order ===`);
  console.log(`CHL position: ${chlIndex} of ${layers.length}`);
  
  // Find what's above and below
  if (chlIndex > 0) {
    console.log('Layer below CHL:', layers[chlIndex - 1].id);
  }
  if (chlIndex < layers.length - 1) {
    console.log('Layer above CHL:', layers[chlIndex + 1].id);
  }
  
  // 6. Move to a good position (above water, below labels)
  const waterLayer = layers.find(l => l.id === 'water' || (l.id.includes('water') && l.type === 'fill'));
  const firstLabel = layers.find(l => l.type === 'symbol' || l.id.includes('label'));
  
  if (firstLabel) {
    m.moveLayer('chl-lyr', firstLabel.id);
    console.log(`✅ Moved CHL below labels (${firstLabel.id})`);
  } else {
    // Move to near top
    const topLayer = layers[layers.length - 1];
    m.moveLayer('chl-lyr', topLayer.id);
    console.log(`✅ Moved CHL near top`);
  }
  
  // 7. Force a repaint
  m.triggerRepaint();
  console.log('\n✅ Map repainted');
  
  // 8. Test tile loading
  console.log('\n=== Testing Tile Loading ===');
  const handleData = (e) => {
    if (e.sourceId === 'chl-src') {
      console.log('CHL tile event:', e.tile ? 'Tile loaded' : 'Source updated');
    }
  };
  
  const handleError = (e) => {
    if (e.sourceId === 'chl-src') {
      console.error('CHL tile error:', e.error);
    }
  };
  
  m.once('data', handleData);
  m.once('error', handleError);
  
  // 9. Check bounds
  const bounds = m.getBounds();
  console.log('\n=== Current View ===');
  console.log('Center:', m.getCenter());
  console.log('Zoom:', m.getZoom());
  console.log('Bounds:', bounds.toString());
  
  console.log('\n🔍 CHL diagnostic complete. Layer should be visible now.');
  console.log('If still not visible, check:');
  console.log('1. Network tab for tile requests (should see /api/tiles/chl/...)');
  console.log('2. Console for any 404/500 errors');
  console.log('3. Try changing the date selector');
})();
