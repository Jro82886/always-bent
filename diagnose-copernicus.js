#!/usr/bin/env node

// Quick diagnostic for Copernicus connection
const https = require('https');

async function diagnose() {
  console.log('🔍 Diagnosing Copernicus Connection...\n');
  
  // Your credentials from the environment
  const user = 'ajrosenkilde@gmail.com';
  const pass = 'Copernicus2024marine!';
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  
  // Test dates
  const dates = [
    new Date().toISOString(),
    new Date(Date.now() - 86400000).toISOString(), // Yesterday
    '2025-09-22T00:00:00Z',
    '2025-09-22',
  ];
  
  console.log('Testing different date formats for SST layer:\n');
  
  for (const date of dates) {
    console.log(`Date: ${date}`);
    
    // Simple GetFeatureInfo request
    const params = new URLSearchParams({
      service: 'WMTS',
      request: 'GetFeatureInfo',
      version: '1.0.0',
      layer: 'GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m/thetao',
      tilematrixset: 'EPSG:3857',
      tilematrix: '6',
      tilerow: '20',
      tilecol: '18',
      i: '128',
      j: '128',
      infoformat: 'application/json',
      time: date,
      elevation: '0'
    });
    
    try {
      const response = await fetch(`https://wmts.marine.copernicus.eu/teroWmts?${params}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.features?.[0]?.properties) {
          const props = data.features[0].properties;
          console.log(`  ✅ Got data:`, Object.keys(props).join(', '));
          if (props.value || props.thetao) {
            const val = props.value || props.thetao;
            const tempC = val - 273.15;
            const tempF = tempC * 9/5 + 32;
            console.log(`  Temperature: ${tempF.toFixed(1)}°F`);
          }
        } else {
          console.log(`  ❌ No features in response`);
        }
      } else {
        console.log(`  ❌ HTTP ${response.status}`);
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
    console.log();
  }
  
  console.log('📝 Recommendations:');
  console.log('1. If all dates fail, check credentials');
  console.log('2. If some dates work, use that format');
  console.log('3. If getting 403, credentials may be wrong');
  console.log('4. If getting 400, layer path may have changed');
}

diagnose();
