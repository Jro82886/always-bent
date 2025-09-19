// FORCE CHL DISPLAY NOW
console.log('=== FORCING CHL DISPLAY ===');

// 1. Remove any existing CHL layer/source
const chlLayerId = 'lyr:chl';
const chlSourceId = 'src:chl';

if (map.getLayer(chlLayerId)) {
  map.removeLayer(chlLayerId);
  console.log('Removed old layer');
}
if (map.getSource(chlSourceId)) {
  map.removeSource(chlSourceId);
  console.log('Removed old source');
}

// 2. Add fresh CHL source with cache buster
map.addSource(chlSourceId, {
  type: 'raster',
  tiles: [`/api/tiles/chl/{z}/{x}/{y}.png?time=latest&_t=${Date.now()}`],
  tileSize: 256,
  attribution: '© Copernicus Marine Service'
});
console.log('✅ Added fresh CHL source');

// 3. Add layer with maximum visibility
map.addLayer({
  id: chlLayerId,
  type: 'raster',
  source: chlSourceId,
  minzoom: 0,
  maxzoom: 24,
  paint: {
    'raster-opacity': 1,  // Full opacity
    'raster-fade-duration': 0  // No fade
  }
});
console.log('✅ Added CHL layer');

// 4. Make absolutely sure it's visible
map.setLayoutProperty(chlLayerId, 'visibility', 'visible');
console.log('✅ Set to visible');

// 5. Move it above water but below labels
const layers = map.getStyle().layers;
const firstSymbolId = layers.find(l => l.type === 'symbol')?.id;
if (firstSymbolId) {
  map.moveLayer(chlLayerId, firstSymbolId);
  console.log('✅ Moved layer to proper position');
}

// 6. Create toggle function
window.toggleCHL = function() {
  const current = map.getLayoutProperty(chlLayerId, 'visibility') || 'visible';
  const newVis = current === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty(chlLayerId, 'visibility', newVis);
  console.log(`CHL: ${newVis}`);
  return newVis;
};

// 7. Test a tile directly
console.log('\n📡 Testing CHL tile...');
fetch('/api/tiles/chl/6/18/25?time=latest')
  .then(r => {
    console.log('Tile response:', r.status);
    if (r.status === 502) {
      console.log('❌ ERROR: Missing CMEMS_CHL_WMTS_TEMPLATE in Vercel!');
      r.text().then(t => console.log(t));
    } else if (r.status === 200) {
      console.log('✅ Tiles are working!');
      r.blob().then(b => {
        // Show test tile
        const url = URL.createObjectURL(b);
        const img = new Image();
        img.src = url;
        img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid lime;width:128px;height:128px;';
        img.title = 'CHL test tile - click to remove';
        img.onclick = () => img.remove();
        document.body.appendChild(img);
        console.log('✅ Test tile shown (bottom right)');
      });
    }
  });

// 8. Move to good location
console.log('\n📍 Moving to Cape Hatteras...');
map.flyTo({ 
  center: [-75.5, 35.5], 
  zoom: 7,
  duration: 2000 
});

console.log('\n✅ CHL FORCED ON!');
console.log('Use toggleCHL() to turn on/off');
console.log('\nIf you see nothing:');
console.log('1. Check Network tab for red tiles (502 = missing env var)');
console.log('2. Try toggleCHL() to toggle');
console.log('3. The test tile (bottom right) shows if API works');

