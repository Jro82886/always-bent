#!/usr/bin/env node

// Direct test of WMTS GetFeatureInfo to diagnose pixel extraction
const https = require('https');
const url = require('url');

async function testDirectWMTS() {
  console.log('🔬 Testing WMTS GetFeatureInfo directly...\n');
  
  // Test point: Delaware Bay area
  const lon = -75.25;
  const lat = 38.75;
  const zoom = 10;
  
  // Calculate tile coordinates (Web Mercator)
  const tileCol = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const tileRow = Math.floor(
    (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
  );
  
  // Pixel within tile (assuming 256x256 tiles)
  const i = 128; // center of tile
  const j = 128;
  
  console.log(`Location: ${lat}°N, ${lon}°W`);
  console.log(`Tile: col=${tileCol}, row=${tileRow}, zoom=${zoom}`);
  console.log(`Pixel: i=${i}, j=${j}\n`);
  
  // Try different date formats
  const today = new Date();
  const dates = [
    today.toISOString(), // 2025-09-23T02:30:00.000Z
    today.toISOString().split('T')[0], // 2025-09-23
    new Date(today - 86400000).toISOString().split('T')[0], // Yesterday
    new Date(today - 172800000).toISOString().split('T')[0], // 2 days ago
  ];
  
  for (const dateStr of dates) {
    console.log(`Testing date format: ${dateStr}`);
    
    const params = new URLSearchParams({
      service: 'WMTS',
      request: 'GetFeatureInfo',
      version: '1.0.0',
      layer: 'GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m/thetao',
      tilematrixset: 'EPSG:3857',
      tilematrix: zoom.toString(),
      tilerow: tileRow.toString(),
      tilecol: tileCol.toString(),
      i: i.toString(),
      j: j.toString(),
      infoformat: 'application/json',
      time: dateStr,
      elevation: '0' // Surface temperature
    });
    
    const wmtsUrl = `https://wmts.marine.copernicus.eu/teroWmts?${params}`;
    
    try {
      const response = await fetch(wmtsUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('ajrosenkilde@gmail.com:Copernicus2024marine!').toString('base64')
        }
      });
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const props = data.features[0].properties;
          if (props && (props.value !== undefined || props.thetao !== undefined)) {
            const value = props.value || props.thetao;
            const tempC = value - 273.15; // Kelvin to Celsius
            const tempF = tempC * 9/5 + 32; // Celsius to Fahrenheit
            console.log(`  ✅ Got temperature: ${value.toFixed(2)}K = ${tempC.toFixed(1)}°C = ${tempF.toFixed(1)}°F`);
            console.log(`  Raw response:`, JSON.stringify(data, null, 2).substring(0, 300));
            break;
          } else {
            console.log(`  ⚠️  No value in response`);
          }
        } else {
          console.log(`  ❌ Empty features array`);
        }
      } else {
        console.log(`  ❌ HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📝 Recommendations:');
  console.log('1. Check if date needs to be in specific format (YYYY-MM-DD vs ISO)');
  console.log('2. Verify elevation parameter (0 for surface, or omit it)');
  console.log('3. Try different CRS (CRS:84 instead of default)');
  console.log('4. Check if layer path has changed in recent Copernicus update');
}
