// FIX CHL DISPLAY WITH TURBO PALETTE
// Run this in browser console after updating Vercel env

console.log('=== FIXING CHL DISPLAY (TURBO) ===');

// 1. First test the API
console.log('\n1️⃣ Testing CHL API...');
fetch('/api/tiles/chl/6/18/25?time=latest')
  .then(r => {
    console.log('API Status:', r.status);
    if (r.status === 502) {
      console.log('❌ CMEMS_CHL_WMTS_TEMPLATE not set in Vercel!');
      console.log('Add this to Vercel env variables:');
      console.log('CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}');
      return r.text().then(t => {
        console.log('Error details:', t);
        throw new Error('Env var not set');
      });
    } else if (r.status === 200) {
      console.log('✅ API working!');
      return r.blob();
    } else {
      return r.text().then(t => {
        console.log('Error:', t);
        throw new Error(`API error ${r.status}`);
      });
    }
  })
  .then(blob => {
    if (!blob) return;
    
    // Show test tile
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid blue;width:128px;height:128px;';
    img.title = 'TURBO CHL test tile - should be BLUE palette';
    img.onclick = () => img.remove();
    document.body.appendChild(img);
    console.log('✅ Test tile shown (bottom right) - should be BLUE');
  })
  .catch(e => console.error('API test failed:', e));

// 2. Clean up any old CHL layers
console.log('\n2️⃣ Cleaning up old layers...');
const oldLayers = ['lyr:chl', 'chl-lyr', 'chl-test-layer'];
const oldSources = ['src:chl', 'chl-src', 'chl-wmts-test'];

oldLayers.forEach(id => {
  if (map.getLayer(id)) {
    map.removeLayer(id);
    console.log(`Removed layer: ${id}`);
  }
});

oldSources.forEach(id => {
  if (map.getSource(id)) {
    map.removeSource(id);
    console.log(`Removed source: ${id}`);
  }
});

// 3. Add fresh CHL layer
console.log('\n3️⃣ Adding fresh CHL layer...');
map.addSource('src:chl', {
  type: 'raster',
  tiles: ['/api/tiles/chl/{z}/{x}/{y}.png?time=latest'],
  tileSize: 256,
  attribution: '© Copernicus Marine Service'
});
console.log('✅ Added CHL source');

map.addLayer({
  id: 'lyr:chl',
  type: 'raster',
  source: 'src:chl',
  minzoom: 0,
  maxzoom: 24,
  paint: {
    'raster-opacity': 1,
    'raster-fade-duration': 0
  }
});
console.log('✅ Added CHL layer');

// 4. Position it properly (above ocean floor, below labels)
const layers = map.getStyle().layers;
const firstSymbolId = layers.find(l => l.type === 'symbol')?.id;
if (firstSymbolId) {
  map.moveLayer('lyr:chl', firstSymbolId);
  console.log('✅ Positioned CHL below labels');
}

// 5. Make sure it's visible
map.setLayoutProperty('lyr:chl', 'visibility', 'visible');
console.log('✅ CHL set to visible');

// 6. Create working toggle function
window.toggleCHL = () => {
  const current = map.getLayoutProperty('lyr:chl', 'visibility') || 'visible';
  const newVis = current === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty('lyr:chl', 'visibility', newVis);
  console.log(`CHL toggled: ${newVis}`);
  
  // Also update button state if it exists
  const button = document.querySelector('[data-testid="chl-toggle"]');
  if (button) {
    if (newVis === 'visible') {
      button.classList.add('bg-blue-500');
      button.classList.remove('bg-gray-600');
    } else {
      button.classList.remove('bg-blue-500');
      button.classList.add('bg-gray-600');
    }
  }
  
  return newVis;
};

// 7. Test date switching
console.log('\n4️⃣ Testing date switching...');
const testDates = () => {
  const dates = ['latest', '2025-09-18', '2025-09-17'];
  dates.forEach((date, i) => {
    setTimeout(() => {
      console.log(`Testing date: ${date}`);
      if (map.getSource('src:chl')) {
        map.getSource('src:chl').setTiles([`/api/tiles/chl/{z}/{x}/{y}.png?time=${date}`]);
      }
    }, i * 1000);
  });
};

// 8. Move to good test location
console.log('\n5️⃣ Moving to Cape Hatteras...');
map.flyTo({
  center: [-75.5, 35.5],
  zoom: 7,
  duration: 2000
});

console.log('\n✅ CHL DISPLAY FIXED!');
console.log('\nCommands:');
console.log('- toggleCHL() - Toggle on/off');
console.log('- testDates() - Test date switching');
console.log('\nThe CHL should display in BLUE (turbo palette)');
console.log('If you see no tiles, check Network tab for errors');
