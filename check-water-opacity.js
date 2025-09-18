// Check if water layer is opaque and blocking CHL
(() => {
  console.log('=== Checking water layer ===');
  
  // Check water layer properties
  const waterLayer = map.getLayer('water');
  if (waterLayer) {
    const fillColor = map.getPaintProperty('water', 'fill-color');
    const fillOpacity = map.getPaintProperty('water', 'fill-opacity');
    
    console.log('Water fill-color:', fillColor);
    console.log('Water fill-opacity:', fillOpacity);
    
    // Make water semi-transparent to test
    console.log('\nMaking water 50% transparent...');
    map.setPaintProperty('water', 'fill-opacity', 0.5);
    console.log('✅ Water opacity set to 0.5');
    
    // Try hiding water completely
    setTimeout(() => {
      console.log('\nHiding water layer completely...');
      map.setLayoutProperty('water', 'visibility', 'none');
      console.log('✅ Water layer hidden');
      console.log('If you see CHL now, water was blocking it!');
    }, 2000);
  }
  
  // List all raster layers
  console.log('\nAll raster layers:');
  const layers = map.getStyle().layers;
  layers.forEach((layer, i) => {
    if (layer.type === 'raster') {
      console.log(`  ${i}: ${layer.id}`);
    }
  });
  
  // Check CHL opacity one more time
  if (map.getLayer('chl-lyr')) {
    const opacity = map.getPaintProperty('chl-lyr', 'raster-opacity');
    console.log('\nCHL opacity:', opacity);
    
    // Force maximum opacity
    map.setPaintProperty('chl-lyr', 'raster-opacity', 1);
    map.setPaintProperty('chl-lyr', 'raster-saturation', 2);
    console.log('✅ CHL forced to max opacity and saturation');
  }
})();
