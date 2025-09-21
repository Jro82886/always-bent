// Browser Console Test for Ocean Data Tiles
// Copy and paste this entire script into the browser console on the Analysis page

console.log('%c🔍 Testing Ocean Data Tiles in Browser', 'color: cyan; font-size: 16px; font-weight: bold');

// Get credentials from environment (these should be in Vercel)
const COPERNICUS_USER = 'jro82886';
const COPERNICUS_PASS = 'Jro!0788';

// Create auth header
const auth = 'Basic ' + btoa(`${COPERNICUS_USER}:${COPERNICUS_PASS}`);

// Test tile near Ocean City, MD
const testTile = { z: 7, x: 36, y: 48 };

// Function to build daily ISO timestamp
function buildDailyIso(daysAgo = 1) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString(); // Returns YYYY-MM-DDTHH:mm:ss.sssZ
}

// Test different URL formats
async function testOceanTiles() {
  console.log('\n📅 Testing dates:');
  const dates = [
    { desc: 'Yesterday ISO8601', time: buildDailyIso(1) },
    { desc: '2 days ago ISO8601', time: buildDailyIso(2) },
    { desc: '3 days ago ISO8601', time: buildDailyIso(3) },
    { desc: 'Simple date format', time: '2025-09-20' }
  ];
  
  dates.forEach(d => console.log(`  ${d.desc}: ${d.time}`));
  
  // Test SST endpoints
  console.log('\n🌡️  Testing SST (Sea Surface Temperature)...');
  
  // Format 1: Path-based (from VERCEL_ENV_COMPLETE.txt)
  const sstPathTemplate = 'https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m--DEPTH-0.49402499198913574m/{TIME}/{z}/{x}/{y}.png';
  
  for (const dateTest of dates) {
    const url = sstPathTemplate
      .replace('{TIME}', dateTest.time)
      .replace('{z}', testTile.z)
      .replace('{x}', testTile.x)
      .replace('{y}', testTile.y);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': auth,
          'Accept': 'image/png'
        },
        mode: 'no-cors' // Avoid CORS issues in browser
      });
      
      // In no-cors mode, we can't read the response but we can see if it loaded
      console.log(`✅ SST ${dateTest.desc}: Request sent (check Network tab)`);
    } catch (error) {
      console.log(`❌ SST ${dateTest.desc}: ${error.message}`);
    }
  }
  
  // Test CHL endpoints
  console.log('\n🌊 Testing CHL (Chlorophyll)...');
  
  // Format 1: Path-based
  const chlPathTemplate = 'https://wmts.marine.copernicus.eu/teroWmts/OCEANCOLOUR_ATL_BGC_L4_MY_009_118/cmems_obs-oc_atl_bgc-plankton_my_l4-multi-1km_P1D/CHL-SURF/{TIME}/{z}/{x}/{y}.png';
  
  // Format 2: Query-based  
  const chlQueryTemplate = 'https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}';
  
  // Test path-based CHL
  const testDate = buildDailyIso(2); // 2 days ago usually available
  const chlUrl = chlPathTemplate
    .replace('{TIME}', testDate)
    .replace('{z}', testTile.z)
    .replace('{x}', testTile.x)
    .replace('{y}', testTile.y);
  
  try {
    const response = await fetch(chlUrl, {
      headers: {
        'Authorization': auth,
        'Accept': 'image/png'
      },
      mode: 'no-cors'
    });
    console.log(`✅ CHL Path-based: Request sent (check Network tab)`);
  } catch (error) {
    console.log(`❌ CHL Path-based: ${error.message}`);
  }
  
  // Test query-based CHL
  const chlQueryUrl = chlQueryTemplate
    .replace('{z}', testTile.z)
    .replace('{y}', testTile.y)
    .replace('{x}', testTile.x)
    .replace('{TIME}', testDate);
  
  try {
    const response = await fetch(chlQueryUrl, {
      headers: {
        'Authorization': auth,
        'Accept': 'image/png'
      },
      mode: 'no-cors'
    });
    console.log(`✅ CHL Query-based: Request sent (check Network tab)`);
  } catch (error) {
    console.log(`❌ CHL Query-based: ${error.message}`);
  }
  
  console.log('\n📊 Check the Network tab to see actual response status codes!');
  console.log('Look for 200 OK responses to confirm which format works.');
  console.log('\n💡 Tips:');
  console.log('- Copernicus data is usually 1-2 days behind');
  console.log('- Daily products update around 00:00 UTC');
  console.log('- Authentication is required (Basic Auth)');
}

// Also test if the app is using the proxy endpoints
console.log('\n🔧 Checking current app configuration...');
if (typeof process !== 'undefined' && process.env) {
  console.log('SST WMTS Template:', process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || 'Not set - using proxy');
  console.log('CHL WMTS Template:', process.env.NEXT_PUBLIC_CHL_WMTS_TEMPLATE || 'Not set - using proxy');
} else {
  console.log('Environment variables not accessible from browser');
}

// Run the tests
testOceanTiles();

// Test the proxy endpoints that handle auth
console.log('\n🚀 Testing App Proxy Endpoints (these should work)...');
const proxyTests = [
  `/api/tiles/sst/${testTile.z}/${testTile.x}/${testTile.y}.png?time=latest`,
  `/api/tiles/chl/${testTile.z}/${testTile.x}/${testTile.y}.png?time=latest`
];

proxyTests.forEach(url => {
  const img = new Image();
  img.onload = () => console.log(`✅ Proxy working: ${url}`);
  img.onerror = () => console.log(`❌ Proxy failed: ${url}`);
  img.src = url;
});
