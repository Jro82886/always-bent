// FINAL CHL DISPLAY FIX - TURBO PALETTE
// This ensures CHL displays properly with blue palette

console.log('=== APPLYING FINAL CHL DISPLAY FIX ===\n');

// 1. Clean up ALL old layers/sources
console.log('1️⃣ Cleaning up old layers...');
const oldLayers = ['lyr:chl', 'chl-lyr', 'chl', 'chl-test-layer'];
const oldSources = ['src:chl', 'chl-src', 'chl', 'chl-wmts-test'];

oldLayers.forEach(id => {
  if (map.getLayer(id)) {
    map.removeLayer(id);
    console.log(`   Removed layer: ${id}`);
  }
});

oldSources.forEach(id => {
  if (map.getSource(id)) {
    map.removeSource(id);
    console.log(`   Removed source: ${id}`);
  }
});

// 2. Add fresh CHL source with cache buster
console.log('\n2️⃣ Adding fresh CHL source...');
const timestamp = Date.now();
map.addSource('src:chl', {
  type: 'raster',
  tiles: [`/api/tiles/chl/{z}/{x}/{y}.png?time=latest&_t=${timestamp}`],
  tileSize: 256,
  attribution: '© Copernicus Marine Service'
});
console.log('   ✅ Added CHL source');

// 3. Add layer with proper paint properties
console.log('\n3️⃣ Adding CHL layer...');
map.addLayer({
  id: 'lyr:chl',
  type: 'raster',
  source: 'src:chl',
  minzoom: 0,
  maxzoom: 24,
  layout: {
    visibility: 'visible'
  },
  paint: {
    'raster-opacity': 1,
    'raster-fade-duration': 0,
    'raster-resampling': 'linear'
  }
});
console.log('   ✅ Added CHL layer');

// 4. Position correctly (above ocean floor, below labels)
console.log('\n4️⃣ Positioning layer...');
const layers = map.getStyle().layers;
const firstSymbolId = layers.find(l => l.type === 'symbol')?.id;

if (firstSymbolId) {
  map.moveLayer('lyr:chl', firstSymbolId);
  console.log(`   ✅ Positioned below ${firstSymbolId}`);
} else {
  // Find water layer and position above it
  const waterLayer = layers.find(l => l.id.includes('water'));
  if (waterLayer) {
    const waterIndex = layers.indexOf(waterLayer);
    const afterId = layers[waterIndex + 1]?.id;
    if (afterId) {
      map.moveLayer('lyr:chl', afterId);
      console.log(`   ✅ Positioned above water layer`);
    }
  }
}

// 5. Force visibility
console.log('\n5️⃣ Ensuring visibility...');
map.setLayoutProperty('lyr:chl', 'visibility', 'visible');
console.log('   ✅ Set to visible');

// 6. Test the API
console.log('\n6️⃣ Testing API...');
fetch('/api/tiles/chl/6/18/25?time=latest')
  .then(r => {
    if (r.status === 200) {
      console.log('   ✅ API working! (200 OK)');
      return r.blob();
    } else if (r.status === 502) {
      console.log('   ❌ ENV VAR NOT SET!');
      console.log('   Add to Vercel:');
      console.log('   CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}');
      throw new Error('Env var not set');
    } else {
      console.log(`   ⚠️ API returned ${r.status}`);
      return r.text().then(t => {
        console.log('   Error:', t.substring(0, 200));
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
    img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid blue;width:128px;height:128px;background:white;';
    img.title = 'TURBO CHL test tile - click to remove';
    img.onclick = () => img.remove();
    document.body.appendChild(img);
    console.log('   ✅ Test tile shown (bottom right)');
    console.log('   Should be BLUE palette (turbo)');
  })
  .catch(e => {
    console.error('   API test failed:', e);
  });

// 7. Create toggle function
window.toggleCHL = () => {
  const current = map.getLayoutProperty('lyr:chl', 'visibility') || 'visible';
  const newVis = current === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty('lyr:chl', 'visibility', newVis);
  console.log(`CHL toggled: ${newVis}`);
  
  // Update button if exists
  const button = document.querySelector('[data-testid="chl-toggle"]');
  if (button) {
    if (newVis === 'visible') {
      button.classList.add('bg-emerald-600');
      button.classList.remove('bg-white/90');
    } else {
      button.classList.remove('bg-emerald-600');
      button.classList.add('bg-white/90');
    }
  }
  
  return newVis;
};

// 8. Test date switching
window.testCHLDates = () => {
  const dates = ['latest', '2025-09-18', '2025-09-17', '2025-09-16'];
  console.log('Testing dates:', dates);
  
  dates.forEach((date, i) => {
    setTimeout(() => {
      console.log(`   Setting date: ${date}`);
      const source = map.getSource('src:chl');
      if (source && source.setTiles) {
        source.setTiles([`/api/tiles/chl/{z}/{x}/{y}.png?time=${date}&_t=${Date.now()}`]);
      }
    }, i * 2000);
  });
};

// 9. Move to test location
console.log('\n7️⃣ Moving to Cape Hatteras...');
map.flyTo({
  center: [-75.5, 35.5],
  zoom: 7,
  duration: 2000
});

// 10. Final summary
console.log('\n✅ CHL DISPLAY FIX COMPLETE!\n');
console.log('Commands:');
console.log('  toggleCHL()     - Toggle on/off');
console.log('  testCHLDates()  - Test date switching');
console.log('\nThe CHL layer should now display with BLUE (turbo) palette.');
console.log('If not visible:');
console.log('  1. Check Network tab for 502 errors (env var not set)');
console.log('  2. Check Network tab for tile requests');
console.log('  3. Try zooming in/out');

// Store state for debugging
window.chlState = {
  layerId: 'lyr:chl',
  sourceId: 'src:chl',
  visible: true,
  opacity: 1,
  timestamp: new Date().toISOString()
};

console.log('\nState saved to: window.chlState');
