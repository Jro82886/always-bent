// Debug what's blocking CHL tiles
console.log('=== Debugging CHL Tile Loading ===');

// 1. Check if source exists and its configuration
const source = map.getSource('chl-src');
if (source) {
  console.log('✅ CHL source exists');
  console.log('Source tiles:', source.tiles);
  console.log('Source tile size:', source.tileSize);
} else {
  console.log('❌ No CHL source found');
}

// 2. Check layer configuration
const layer = map.getLayer('chl-lyr');
if (layer) {
  console.log('✅ CHL layer exists');
  console.log('Layer visibility:', map.getLayoutProperty('chl-lyr', 'visibility'));
  console.log('Layer opacity:', map.getPaintProperty('chl-lyr', 'raster-opacity'));
  console.log('Layer minzoom:', layer.minzoom);
  console.log('Layer maxzoom:', layer.maxzoom);
} else {
  console.log('❌ No CHL layer found');
}

// 3. Check current map state
console.log('\nMap state:');
console.log('Current zoom:', map.getZoom());
console.log('Current center:', map.getCenter());
console.log('Current bounds:', map.getBounds());

// 4. Monitor network requests
console.log('\n🔍 Monitoring CHL tile requests...');
console.log('Check Network tab for /api/tiles/chl/ requests');
console.log('Look for status codes - 502 means env var missing');

// 5. Force a single tile request to test
const testTile = `/api/tiles/chl/6/18/25?time=latest&_t=${Date.now()}`;
console.log(`\n📡 Testing single tile: ${testTile}`);
fetch(testTile)
  .then(r => {
    console.log('Test tile response:', r.status, r.statusText);
    if (!r.ok) {
      return r.text().then(text => {
        console.error('❌ Error response:', text);
        if (text.includes('CMEMS_CHL_WMTS_TEMPLATE')) {
          console.log('\n⚠️  SOLUTION: Add CMEMS_CHL_WMTS_TEMPLATE to Vercel environment variables!');
          console.log('Value needed:', 'https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}');
        }
      });
    } else {
      console.log('✅ Tile request successful!');
      return r.blob().then(blob => {
        console.log('Tile size:', blob.size, 'bytes');
        console.log('Content type:', blob.type);
        
        // Display the test tile
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid lime;width:128px;height:128px;';
        img.title = 'CHL test tile - click to remove';
        img.onclick = () => img.remove();
        document.body.appendChild(img);
        console.log('✅ Test tile displayed (bottom right)');
      });
    }
  })
  .catch(e => console.error('Network error:', e));

// 6. Check for layer ordering issues
console.log('\n🎨 Checking layer order...');
const layers = map.getStyle().layers;
const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
const labelLayers = layers.filter(l => l.type === 'symbol' && l.id.includes('label'));
if (labelLayers.some(l => layers.indexOf(l) < chlIndex)) {
  console.log('⚠️  CHL might be hidden under labels');
}

// 7. Force refresh the source
console.log('\n🔄 Force refreshing CHL source...');
if (source) {
  const newTiles = [`/api/tiles/chl/{z}/{x}/{y}.png?time=latest&_cache=${Date.now()}`];
  source.setTiles(newTiles);
  console.log('✅ Forced source refresh with cache buster');
}

