// Quick fix to add green tint overlay to CHL layer
// Run this in browser console after CHL is visible

const m = window.abfiMap || window.map;
if (!m) {
  console.error('No map found');
} else {
  // Find the CHL source - could be different names
  const possibleSources = ['chl-src', 'chl-prod-source', 'src:chl'];
  let chlSource = null;
  
  for (const src of possibleSources) {
    if (m.getSource(src)) {
      chlSource = src;
      console.log('Found CHL source:', src);
      break;
    }
  }
  
  if (!chlSource) {
    console.error('No CHL source found. Available sources:', 
      Object.keys(m.style.sourceCaches).filter(s => s.includes('chl')));
  } else {
    // Add green tint layer
    const layerId = 'chl-green-tint-manual';
    
    // Remove if exists
    if (m.getLayer(layerId)) {
      m.removeLayer(layerId);
    }
    
    // Find where to insert (above CHL layer)
    const layers = m.getStyle().layers;
    let beforeLayer = undefined;
    const chlLayerNames = ['chl-lyr', 'chl-prod-layer', 'lyr:chl'];
    
    for (const name of chlLayerNames) {
      const idx = layers.findIndex(l => l.id === name);
      if (idx !== -1 && idx < layers.length - 1) {
        beforeLayer = layers[idx + 1].id;
        console.log('Inserting green tint after:', name);
        break;
      }
    }
    
    // Add the green tint layer
    m.addLayer({
      id: layerId,
      type: 'raster',
      source: chlSource,
      paint: {
        // Green color with value-based opacity
        'raster-opacity': 0.4,
        'raster-hue-rotate': 120, // Shift blue to green
        'raster-saturation': 0.5,
        'raster-contrast': 0.2
      }
    }, beforeLayer);
    
    console.log('✅ Green tint layer added!');
    console.log('Adjust opacity with: m.setPaintProperty("' + layerId + '", "raster-opacity", 0.5)');
    console.log('Adjust green intensity with: m.setPaintProperty("' + layerId + '", "raster-hue-rotate", 150)');
  }
}
