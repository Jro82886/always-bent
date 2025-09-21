#!/usr/bin/env node

// Script to verify live SST and CHL data is accessible

const https = require('https');

// Get environment variables from Vercel
const SST_WMTS = 'https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m--DEPTH-0.49402499198913574m/{TIME}/{z}/{x}/{y}.png';
const CHL_WMTS = 'https://wmts.marine.copernicus.eu/teroWmts/OCEANCOLOUR_ATL_BGC_L4_MY_009_118/cmems_obs-oc_atl_bgc-plankton_my_l4-multi-1km_P1D/CHL-SURF/{TIME}/{z}/{x}/{y}.png';

// Test tile coordinates (zoom 7, near Ocean City, MD)
const testTile = {
  z: 7,
  x: 36,
  y: 48
};

// Use yesterday's date (most recent available)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const timeStr = yesterday.toISOString().split('T')[0];

console.log('🔍 Testing live ocean data endpoints...\n');
console.log(`📅 Using date: ${timeStr}`);
console.log(`📍 Test tile: z=${testTile.z}, x=${testTile.x}, y=${testTile.y}\n`);

// Test SST endpoint
const sstUrl = SST_WMTS
  .replace('{TIME}', timeStr)
  .replace('{z}', testTile.z)
  .replace('{x}', testTile.x)
  .replace('{y}', testTile.y);

console.log('🌡️  Testing SST (Sea Surface Temperature)...');
console.log(`   URL: ${sstUrl}`);

https.get(sstUrl, (res) => {
  if (res.statusCode === 200) {
    console.log('   ✅ SST data is LIVE! (200 OK)');
    console.log(`   Content-Type: ${res.headers['content-type']}`);
    console.log(`   Content-Length: ${res.headers['content-length']} bytes\n`);
  } else {
    console.log(`   ❌ SST request failed: ${res.statusCode} ${res.statusMessage}\n`);
  }
  
  // Test CHL endpoint
  const chlUrl = CHL_WMTS
    .replace('{TIME}', timeStr)
    .replace('{z}', testTile.z)
    .replace('{x}', testTile.x)
    .replace('{y}', testTile.y);
  
  console.log('🌊 Testing CHL (Chlorophyll)...');
  console.log(`   URL: ${chlUrl}`);
  
  https.get(chlUrl, (res) => {
    if (res.statusCode === 200) {
      console.log('   ✅ CHL data is LIVE! (200 OK)');
      console.log(`   Content-Type: ${res.headers['content-type']}`);
      console.log(`   Content-Length: ${res.headers['content-length']} bytes\n`);
    } else {
      console.log(`   ❌ CHL request failed: ${res.statusCode} ${res.statusMessage}\n`);
    }
    
    console.log('📊 Summary:');
    console.log('   - SST and CHL layers should now display live Copernicus data');
    console.log('   - Data updates daily (yesterday\'s data is the most recent)');
    console.log('   - If tiles don\'t load, check Vercel environment variables\n');
  }).on('error', (err) => {
    console.error(`   ❌ CHL request error: ${err.message}\n`);
  });
}).on('error', (err) => {
  console.error(`   ❌ SST request error: ${err.message}\n`);
});
