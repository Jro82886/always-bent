// Quick CHL Check & Fix
console.log('=== CHECKING CHL STATUS ===');

// 1. Check if layer exists and its visibility
const chlExists = !!map.getLayer('chl-lyr');
const chlVisible = chlExists ? map.getLayoutProperty('chl-lyr', 'visibility') : 'none';
console.log('CHL layer exists:', chlExists);
console.log('CHL visibility:', chlVisible || 'visible');

// 2. Create toggle function
window.toggleCHL = function() {
  if (!map.getLayer('chl-lyr')) {
    console.log('❌ No CHL layer found!');
    return;
  }
  
  const current = map.getLayoutProperty('chl-lyr', 'visibility') || 'visible';
  const newVis = current === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty('chl-lyr', 'visibility', newVis);
  console.log(`CHL toggled: ${current} → ${newVis}`);
  return newVis;
};
console.log('✅ Toggle function created: use toggleCHL()');

// 3. Check Network tab for tile requests
console.log('\n🔍 CHECK NETWORK TAB:');
console.log('1. Open DevTools Network tab');
console.log('2. Filter by "chl"');
console.log('3. Look for /api/tiles/chl/ requests');
console.log('4. Check their status codes:');
console.log('   - 200 = Success');
console.log('   - 502 = Missing env var');
console.log('   - 403 = Auth issue');

// 4. Test a single tile
console.log('\n📡 Testing single tile...');
fetch('/api/tiles/chl/6/18/25?time=latest')
  .then(r => {
    console.log('Tile response:', r.status, r.statusText);
    if (r.status === 502) {
      console.log('❌ 502 ERROR: Add CMEMS_CHL_WMTS_TEMPLATE to Vercel!');
    } else if (r.status === 200) {
      console.log('✅ Tiles are working! Toggle to see them: toggleCHL()');
    }
    return r.text();
  })
  .then(text => {
    if (text.includes('CMEMS_CHL_WMTS_TEMPLATE')) {
      console.log('\n🚨 SOLUTION: Add this to Vercel environment variables:');
      console.log('Name: CMEMS_CHL_WMTS_TEMPLATE');
      console.log('Value: https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}');
    }
  });

// 5. If layer is there but not showing, try turning it on
if (chlExists && chlVisible !== 'visible') {
  console.log('\n💡 CHL is OFF. Turn it ON with: toggleCHL()');
}

