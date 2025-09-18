// 🔍 SNIP TOOL DEBUG CONSOLE COMMANDS
// Copy and paste these into your browser console on the analysis page

console.log('=== 🔍 SNIP TOOL DEBUG ===\n');

// 1. Check if map exists
const map = window.map || document.querySelector('canvas')._map;
console.log('1. Map exists:', !!map);

// 2. Check if layers are active
const sstActive = map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible';
const chlActive = map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible';
console.log('2. SST Layer active:', sstActive);
console.log('   CHL Layer active:', chlActive);

// 3. Check if snip rectangle exists
const hasSnipRectangle = !!map.getSource('snip-rectangle');
const rectangleData = hasSnipRectangle ? map.getSource('snip-rectangle')._data : null;
console.log('3. Snip rectangle source exists:', hasSnipRectangle);
if (rectangleData && rectangleData.features.length > 0) {
  console.log('   Rectangle drawn:', true);
  console.log('   Rectangle bounds:', rectangleData.features[0].geometry.coordinates[0]);
} else {
  console.log('   Rectangle drawn:', false);
}

// 4. Check for hotspot markers
const hasHotspotSource = !!map.getSource('snip-hotspots');
console.log('4. Hotspot source exists:', hasHotspotSource);

// 5. Check for analysis results
const analysisModal = document.querySelector('[data-analysis-modal]');
console.log('5. Analysis modal in DOM:', !!analysisModal);
if (analysisModal) {
  console.log('   Modal visible:', analysisModal.style.display !== 'none');
}

// 6. Force start snipping
console.log('\n📝 To start snipping, run:');
console.log('window.startSnipping()');

// 7. Check for errors in console
console.log('\n⚠️  Check for any red errors above!');

// 8. Test pixel extraction
console.log('\n🎨 Testing pixel extraction...');
if (sstActive) {
  // Get center of current view
  const center = map.getCenter();
  const zoom = Math.floor(map.getZoom());
  const tile = map.project(center);
  const tileX = Math.floor(tile.x / 256);
  const tileY = Math.floor(tile.y / 256);
  
  fetch(`/api/tiles/sst/${zoom}/${tileX}/${tileY}?time=today`)
    .then(r => {
      console.log('   SST tile status:', r.status);
      return r.blob();
    })
    .then(blob => {
      console.log('   SST tile size:', blob.size, 'bytes');
      
      // Try to extract a pixel value
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Sample center pixel
        const pixel = ctx.getImageData(128, 128, 1, 1).data;
        console.log('   Center pixel RGBA:', Array.from(pixel));
        console.log('   ✅ Pixel extraction working!');
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    })
    .catch(err => {
      console.error('   ❌ SST tile error:', err);
    });
}

// 9. Manual trigger analysis
console.log('\n🚀 To manually trigger analysis after drawing:');
console.log(`
// After drawing a rectangle, run this:
const button = document.querySelector('[data-snip-button]');
if (button) button.click();
`);

console.log('\n=== END DEBUG ===');
