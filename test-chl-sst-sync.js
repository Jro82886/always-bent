// Test CHL-SST Date Synchronization & Toggle
console.log('=== CHL-SST SYNC & TOGGLE TEST ===');

// 1. CHECK DEFAULT STATE (should be OFF)
console.log('\n1️⃣ Checking default state...');
const chlLayerId = 'lyr:chl';
const sstLayerId = 'sst-lyr';

const chlExists = !!map.getLayer(chlLayerId);
const sstExists = !!map.getLayer(sstLayerId);

if (chlExists) {
  const chlVis = map.getLayoutProperty(chlLayerId, 'visibility') || 'visible';
  console.log('CHL visibility on load:', chlVis);
  if (chlVis === 'visible') {
    console.log('⚠️  CHL is ON by default - turning OFF');
    map.setLayoutProperty(chlLayerId, 'visibility', 'none');
  } else {
    console.log('✅ CHL is OFF by default (correct)');
  }
}

if (sstExists) {
  const sstVis = map.getLayoutProperty(sstLayerId, 'visibility') || 'visible';
  console.log('SST visibility:', sstVis);
}

// 2. CHECK CURRENT DATE SETTINGS
console.log('\n2️⃣ Checking date synchronization...');

// Get sources to check their tile URLs
const chlSource = map.getSource('src:chl');
const sstSource = map.getSource('sst-src');

if (chlSource && chlSource.tiles) {
  console.log('CHL tiles:', chlSource.tiles[0]);
}
if (sstSource && sstSource.tiles) {
  console.log('SST tiles:', sstSource.tiles[0]);
}

// 3. TEST DATE PICKER INTEGRATION
console.log('\n3️⃣ Testing date picker...');

// Find date buttons
const latestBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Latest');
const minus1dBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === '-1d');
const minus2dBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === '-2d');

console.log('Date buttons found:');
console.log('- Latest:', !!latestBtn);
console.log('- -1d:', !!minus1dBtn);
console.log('- -2d:', !!minus2dBtn);

// 4. CREATE SYNC TEST FUNCTION
window.testCHLWithDate = function(dateOption = 'latest') {
  console.log(`\n🧪 Testing CHL with date: ${dateOption}`);
  
  // First ensure CHL is visible
  if (map.getLayer(chlLayerId)) {
    map.setLayoutProperty(chlLayerId, 'visibility', 'visible');
    console.log('✅ CHL turned ON');
  }
  
  // Test specific tiles with the date
  const testDates = {
    'latest': 'latest',
    '-1d': new Date(Date.now() - 86400000).toISOString().split('T')[0],
    '-2d': new Date(Date.now() - 172800000).toISOString().split('T')[0]
  };
  
  const dateToUse = testDates[dateOption] || dateOption;
  
  // Test both SST and CHL tiles
  Promise.all([
    fetch(`/api/tiles/sst/6/18/25?time=${dateToUse}`),
    fetch(`/api/tiles/chl/6/18/25?time=${dateToUse}`)
  ]).then(([sstResp, chlResp]) => {
    console.log(`SST tile (${dateToUse}):`, sstResp.status, sstResp.statusText);
    console.log(`CHL tile (${dateToUse}):`, chlResp.status, chlResp.statusText);
    
    if (sstResp.ok && !chlResp.ok) {
      console.log('❌ SST works but CHL fails with this date!');
      chlResp.text().then(t => console.log('CHL error:', t.substring(0, 200)));
    } else if (sstResp.ok && chlResp.ok) {
      console.log('✅ Both SST and CHL work with this date!');
    }
  });
};

// 5. TEST CHL TOGGLE BUTTON
console.log('\n4️⃣ Testing CHL toggle button...');
const chlButton = Array.from(document.querySelectorAll('button')).find(b => 
  b.textContent?.includes('CHL') && (b.textContent.includes('On') || b.textContent.includes('Off'))
);

if (chlButton) {
  console.log('✅ Found CHL button:', chlButton.textContent);
  console.log('Click it to toggle, or use testCHLWithDate()');
} else {
  console.log('❌ CHL button not found');
}

// 6. MONITOR DATE CHANGES
console.log('\n5️⃣ Monitoring date changes...');
let lastDate = 'latest';
setInterval(() => {
  // Check if CHL source has been updated with new date
  const source = map.getSource('src:chl');
  if (source && source.tiles && source.tiles[0]) {
    const match = source.tiles[0].match(/time=([^&]+)/);
    if (match && match[1] !== lastDate) {
      console.log(`📅 Date changed: ${lastDate} → ${match[1]}`);
      lastDate = match[1];
    }
  }
}, 1000);

// 7. FINAL INSTRUCTIONS
console.log('\n✅ TESTS TO RUN:');
console.log('1. Click CHL button - should toggle ON/OFF');
console.log('2. With CHL ON, click date buttons (Latest, -1d, -2d)');
console.log('3. Use testCHLWithDate("latest") or testCHLWithDate("-1d")');
console.log('4. Check Network tab for any 502 errors');

console.log('\n📋 KEY POINTS:');
console.log('- CHL should be OFF when page loads ✓');
console.log('- CHL should use same date as SST ✓');
console.log('- Date picker should update both layers ✓');

