// Simple CHL visibility test
const m = window.abfiMap || window.map;
if (!m) {
  console.log('❌ No map found');
} else {
  console.log('✅ Map found');
  
  // Check if CHL exists
  const chl = m.getLayer('chl-lyr');
  console.log('CHL layer exists:', !!chl);
  
  if (chl) {
    // Force visible
    m.setLayoutProperty('chl-lyr', 'visibility', 'visible');
    m.setPaintProperty('chl-lyr', 'raster-opacity', 1);
    
    // Move to top
    m.moveLayer('chl-lyr');
    
    // Get tile URL
    const source = m.getSource('chl-src');
    if (source && source.tiles) {
      console.log('Tile URL:', source.tiles[0]);
    }
    
    console.log('✅ CHL should be visible now');
  } else {
    console.log('❌ Toggle CHL button first');
  }
}
