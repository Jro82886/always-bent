// Full CHL diagnostic - compare with SST which we know works
(function() {
  const m = window.abfiMap || window.map;
  if (!m) {
    console.log('❌ No map found');
    return;
  }

  console.log('=== FULL CHL DIAGNOSTIC ===');
  
  // 1. Compare SST (working) with CHL
  console.log('\n--- Layer Comparison ---');
  const sstLayer = m.getLayer('sst-lyr');
  const chlLayer = m.getLayer('chl-lyr');
  const sstSource = m.getSource('sst-src');
  const chlSource = m.getSource('chl-src');
  
  console.log('SST layer exists:', !!sstLayer, '| CHL layer exists:', !!chlLayer);
  console.log('SST source exists:', !!sstSource, '| CHL source exists:', !!chlSource);
  
  if (sstLayer) {
    console.log('\nSST Properties:');
    console.log('- Visibility:', m.getLayoutProperty('sst-lyr', 'visibility'));
    console.log('- Opacity:', m.getPaintProperty('sst-lyr', 'raster-opacity'));
    console.log('- Type:', sstLayer.type);
  }
  
  if (chlLayer) {
    console.log('\nCHL Properties:');
    console.log('- Visibility:', m.getLayoutProperty('chl-lyr', 'visibility'));
    console.log('- Opacity:', m.getPaintProperty('chl-lyr', 'raster-opacity'));
    console.log('- Type:', chlLayer.type);
    console.log('- Saturation:', m.getPaintProperty('chl-lyr', 'raster-saturation'));
    console.log('- Contrast:', m.getPaintProperty('chl-lyr', 'raster-contrast'));
    console.log('- Brightness Min:', m.getPaintProperty('chl-lyr', 'raster-brightness-min'));
    console.log('- Brightness Max:', m.getPaintProperty('chl-lyr', 'raster-brightness-max'));
    console.log('- Hue Rotate:', m.getPaintProperty('chl-lyr', 'raster-hue-rotate'));
  }
  
  // 2. Check tile URLs
  console.log('\n--- Tile URLs ---');
  if (sstSource && sstSource.tiles) {
    console.log('SST tile URL:', sstSource.tiles[0]);
  }
  if (chlSource && chlSource.tiles) {
    console.log('CHL tile URL:', chlSource.tiles[0]);
    // Check if it has viridis in the style param
    const url = chlSource.tiles[0];
    if (url.includes('style=')) {
      console.log('CHL style param:', url.match(/style=([^&]*)/)?.[1] || 'not found');
    }
  }
  
  // 3. Layer ordering
  console.log('\n--- Layer Order ---');
  const layers = m.getStyle().layers;
  const sstIndex = layers.findIndex(l => l.id === 'sst-lyr');
  const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
  const waterIndex = layers.findIndex(l => l.id === 'water');
  
  console.log(`SST position: ${sstIndex}/${layers.length}`);
  console.log(`CHL position: ${chlIndex}/${layers.length}`);
  console.log(`Water position: ${waterIndex}/${layers.length}`);
  
  // Show what's around CHL
  if (chlIndex >= 0) {
    console.log('\nLayers around CHL:');
    if (chlIndex > 0) console.log(`Below CHL: ${layers[chlIndex - 1].id}`);
    console.log(`CHL: ${layers[chlIndex].id}`);
    if (chlIndex < layers.length - 1) console.log(`Above CHL: ${layers[chlIndex + 1].id}`);
  }
  
  // 4. Try to fix CHL if it exists
  if (chlLayer) {
    console.log('\n--- Applying Fixes ---');
    
    // Copy SST's working properties
    const sstVis = m.getLayoutProperty('sst-lyr', 'visibility') || 'visible';
    const sstOpacity = m.getPaintProperty('sst-lyr', 'raster-opacity') || 0.9;
    
    m.setLayoutProperty('chl-lyr', 'visibility', 'visible');
    m.setPaintProperty('chl-lyr', 'raster-opacity', 1);
    
    // Reset all modifiers
    m.setPaintProperty('chl-lyr', 'raster-saturation', 0);
    m.setPaintProperty('chl-lyr', 'raster-contrast', 0);
    m.setPaintProperty('chl-lyr', 'raster-brightness-min', 0);
    m.setPaintProperty('chl-lyr', 'raster-brightness-max', 1);
    m.setPaintProperty('chl-lyr', 'raster-hue-rotate', 0);
    
    // Move CHL to same position as SST (if SST exists)
    if (sstIndex >= 0) {
      // Put CHL right next to SST
      m.moveLayer('chl-lyr', 'sst-lyr');
      console.log('✅ Moved CHL next to SST');
    } else {
      // Move to top
      m.moveLayer('chl-lyr');
      console.log('✅ Moved CHL to top');
    }
    
    m.triggerRepaint();
    console.log('✅ Applied all fixes');
  }
  
  // 5. Test a tile request manually
  console.log('\n--- Manual Tile Test ---');
  if (chlSource && chlSource.tiles && chlSource.tiles[0]) {
    const testUrl = chlSource.tiles[0].replace('{z}', '5').replace('{x}', '9').replace('{y}', '12');
    console.log('Test tile URL:', testUrl);
    console.log('Try this in browser to see if tiles load:', window.location.origin + testUrl);
  }
  
  // 6. Listen for tile events
  console.log('\n--- Listening for tile events (5 seconds) ---');
  let tileCount = 0;
  const handleData = (e) => {
    if (e.sourceId === 'chl-src' && e.tile) {
      tileCount++;
      console.log(`CHL tile loaded #${tileCount}`);
    }
  };
  
  const handleError = (e) => {
    if (e.sourceId === 'chl-src') {
      console.error('CHL tile error:', e.error);
    }
  };
  
  m.on('data', handleData);
  m.on('error', handleError);
  
  setTimeout(() => {
    m.off('data', handleData);
    m.off('error', handleError);
    console.log(`\nTotal CHL tiles loaded: ${tileCount}`);
    if (tileCount === 0) {
      console.log('❌ No tiles loaded - check Network tab for errors');
    }
  }, 5000);
  
  console.log('\n✅ Diagnostic complete. Check Network tab for tile requests.');
})();
