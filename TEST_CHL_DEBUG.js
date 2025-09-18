// COMPREHENSIVE CHLOROPHYLL DEBUG SCRIPT
// Run this in browser console after toggling CHL ON

console.log('=== CHLOROPHYLL DEBUG ===');

// 1. Check if map exists
console.log('1. Map exists:', typeof map !== 'undefined');

// 2. Check layer toggle state
const leftZone = document.querySelector('[class*="CHL"]');
console.log('2. CHL button found:', !!leftZone);

// 3. Force add CHL layer manually
if (typeof map !== 'undefined' && map.loaded()) {
  console.log('3. Manually adding CHL layer...');
  
  // Remove if exists
  if (map.getLayer('chl-lyr')) map.removeLayer('chl-lyr');
  if (map.getSource('chl-src')) map.removeSource('chl-src');
  
  // Add source
  map.addSource('chl-src', {
    type: 'raster',
    tiles: ['/api/tiles/chl/{z}/{x}/{y}?time=latest'],
    tileSize: 256,
    attribution: '© Copernicus Marine Service'
  });
  
  // Add layer
  map.addLayer({
    id: 'chl-lyr',
    type: 'raster',
    source: 'chl-src',
    paint: {
      'raster-opacity': 1,
      'raster-saturation': 0.5,
      'raster-contrast': 0.5,
      'raster-hue-rotate': 30
    }
  });
  
  console.log('CHL layer added manually!');
  console.log('Layer exists now:', !!map.getLayer('chl-lyr'));
  console.log('Source exists now:', !!map.getSource('chl-src'));
  
  // 4. Check layer ordering
  const layers = map.getStyle().layers;
  const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
  console.log('4. CHL layer position:', chlIndex, 'of', layers.length);
  
  // 5. Listen for tile loads
  map.on('data', (e) => {
    if (e.sourceId === 'chl-src') {
      console.log('CHL tile event:', e.type, e.isSourceLoaded);
    }
  });
  
  // 6. Test API directly
  fetch('/api/tiles/chl/5/9/12?time=latest')
    .then(r => {
      console.log('5. API test - Status:', r.status);
      console.log('   Content-Type:', r.headers.get('content-type'));
      return r.blob();
    })
    .then(blob => {
      console.log('   Blob size:', blob.size, 'bytes');
      console.log('   Is image:', blob.type.startsWith('image/'));
    });
    
} else {
  console.log('3. Map not ready or not found');
}

// 7. Check React component
console.log('6. Looking for CHL toggle state...');
const buttons = Array.from(document.querySelectorAll('button'));
const chlButton = buttons.find(b => b.textContent?.includes('CHL') || b.textContent?.includes('Chlorophyll'));
console.log('   CHL button found:', !!chlButton);
if (chlButton) {
  console.log('   Button classes:', chlButton.className);
  console.log('   Is active:', chlButton.className.includes('green-500'));
}

console.log('=== END DEBUG ===');
