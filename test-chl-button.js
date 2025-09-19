// Test CHL Button Connection
console.log('=== TESTING CHL BUTTON CONNECTION ===');

// 1. Check correct layer ID
const correctLayerId = 'lyr:chl';
const correctSourceId = 'src:chl';

console.log('\n✅ Correct IDs for CHL:');
console.log('Layer ID:', correctLayerId);
console.log('Source ID:', correctSourceId);

// 2. Check if layer exists with correct ID
const layerExists = !!map.getLayer(correctLayerId);
const sourceExists = !!map.getSource(correctSourceId);

console.log('\n📊 Current state:');
console.log('Layer exists:', layerExists);
console.log('Source exists:', sourceExists);

if (layerExists) {
  const visibility = map.getLayoutProperty(correctLayerId, 'visibility') || 'visible';
  const opacity = map.getPaintProperty(correctLayerId, 'raster-opacity');
  console.log('Visibility:', visibility);
  console.log('Opacity:', opacity);
}

// 3. Test manual toggle with correct ID
console.log('\n🔄 Testing manual toggle...');
window.toggleCHLManual = function() {
  if (!map.getLayer(correctLayerId)) {
    console.log('❌ CHL layer not found with ID:', correctLayerId);
    return;
  }
  
  const current = map.getLayoutProperty(correctLayerId, 'visibility') || 'visible';
  const newVis = current === 'visible' ? 'none' : 'visible';
  map.setLayoutProperty(correctLayerId, 'visibility', newVis);
  console.log(`✅ Toggled: ${current} → ${newVis}`);
  return newVis;
};

// 4. Check if button exists in DOM
const chlButton = Array.from(document.querySelectorAll('button')).find(b => 
  b.textContent?.includes('CHL') && (b.textContent.includes('On') || b.textContent.includes('Off'))
);

if (chlButton) {
  console.log('\n✅ Found CHL button:', chlButton.textContent);
  console.log('Button classes:', chlButton.className);
  
  // Check button state
  const isOn = chlButton.textContent.includes('On');
  console.log('Button shows:', isOn ? 'ON' : 'OFF');
  
  // Check if layer visibility matches button
  if (layerExists) {
    const layerVis = map.getLayoutProperty(correctLayerId, 'visibility') || 'visible';
    const layerIsVisible = layerVis === 'visible';
    if (isOn !== layerIsVisible) {
      console.log('⚠️  MISMATCH: Button says', isOn ? 'ON' : 'OFF', 'but layer is', layerIsVisible ? 'visible' : 'hidden');
    } else {
      console.log('✅ Button state matches layer visibility');
    }
  }
  
  console.log('\n💡 Click the CHL button to toggle, or use: toggleCHLManual()');
} else {
  console.log('\n❌ CHL button not found in DOM');
}

// 5. Test the source tiles
if (sourceExists) {
  const source = map.getSource(correctSourceId);
  console.log('\n📡 Source configuration:');
  console.log('Tiles:', source.tiles);
  console.log('Tile size:', source.tileSize);
}

// 6. Monitor tile requests
console.log('\n🔍 To debug tile loading:');
console.log('1. Open Network tab');
console.log('2. Filter by "chl"');
console.log('3. Click the CHL button to turn it ON');
console.log('4. Check for 502 errors (missing env var)');

// 7. If layer doesn't exist, suggest fix
if (!layerExists) {
  console.log('\n⚠️  CHL layer not found! The button might not be creating it properly.');
  console.log('Try refreshing the page and clicking the CHL button.');
}

