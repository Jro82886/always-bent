#!/usr/bin/env node

// Comprehensive debug script for SST and CHL tile endpoints

const https = require('https');

// Copernicus WMTS endpoints
const SST_WMTS = 'https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m--DEPTH-0.49402499198913574m/{TIME}/{z}/{x}/{y}.png';
const CHL_WMTS = 'https://wmts.marine.copernicus.eu/teroWmts/OCEANCOLOUR_ATL_BGC_L4_MY_009_118/cmems_obs-oc_atl_bgc-plankton_my_l4-multi-1km_P1D/CHL-SURF/{TIME}/{z}/{x}/{y}.png';

// Test different date formats
const dates = [
  // ISO date format
  new Date().toISOString().split('T')[0],
  new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
  new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago
  
  // Full ISO format with time
  new Date().toISOString(),
  new Date(Date.now() - 86400000).toISOString(),
  
  // Just the date part with T00:00:00Z
  new Date().toISOString().split('T')[0] + 'T00:00:00Z',
  new Date(Date.now() - 86400000).toISOString().split('T')[0] + 'T00:00:00Z',
  
  // Special keywords
  'latest',
  'TODAY',
  'YESTERDAY'
];

// Test different zoom levels and tiles
const tiles = [
  { z: 7, x: 36, y: 48, desc: 'Ocean City, MD area' },
  { z: 5, x: 9, y: 12, desc: 'Eastern US overview' },
  { z: 9, x: 145, y: 194, desc: 'Ocean City detailed' },
  { z: 0, x: 0, y: 0, desc: 'World view' }
];

console.log('🔍 Debugging Copernicus Ocean Data Tiles\n');
console.log('Testing different date formats and tile coordinates...\n');

let testCount = 0;
let successCount = 0;

async function testUrl(url, type, date, tile) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      testCount++;
      const success = res.statusCode === 200;
      if (success) successCount++;
      
      console.log(`${success ? '✅' : '❌'} ${type} | Date: ${date} | Tile: z=${tile.z},x=${tile.x},y=${tile.y} | Status: ${res.statusCode}`);
      if (success) {
        console.log(`   → Success! Content-Type: ${res.headers['content-type']}, Size: ${res.headers['content-length']} bytes`);
        console.log(`   → Working URL: ${url}\n`);
      }
      resolve(success);
    }).on('error', (err) => {
      testCount++;
      console.log(`❌ ${type} | Date: ${date} | Network error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  // First, let's try to get the capabilities document
  console.log('📄 Fetching WMTS Capabilities...\n');
  
  const capabilitiesUrls = [
    'https://wmts.marine.copernicus.eu/teroWmts?service=WMTS&request=GetCapabilities&version=1.0.0',
    'https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024?service=WMTS&request=GetCapabilities',
    'https://wmts.marine.copernicus.eu/teroWmts/OCEANCOLOUR_ATL_BGC_L4_MY_009_118?service=WMTS&request=GetCapabilities'
  ];
  
  for (const url of capabilitiesUrls) {
    await new Promise((resolve) => {
      https.get(url, (res) => {
        console.log(`${res.statusCode === 200 ? '✅' : '❌'} Capabilities: ${url.split('?')[0]}... Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('   → This endpoint is accessible!\n');
        }
        resolve();
      }).on('error', (err) => {
        console.log(`❌ Capabilities error: ${err.message}`);
        resolve();
      });
    });
  }
  
  console.log('\n🗓️  Testing Date Formats...\n');
  
  // Test just one tile with all date formats first
  const testTile = tiles[0];
  console.log(`Using test tile: ${testTile.desc}\n`);
  
  for (const date of dates) {
    // Test SST
    const sstUrl = SST_WMTS
      .replace('{TIME}', date)
      .replace('{z}', testTile.z)
      .replace('{x}', testTile.x)
      .replace('{y}', testTile.y);
    
    await testUrl(sstUrl, 'SST', date, testTile);
    
    // Test CHL
    const chlUrl = CHL_WMTS
      .replace('{TIME}', date)
      .replace('{z}', testTile.z)
      .replace('{x}', testTile.x)
      .replace('{y}', testTile.y);
    
    await testUrl(chlUrl, 'CHL', date, testTile);
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total tests: ${testCount}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${testCount - successCount}\n`);
  
  if (successCount === 0) {
    console.log('⚠️  No successful requests. Possible issues:');
    console.log('   1. The WMTS URL format might be incorrect');
    console.log('   2. Authentication might be required');
    console.log('   3. The service might be temporarily down');
    console.log('   4. The date format might need adjustment\n');
    
    console.log('🔧 Next steps:');
    console.log('   1. Check the Copernicus Marine Service documentation');
    console.log('   2. Verify if authentication headers are needed');
    console.log('   3. Try the proxy endpoints instead: /api/tiles/sst/{z}/{x}/{y}.png');
  }
}

runTests();
