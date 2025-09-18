// Test CHL data coverage
(() => {
  console.log('=== Testing CHL Coverage ===');
  
  // Get current view
  const center = map.getCenter();
  const zoom = Math.floor(map.getZoom());
  console.log('Current location:', center.lng.toFixed(2), center.lat.toFixed(2));
  console.log('Zoom level:', zoom);
  
  // Test multiple tiles around current area
  const testTiles = [
    { z: 5, x: 9, y: 12, name: 'East Coast' },
    { z: 5, x: 8, y: 12, name: 'Further offshore' },
    { z: 5, x: 10, y: 12, name: 'Near shore' },
    { z: 4, x: 4, y: 6, name: 'Gulf Stream area' }
  ];
  
  console.log('\nTesting different tile locations...');
  
  testTiles.forEach((tile, index) => {
    fetch(`/api/tiles/chl/${tile.z}/${tile.x}/${tile.y}?time=latest`)
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.style.cssText = `position:fixed;bottom:${10 + index * 70}px;left:10px;z-index:9999;border:2px solid cyan;width:64px;height:64px;`;
        img.src = url;
        img.title = `${tile.name} (${tile.z}/${tile.x}/${tile.y})`;
        document.body.appendChild(img);
        
        // Check if image has actual data (not just black/transparent)
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 64;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, 64, 64);
          
          const imageData = ctx.getImageData(0, 0, 64, 64);
          const pixels = imageData.data;
          
          let hasData = false;
          let totalAlpha = 0;
          for (let i = 3; i < pixels.length; i += 4) {
            totalAlpha += pixels[i];
            if (pixels[i] > 0 && (pixels[i-3] > 10 || pixels[i-2] > 10 || pixels[i-1] > 10)) {
              hasData = true;
            }
          }
          
          const avgAlpha = totalAlpha / (pixels.length / 4);
          console.log(`${tile.name}: ${hasData ? '✅ HAS DATA' : '❌ NO DATA'} (avg alpha: ${avgAlpha.toFixed(0)})`);
          
          if (!hasData) {
            img.style.opacity = '0.3';
          }
        };
        
        img.onclick = () => {
          document.querySelectorAll('img[title*="("]').forEach(i => i.remove());
        };
      });
  });
  
  console.log('\nTiles shown on left side - click any to remove all');
  console.log('Faded tiles = no data, bright tiles = has data');
  
  // Also check if we're over land
  const bounds = map.getBounds();
  console.log('\nCurrent bounds:', 
    'West:', bounds.getWest().toFixed(2),
    'East:', bounds.getEast().toFixed(2),
    'South:', bounds.getSouth().toFixed(2),
    'North:', bounds.getNorth().toFixed(2)
  );
  
  // Try a known good ocean location
  console.log('\nTo test with known ocean location, run:');
  console.log('map.flyTo({ center: [-70, 35], zoom: 6 }); // Off Cape Hatteras');
})();
