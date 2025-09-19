// Complete CHL Layer Diagnostic
console.log('=== COMPLETE CHL LAYER DIAGNOSTIC ===');
console.log(new Date().toLocaleTimeString());

// 1. CHECK ALL LAYERS
console.log('\n📊 ALL RASTER LAYERS:');
const allLayers = map.getStyle().layers;
const rasterLayers = allLayers.filter(l => l.type === 'raster');
rasterLayers.forEach(layer => {
  const visibility = map.getLayoutProperty(layer.id, 'visibility') || 'visible';
  const opacity = map.getPaintProperty(layer.id, 'raster-opacity') || 1;
  console.log(`- ${layer.id}: visibility=${visibility}, opacity=${opacity}`);
});

// 2. CHL LAYER SPECIFIC CHECKS
console.log('\n🔍 CHL LAYER DETAILS:');
const chlLayer = map.getLayer('chl-lyr');
if (chlLayer) {
  console.log('✅ CHL layer exists');
  console.log('Type:', chlLayer.type);
  console.log('Source:', chlLayer.source);
  console.log('Source-layer:', chlLayer['source-layer'] || 'none');
  console.log('Visibility:', map.getLayoutProperty('chl-lyr', 'visibility') || 'visible');
  console.log('Paint properties:');
  console.log('  - opacity:', map.getPaintProperty('chl-lyr', 'raster-opacity'));
  console.log('  - brightness-min:', map.getPaintProperty('chl-lyr', 'raster-brightness-min'));
  console.log('  - brightness-max:', map.getPaintProperty('chl-lyr', 'raster-brightness-max'));
  console.log('  - contrast:', map.getPaintProperty('chl-lyr', 'raster-contrast'));
  console.log('  - saturation:', map.getPaintProperty('chl-lyr', 'raster-saturation'));
  console.log('  - hue-rotate:', map.getPaintProperty('chl-lyr', 'raster-hue-rotate'));
  console.log('  - fade-duration:', map.getPaintProperty('chl-lyr', 'raster-fade-duration'));
} else {
  console.log('❌ CHL layer NOT FOUND');
}

// 3. CHECK SOURCE
console.log('\n📡 CHL SOURCE DETAILS:');
const chlSource = map.getSource('chl-src');
if (chlSource) {
  console.log('✅ CHL source exists');
  console.log('Type:', chlSource.type);
  console.log('Tiles:', chlSource.tiles);
  console.log('TileSize:', chlSource.tileSize);
  console.log('Bounds:', chlSource.bounds);
  console.log('MinZoom:', chlSource.minzoom);
  console.log('MaxZoom:', chlSource.maxzoom);
} else {
  console.log('❌ CHL source NOT FOUND');
}

// 4. LAYER ORDERING
console.log('\n🎯 LAYER ORDER (top to bottom):');
const chlIndex = allLayers.findIndex(l => l.id === 'chl-lyr');
const nearbyLayers = allLayers.slice(Math.max(0, chlIndex - 3), chlIndex + 4);
nearbyLayers.forEach((layer, i) => {
  const marker = layer.id === 'chl-lyr' ? '→' : ' ';
  console.log(`${marker} [${allLayers.indexOf(layer)}] ${layer.id} (${layer.type})`);
});

// 5. CHECK FOR BLOCKING LAYERS
console.log('\n⚠️  POTENTIAL BLOCKERS:');
const afterChl = chlIndex >= 0 ? allLayers.slice(chlIndex + 1) : [];
const blockingLayers = afterChl.filter(l => 
  l.type === 'fill' || 
  l.type === 'raster' || 
  (l.type === 'background' && map.getPaintProperty(l.id, 'background-opacity') > 0)
);
if (blockingLayers.length > 0) {
  console.log('Found layers that might block CHL:');
  blockingLayers.forEach(l => {
    const opacity = map.getPaintProperty(l.id, `${l.type}-opacity`) || 1;
    console.log(`  - ${l.id} (${l.type}) opacity=${opacity}`);
  });
} else {
  console.log('✅ No obvious blocking layers found');
}

// 6. TEST TOGGLE FUNCTIONALITY
console.log('\n🔄 TESTING TOGGLE:');
const currentVis = map.getLayoutProperty('chl-lyr', 'visibility') || 'visible';
console.log('Current:', currentVis);

// Toggle off then on
map.setLayoutProperty('chl-lyr', 'visibility', 'none');
console.log('Set to none');
setTimeout(() => {
  map.setLayoutProperty('chl-lyr', 'visibility', 'visible');
  console.log('Set to visible');
  
  // Force high opacity
  map.setPaintProperty('chl-lyr', 'raster-opacity', 0.9);
  console.log('Set opacity to 0.9');
}, 100);

// 7. CHECK IF IT SHOULD BE OFF ON LOAD
console.log('\n💡 DEFAULT STATE CHECK:');
console.log('CHL should be OFF by default on page load');
console.log('Current state:', currentVis);
if (currentVis === 'visible') {
  console.log('⚠️  CHL is ON - might need to default to OFF');
}

// 8. FORCE MOVE CHL TO TOP
console.log('\n🔝 MOVING CHL TO TOP OF STACK:');
try {
  // Find the topmost layer that's not a symbol/text layer
  let beforeId = null;
  for (let i = allLayers.length - 1; i >= 0; i--) {
    if (allLayers[i].type === 'symbol') {
      beforeId = allLayers[i].id;
      break;
    }
  }
  
  if (beforeId && chlLayer) {
    map.moveLayer('chl-lyr', beforeId);
    console.log(`✅ Moved CHL layer before "${beforeId}"`);
  }
} catch (e) {
  console.log('Could not move layer:', e.message);
}

// 9. TEST A TILE DIRECTLY
console.log('\n🧪 TESTING TILE FETCH:');
const z = Math.floor(map.getZoom());
const center = map.getCenter();
const testUrl = `/api/tiles/chl/${z}/18/25?time=latest`;
fetch(testUrl)
  .then(r => {
    console.log(`Tile ${testUrl}:`, r.status, r.statusText);
    if (!r.ok) {
      r.text().then(t => console.log('Error:', t.substring(0, 200)));
    }
  });

// 10. FINAL RECOMMENDATIONS
console.log('\n✅ QUICK FIXES TO TRY:');
console.log('1. Make visible: map.setLayoutProperty("chl-lyr", "visibility", "visible")');
console.log('2. Increase opacity: map.setPaintProperty("chl-lyr", "raster-opacity", 1)');
console.log('3. Move to top: map.moveLayer("chl-lyr")');
console.log('4. Remove fade: map.setPaintProperty("chl-lyr", "raster-fade-duration", 0)');
console.log('5. Check Network tab for 502/403 errors on /api/tiles/chl/');

console.log('\n📌 Most common issues:');
console.log('- Layer visibility set to "none"');
console.log('- Layer opacity is 0');
console.log('- Layer is under other opaque layers');
console.log('- API returning errors (check Network tab)');
console.log('- Source tiles URL is wrong');

