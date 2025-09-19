// Test CHL viridis palette visibility
(function() {
  const m = window.abfiMap || window.map;
  
  // Check current state
  console.log('=== CHL Layer Status ===');
  console.log('CHL source:', m.getSource('chl-src'));
  console.log('CHL layer:', m.getLayer('chl-lyr'));
  console.log('visibility:', m.getLayoutProperty('chl-lyr', 'visibility'));
  console.log('opacity:', m.getPaintProperty('chl-lyr', 'raster-opacity'));
  
  // Force visibility
  console.log('\n=== Forcing CHL visibility ===');
  m.setLayoutProperty('chl-lyr', 'visibility', 'visible');
  m.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  
  // Move to top (avoiding 'top' variable name)
  const topLayerId = m.getStyle().layers.at(-1).id;
  m.moveLayer('chl-lyr', topLayerId);
  console.log('Moved CHL above:', topLayerId);
  
  // Check tiles
  const source = m.getSource('chl-src');
  if (source && source.tiles) {
    console.log('\n=== Tile URL ===');
    console.log('CHL tiles:', source.tiles[0]);
    
    // Check if using viridis
    if (source.tiles[0].includes('style=viridis')) {
      console.log('✅ Using VIRIDIS palette');
    } else {
      console.log('❌ Not using viridis - using default turbo');
    }
  }
  
  // Force refresh
  m.triggerRepaint();
  console.log('\n✅ CHL layer should now be visible with viridis palette');
  
  // Check layer order
  const layers = m.getStyle().layers;
  const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
  console.log(`CHL layer position: ${chlIndex} of ${layers.length}`);
})();
