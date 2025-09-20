// Tracking Page Debug Helper
// Run these in browser console while on Tracking page

// 1. Check if map exists
window.debugMap = () => {
  const maps = document.querySelectorAll('.mapboxgl-map');
  console.log('Map containers found:', maps.length);
  
  // Check if mapbox is loaded
  console.log('Mapbox GL loaded:', typeof mapboxgl !== 'undefined');
  console.log('Mapbox token:', mapboxgl.accessToken ? 'Set ✓' : 'Missing ✗');
  
  // Find map instance
  if (window.map) {
    console.log('Map instance found on window.map');
    return window.map;
  }
  
  // Check for map in React DevTools
  console.log('No map on window - check React DevTools');
  return null;
};

// 2. Check map sources and layers
window.debugLayers = (map) => {
  if (!map) {
    console.error('No map provided - run debugMap() first');
    return;
  }
  
  const style = map.getStyle();
  console.log('\n=== SOURCES ===');
  Object.keys(style.sources).forEach(id => {
    console.log(`- ${id}:`, style.sources[id].type);
  });
  
  console.log('\n=== LAYERS ===');
  style.layers.forEach(layer => {
    console.log(`- ${layer.id} (${layer.type}) → source: ${layer.source || 'none'}`);
  });
};

// 3. Check vessel clustering
window.debugClustering = (map) => {
  if (!map) {
    console.error('No map provided');
    return;
  }
  
  // Check for vessel sources
  const vesselSources = ['rec-vessels', 'commercial-vessels', 'user-vessel'];
  console.log('\n=== VESSEL SOURCES ===');
  
  vesselSources.forEach(id => {
    const source = map.getSource(id);
    if (source) {
      console.log(`✓ ${id} found`);
      if (source._data) {
        console.log(`  - Features: ${source._data.features?.length || 0}`);
        console.log(`  - Cluster: ${source._options?.cluster || false}`);
        console.log(`  - ClusterMaxZoom: ${source._options?.clusterMaxZoom || 'N/A'}`);
      }
    } else {
      console.log(`✗ ${id} not found`);
    }
  });
  
  // Check for cluster layers
  const clusterLayers = ['rec-clusters', 'rec-cluster-count', 'rec-unclustered'];
  console.log('\n=== CLUSTER LAYERS ===');
  
  clusterLayers.forEach(id => {
    const layer = map.getLayer(id);
    console.log(`${layer ? '✓' : '✗'} ${id}`);
  });
};

// 4. Monitor zoom changes
window.debugZoom = (map) => {
  if (!map) return;
  
  console.log('Current zoom:', map.getZoom());
  console.log('Monitoring zoom changes...');
  
  map.on('zoom', () => {
    const zoom = map.getZoom();
    console.log(`Zoom: ${zoom.toFixed(2)}`);
    
    // Check cluster visibility at different zooms
    if (zoom > 12) {
      console.log('  → Should show individual boats');
    } else {
      console.log('  → Should show clusters');
    }
  });
};

// 5. Test inlet regions
window.debugInlets = (map) => {
  if (!map) return;
  
  const inletSource = map.getSource('inlet-regions');
  const inletLayer = map.getLayer('inlet-regions-fill');
  
  console.log('\n=== INLET REGIONS ===');
  console.log('Source exists:', !!inletSource);
  console.log('Layer exists:', !!inletLayer);
  
  if (inletLayer) {
    const visibility = map.getLayoutProperty('inlet-regions-fill', 'visibility');
    const opacity = map.getPaintProperty('inlet-regions-fill', 'fill-opacity');
    console.log('Visibility:', visibility || 'visible');
    console.log('Opacity:', opacity);
  }
};

// 6. Check map errors
window.debugErrors = (map) => {
  if (!map) return;
  
  console.log('\n=== MONITORING ERRORS ===');
  
  map.on('error', (e) => {
    console.error('Map error:', e);
    if (e.error) {
      console.error('Error details:', e.error);
    }
  });
  
  // Check for tile errors
  map.on('sourcedataloading', (e) => {
    console.log(`Loading source: ${e.sourceId}`);
  });
  
  map.on('sourcedata', (e) => {
    if (e.isSourceLoaded) {
      console.log(`✓ Source loaded: ${e.sourceId}`);
    }
  });
  
  console.log('Error monitoring active - trigger actions to see logs');
};

// 7. Master debug function
window.debugTracking = () => {
  console.log('🔍 TRACKING PAGE DEBUG\n');
  
  const map = window.debugMap();
  if (!map) {
    console.error('❌ No map found - check if map is initialized');
    
    // Try to find map in page
    const containers = document.querySelectorAll('[ref="mapContainer"]');
    console.log('Map containers with ref:', containers.length);
    
    // Check if Mapbox CSS is loaded
    const mapboxCSS = document.querySelector('link[href*="mapbox-gl.css"]');
    console.log('Mapbox CSS loaded:', !!mapboxCSS);
    
    return;
  }
  
  // Run all debug checks
  window.debugLayers(map);
  window.debugClustering(map);
  window.debugInlets(map);
  window.debugZoom(map);
  window.debugErrors(map);
  
  console.log('\n✅ Debug complete - check output above');
};

// Auto-expose map if found
setTimeout(() => {
  // Try to find map instance from React fiber
  const mapContainer = document.querySelector('.mapboxgl-map');
  if (mapContainer && mapContainer._reactInternalFiber) {
    // Search for map in React tree
    console.log('🔍 Searching for map in React tree...');
  }
}, 2000);

console.log(`
🛠️ TRACKING DEBUG TOOLS LOADED

Quick commands:
- debugTracking()     → Run all checks
- debugMap()         → Find map instance  
- debugLayers(map)   → List sources/layers
- debugClustering(map) → Check vessel clustering
- debugInlets(map)   → Check inlet regions
- debugZoom(map)     → Monitor zoom levels
- debugErrors(map)   → Watch for errors

💡 TIP: If map not found, try:
1. Wait for page to fully load
2. Check React DevTools for map ref
3. Look for window.map or window._map
`);
