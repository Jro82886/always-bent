// IMMEDIATE FIX - Move CHL above water layer

console.log('Moving CHL above water...');

// Find the water layer
const layers = map.getStyle().layers;
const waterLayer = layers.find(l => l.id === 'water');
const chlLayer = map.getLayer('chl-lyr');

if (chlLayer && waterLayer) {
  // Move CHL to just after water (above it)
  map.moveLayer('chl-lyr');  // First move to top
  console.log('✅ CHL moved to top!');
  
  // Check new position
  const newLayers = map.getStyle().layers;
  const newChlIndex = newLayers.findIndex(l => l.id === 'chl-lyr');
  console.log('CHL now at position:', newChlIndex, 'of', newLayers.length);
}

// Also move the test layer if it exists
if (map.getLayer('chl-test')) {
  map.moveLayer('chl-test');
  console.log('✅ Test layer also moved to top');
}

console.log('\nYou should now see chlorophyll patterns on the ocean!');
