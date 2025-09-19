// Fix CHL Visibility Issues
console.log('=== FIXING CHL VISIBILITY ===');

// 1. ENSURE CHL IS OFF (since it should be off by default)
console.log('\n1️⃣ Setting CHL to OFF (default state)');
map.setLayoutProperty('chl-lyr', 'visibility', 'none');
console.log('✅ CHL visibility set to none');

// 2. CHECK ALL OPACITY SETTINGS
console.log('\n2️⃣ Checking opacity settings');
const currentOpacity = map.getPaintProperty('chl-lyr', 'raster-opacity');
console.log('Current opacity:', currentOpacity);
if (!currentOpacity || currentOpacity < 0.5) {
  map.setPaintProperty('chl-lyr', 'raster-opacity', 0.85);
  console.log('✅ Set opacity to 0.85');
}

// 3. REMOVE ANY FADE EFFECTS
console.log('\n3️⃣ Removing fade effects');
map.setPaintProperty('chl-lyr', 'raster-fade-duration', 0);
console.log('✅ Removed fade duration');

// 4. RESET ALL RASTER PROPERTIES
console.log('\n4️⃣ Resetting all raster properties');
map.setPaintProperty('chl-lyr', 'raster-brightness-min', 0);
map.setPaintProperty('chl-lyr', 'raster-brightness-max', 1);
map.setPaintProperty('chl-lyr', 'raster-contrast', 0);
map.setPaintProperty('chl-lyr', 'raster-saturation', 0);
map.setPaintProperty('chl-lyr', 'raster-hue-rotate', 0);
console.log('✅ Reset all paint properties');

// 5. CREATE MANUAL TOGGLE FUNCTION
console.log('\n5️⃣ Creating toggle function');
window.toggleCHL = function() {
  const current = map.getLayoutProperty('chl-lyr', 'visibility') || 'visible';
  const newVis = current === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty('chl-lyr', 'visibility', newVis);
  console.log(`CHL toggled: ${current} → ${newVis}`);
  
  // If turning on, ensure good opacity
  if (newVis === 'visible') {
    map.setPaintProperty('chl-lyr', 'raster-opacity', 0.85);
    
    // Force refresh tiles
    const source = map.getSource('chl-src');
    if (source) {
      source.setTiles([`/api/tiles/chl/{z}/{x}/{y}.png?time=latest&t=${Date.now()}`]);
      console.log('Refreshed tile source');
    }
  }
  
  return newVis;
};
console.log('✅ Toggle function created: use toggleCHL()');

// 6. CHECK FOR CONFLICTS WITH OTHER LAYERS
console.log('\n6️⃣ Checking for layer conflicts');
const allLayers = map.getStyle().layers;
const rasterLayers = allLayers.filter(l => l.type === 'raster' && l.id !== 'chl-lyr');
console.log('Other raster layers:');
rasterLayers.forEach(l => {
  const vis = map.getLayoutProperty(l.id, 'visibility') || 'visible';
  const opacity = map.getPaintProperty(l.id, 'raster-opacity') || 1;
  console.log(`  - ${l.id}: vis=${vis}, opacity=${opacity}`);
});

// 7. TEST THE TOGGLE
console.log('\n7️⃣ Testing toggle...');
console.log('Current state: OFF');
console.log('To turn ON: toggleCHL() or click the CHL button');
console.log('To turn OFF: toggleCHL() or click the CHL button again');

// 8. MONITOR FOR ERRORS
console.log('\n8️⃣ Monitoring for tile errors...');
let errorCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && url.includes('/api/tiles/chl/')) {
    return originalFetch.apply(this, args).then(response => {
      if (!response.ok) {
        errorCount++;
        console.error(`❌ CHL tile error #${errorCount}:`, url, response.status);
        response.clone().text().then(text => {
          if (text.includes('CMEMS_CHL_WMTS_TEMPLATE')) {
            console.error('🚨 MISSING ENV VAR: Add CMEMS_CHL_WMTS_TEMPLATE to Vercel!');
          }
        });
      }
      return response;
    });
  }
  return originalFetch.apply(this, args);
};
console.log('✅ Error monitoring active');

console.log('\n✅ CHL VISIBILITY FIXES APPLIED!');
console.log('The layer is now OFF (default state)');
console.log('Use toggleCHL() to turn it on/off');

