// Test East Coast zoom effect
(function() {
  const m = window.abfiMap || window.map;
  
  if (!m) {
    console.log('❌ Map not found');
    return;
  }
  
  console.log('🌊 Starting dramatic East Coast zoom...');
  
  // First, ensure inlet regions are visible
  const inletLayer = m.getLayer('inlet-regions-glow');
  if (inletLayer) {
    m.setPaintProperty('inlet-regions-glow', 'circle-opacity', 0.09);
    m.setPaintProperty('inlet-regions-core', 'circle-opacity', 0.15);
    console.log('✅ Inlet regions made visible');
  } else {
    console.log('⚠️ Inlet regions layer not found');
  }
  
  // Dramatic spin and zoom to East Coast
  m.flyTo({
    center: [-73.5, 35.5], // Center between Maine and Florida
    zoom: 5.5,
    bearing: -15, // Slight angle for drama
    pitch: 25, // Tilt for 3D effect
    duration: 3000, // 3 second animation
    essential: true,
    easing: (t) => {
      // Custom easing for dramatic effect
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  });
  
  console.log('✅ Initial zoom started (3 seconds)');
  
  // After initial zoom, settle into perfect view
  setTimeout(() => {
    m.flyTo({
      center: [-74, 37], // Slightly north for better inlet visibility
      zoom: 6,
      bearing: 0,
      pitch: 0,
      duration: 2000,
      essential: true
    });
    console.log('✅ Final positioning (2 seconds)');
  }, 3000);
})();
