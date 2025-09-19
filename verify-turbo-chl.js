// VERIFY TURBO CHL IS WORKING
// Run this in browser console after updating Vercel env

console.log('=== VERIFYING TURBO CHL ===');

// 1. Test the API endpoint
fetch('/api/tiles/chl/6/18/25?time=latest')
  .then(r => {
    console.log('CHL API Status:', r.status);
    if (r.status === 200) {
      console.log('✅ CHL API is working!');
      return r.blob();
    } else {
      console.log('❌ CHL API error:', r.status);
      return r.text().then(t => {
        console.log('Error:', t);
        throw new Error('API not working');
      });
    }
  })
  .then(blob => {
    // Show test tile
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid blue;width:128px;height:128px;';
    img.title = 'TURBO CHL test tile - click to remove';
    img.onclick = () => img.remove();
    document.body.appendChild(img);
    console.log('✅ Test tile shown (bottom right) - should be BLUE palette');
  })
  .catch(e => console.error('Failed:', e));

// 2. Check if layer exists
const layerExists = !!map.getLayer('lyr:chl');
const sourceExists = !!map.getSource('src:chl');
console.log('Layer exists:', layerExists);
console.log('Source exists:', sourceExists);

// 3. Force create if needed
if (!layerExists || !sourceExists) {
  console.log('Creating CHL layer...');
  
  if (map.getLayer('lyr:chl')) map.removeLayer('lyr:chl');
  if (map.getSource('src:chl')) map.removeSource('src:chl');
  
  map.addSource('src:chl', {
    type: 'raster',
    tiles: ['/api/tiles/chl/{z}/{x}/{y}.png?time=latest'],
    tileSize: 256,
    attribution: '© Copernicus Marine Service'
  });
  
  map.addLayer({
    id: 'lyr:chl',
    type: 'raster',
    source: 'src:chl',
    paint: {
      'raster-opacity': 1,
      'raster-fade-duration': 0
    }
  });
  
  console.log('✅ CHL layer created');
}

// 4. Make visible
map.setLayoutProperty('lyr:chl', 'visibility', 'visible');
console.log('✅ CHL set to visible');

// 5. Create toggle function
window.toggleCHL = () => {
  const v = map.getLayoutProperty('lyr:chl', 'visibility') || 'visible';
  const n = v === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty('lyr:chl', 'visibility', n);
  console.log('CHL:', n);
  return n;
};

console.log('\n✅ TURBO CHL READY!');
console.log('Use toggleCHL() to turn on/off');
console.log('The tiles should be BLUE (turbo palette)');
console.log('\nIf you see RED/GREEN tiles, the env var is not updated yet');
