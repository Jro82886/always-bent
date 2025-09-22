// Check GFW state in the app
(() => {
  // Check if GFW layers exist on the map
  const map = window.map; // Assuming map is exposed globally
  
  if (!map) {
    console.error('Map not found in window object');
    return;
  }
  
  console.log('=== GFW Layer Status ===');
  
  // Check for GFW sources
  const sources = ['gfw-vessels', 'gfw-tracks', 'gfw-events'];
  sources.forEach(id => {
    const source = map.getSource(id);
    console.log(`${id}:`, source ? '✅ exists' : '❌ missing');
  });
  
  // Check for GFW layers
  const layers = ['gfw-vessels-dots', 'gfw-tracks-lines', 'gfw-events-points'];
  layers.forEach(id => {
    const layer = map.getLayer(id);
    console.log(`${id}:`, layer ? '✅ exists' : '❌ missing');
  });
  
  // Check visibility
  if (map.getLayer('gfw-vessels-dots')) {
    const visibility = map.getLayoutProperty('gfw-vessels-dots', 'visibility');
    console.log('GFW vessels visibility:', visibility || 'visible (default)');
  }
})();
