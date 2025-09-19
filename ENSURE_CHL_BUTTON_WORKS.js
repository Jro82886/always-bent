// ENSURE CHL BUTTON WORKS PROPERLY
// This connects the CHL button to the layer

console.log('=== ENSURING CHL BUTTON WORKS ===\n');

// 1. Find the CHL button
const chlButton = document.querySelector('button[title="Toggle Chlorophyll layer"]');
if (chlButton) {
  console.log('✅ Found CHL button');
  
  // Check current state
  const isOn = chlButton.textContent.includes('On');
  console.log(`Current state: ${isOn ? 'ON' : 'OFF'}`);
  
  // Make sure layer matches button state
  const layerVis = map.getLayoutProperty('lyr:chl', 'visibility') || 'none';
  const shouldBeVisible = isOn ? 'visible' : 'none';
  
  if (layerVis !== shouldBeVisible) {
    console.log(`⚠️ Layer visibility (${layerVis}) doesn't match button (${shouldBeVisible})`);
    map.setLayoutProperty('lyr:chl', 'visibility', shouldBeVisible);
    console.log(`✅ Fixed layer visibility to ${shouldBeVisible}`);
  }
  
  // Test button click
  console.log('\nTesting button click...');
  const beforeVis = map.getLayoutProperty('lyr:chl', 'visibility') || 'none';
  chlButton.click();
  
  setTimeout(() => {
    const afterVis = map.getLayoutProperty('lyr:chl', 'visibility') || 'none';
    if (beforeVis !== afterVis) {
      console.log('✅ Button click works!');
      console.log(`   Changed from ${beforeVis} to ${afterVis}`);
    } else {
      console.log('❌ Button click not working');
      console.log('   Layer visibility did not change');
    }
    
    // Click again to restore original state
    chlButton.click();
  }, 500);
  
} else {
  console.log('❌ CHL button not found');
  console.log('Looking for other button selectors...');
  
  // Try other selectors
  const buttons = document.querySelectorAll('button');
  const chlButtons = Array.from(buttons).filter(b => 
    b.textContent.includes('CHL') || 
    b.textContent.includes('Chlorophyll')
  );
  
  if (chlButtons.length > 0) {
    console.log(`Found ${chlButtons.length} potential CHL button(s):`);
    chlButtons.forEach((b, i) => {
      console.log(`  ${i + 1}. "${b.textContent.trim()}" - ${b.className}`);
    });
  }
}

// Create a manual sync function
window.syncCHLButton = () => {
  const button = document.querySelector('button[title="Toggle Chlorophyll layer"]');
  if (!button) {
    console.log('Button not found');
    return;
  }
  
  const layerVis = map.getLayoutProperty('lyr:chl', 'visibility') || 'none';
  const isVisible = layerVis === 'visible';
  
  // Update button text
  const textNode = Array.from(button.childNodes).find(n => n.nodeType === 3);
  if (textNode) {
    textNode.textContent = `CHL ${isVisible ? 'On' : 'Off'}`;
  }
  
  // Update button classes
  if (isVisible) {
    button.className = button.className.replace('bg-white/90', 'bg-emerald-600').replace('text-emerald-700', 'text-white');
  } else {
    button.className = button.className.replace('bg-emerald-600', 'bg-white/90').replace('text-white', 'text-emerald-700');
  }
  
  console.log(`Button synced: ${isVisible ? 'ON' : 'OFF'}`);
};

console.log('\n✅ Button check complete!');
console.log('Use syncCHLButton() to manually sync button state');
