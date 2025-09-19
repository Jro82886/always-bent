// COMPREHENSIVE CHL DIAGNOSTIC TEST
// This will tell us EXACTLY what's wrong and how to fix it

console.log('🔍 COMPREHENSIVE CHL DIAGNOSTIC TEST');
console.log('=====================================\n');

// Store all results
const diagnostics = {
  timestamp: new Date().toISOString(),
  apiStatus: null,
  envVarSet: false,
  tilesLoading: false,
  layerExists: false,
  sourceExists: false,
  visibility: null,
  opacity: null,
  position: null,
  errors: [],
  fixes: []
};

// 1. CHECK API ENDPOINT
console.log('1️⃣ CHECKING CHL API ENDPOINT...');
fetch('/api/tiles/chl/6/18/25?time=latest')
  .then(async (r) => {
    diagnostics.apiStatus = r.status;
    console.log(`   Status: ${r.status}`);
    
    if (r.status === 502) {
      const errorText = await r.text();
      console.log('   ❌ ENV VAR NOT SET IN VERCEL!');
      console.log('   Error:', errorText);
      diagnostics.errors.push('CMEMS_CHL_WMTS_TEMPLATE not set in Vercel');
      diagnostics.fixes.push('Add this to Vercel: CMEMS_CHL_WMTS_TEMPLATE=https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}');
    } else if (r.status === 200) {
      diagnostics.envVarSet = true;
      console.log('   ✅ API Working! Env var is set');
      
      // Check response headers
      const headers = {};
      r.headers.forEach((v, k) => headers[k] = v);
      console.log('   Headers:', headers);
      
      // Show test tile
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;
      img.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;border:3px solid lime;width:128px;height:128px;';
      img.title = 'CHL test tile - click to remove';
      img.onclick = () => img.remove();
      document.body.appendChild(img);
      console.log('   ✅ Test tile displayed (bottom right)');
      diagnostics.tilesLoading = true;
    } else {
      const errorText = await r.text();
      console.log(`   ❌ API Error ${r.status}:`, errorText);
      diagnostics.errors.push(`API returned ${r.status}: ${errorText}`);
      diagnostics.fixes.push('Check Copernicus credentials in Vercel');
    }
  })
  .catch(e => {
    console.log('   ❌ Network Error:', e);
    diagnostics.errors.push(`Network error: ${e.message}`);
  })
  .then(() => {
    // 2. CHECK MAP LAYER
    console.log('\n2️⃣ CHECKING MAP LAYER...');
    
    // Check all possible layer IDs
    const layerIds = ['lyr:chl', 'chl-lyr', 'chl'];
    let foundLayerId = null;
    
    layerIds.forEach(id => {
      if (map.getLayer(id)) {
        foundLayerId = id;
        console.log(`   ✅ Found layer: ${id}`);
      }
    });
    
    if (!foundLayerId) {
      console.log('   ❌ No CHL layer found');
      diagnostics.errors.push('CHL layer not added to map');
      diagnostics.fixes.push('Run the fix script to add layer');
    } else {
      diagnostics.layerExists = true;
      
      // Check layer properties
      const visibility = map.getLayoutProperty(foundLayerId, 'visibility');
      const paint = map.getPaintProperty(foundLayerId, 'raster-opacity');
      
      console.log(`   Visibility: ${visibility || 'visible'}`);
      console.log(`   Opacity: ${paint || 1}`);
      
      diagnostics.visibility = visibility || 'visible';
      diagnostics.opacity = paint || 1;
      
      if (visibility === 'none') {
        diagnostics.errors.push('Layer is hidden');
        diagnostics.fixes.push('Set visibility to visible');
      }
      
      if (paint < 0.5) {
        diagnostics.errors.push('Layer opacity too low');
        diagnostics.fixes.push('Set opacity to 1');
      }
      
      // Check layer position
      const layers = map.getStyle().layers;
      const layerIndex = layers.findIndex(l => l.id === foundLayerId);
      const symbolIndex = layers.findIndex(l => l.type === 'symbol');
      
      console.log(`   Layer position: ${layerIndex} of ${layers.length}`);
      diagnostics.position = layerIndex;
      
      if (symbolIndex > 0 && layerIndex > symbolIndex) {
        diagnostics.errors.push('Layer is above labels');
        diagnostics.fixes.push('Move layer below labels');
      }
    }
    
    // 3. CHECK SOURCE
    console.log('\n3️⃣ CHECKING MAP SOURCE...');
    
    const sourceIds = ['src:chl', 'chl-src', 'chl'];
    let foundSourceId = null;
    
    sourceIds.forEach(id => {
      if (map.getSource(id)) {
        foundSourceId = id;
        console.log(`   ✅ Found source: ${id}`);
      }
    });
    
    if (!foundSourceId) {
      console.log('   ❌ No CHL source found');
      diagnostics.errors.push('CHL source not added to map');
      diagnostics.fixes.push('Run the fix script to add source');
    } else {
      diagnostics.sourceExists = true;
      const source = map.getSource(foundSourceId);
      console.log('   Source config:', source);
    }
    
    // 4. CHECK NETWORK ACTIVITY
    console.log('\n4️⃣ CHECKING NETWORK (open Network tab)...');
    console.log('   Look for /api/tiles/chl/ requests');
    console.log('   - 200 = Good');
    console.log('   - 502 = Missing env var');
    console.log('   - 404 = Wrong URL format');
    console.log('   - 401/403 = Auth issue');
    
    // 5. GENERATE FIX SCRIPT
    console.log('\n5️⃣ GENERATING FIX...\n');
    
    if (diagnostics.errors.length === 0) {
      console.log('✅ EVERYTHING LOOKS GOOD!');
      console.log('CHL should be displaying. If not, check:');
      console.log('- Browser console for errors');
      console.log('- Network tab for failed tile requests');
      console.log('- Zoom level (try zooming in/out)');
    } else {
      console.log('❌ FOUND ISSUES:');
      diagnostics.errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e}`);
      });
      
      console.log('\n🔧 FIXES NEEDED:');
      diagnostics.fixes.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f}`);
      });
      
      // Generate fix code
      console.log('\n📋 COPY THIS FIX CODE:\n');
      console.log(`// AUTO-GENERATED FIX
${!diagnostics.envVarSet ? '// FIRST: Add env var to Vercel and redeploy!' : ''}
${!diagnostics.layerExists || !diagnostics.sourceExists ? `
// Clean and recreate layer
['lyr:chl', 'chl-lyr', 'chl'].forEach(id => {
  if (map.getLayer(id)) map.removeLayer(id);
});
['src:chl', 'chl-src', 'chl'].forEach(id => {
  if (map.getSource(id)) map.removeSource(id);
});

map.addSource('src:chl', {
  type: 'raster',
  tiles: ['/api/tiles/chl/{z}/{x}/{y}.png?time=latest'],
  tileSize: 256
});

map.addLayer({
  id: 'lyr:chl',
  type: 'raster',
  source: 'src:chl',
  paint: { 'raster-opacity': 1 }
});` : ''}

${diagnostics.visibility === 'none' ? `map.setLayoutProperty('${foundLayerId || 'lyr:chl'}', 'visibility', 'visible');` : ''}
${diagnostics.opacity < 1 ? `map.setPaintProperty('${foundLayerId || 'lyr:chl'}', 'raster-opacity', 1);` : ''}

// Create toggle function
window.toggleCHL = () => {
  const id = '${foundLayerId || 'lyr:chl'}';
  const v = map.getLayoutProperty(id, 'visibility') || 'visible';
  const n = v === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty(id, 'visibility', n);
  console.log('CHL:', n);
  return n;
};

console.log('✅ Fix applied! Use toggleCHL() to toggle');`);
    }
    
    // 6. SUMMARY
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log(JSON.stringify(diagnostics, null, 2));
    
    // 7. QUICK ACTIONS
    console.log('\n⚡ QUICK ACTIONS:');
    console.log('toggleCHL() - Toggle layer on/off');
    console.log('map.flyTo({center:[-75.5,35.5],zoom:7}) - Go to Cape Hatteras');
    
    // Store diagnostics globally for debugging
    window.chlDiagnostics = diagnostics;
    console.log('\nDiagnostics saved to: window.chlDiagnostics');
  });

