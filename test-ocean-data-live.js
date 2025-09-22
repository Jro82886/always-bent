// Test if SST/CHL data is live
// Run this in browser console

(async () => {
  console.log('🌊 Testing Ocean Data (SST/CHL)...\n');
  
  // Test polygon near Ocean City
  const testPolygon = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-74.6, 38.3],
        [-74.5, 38.3],
        [-74.5, 38.4],
        [-74.6, 38.4],
        [-74.6, 38.3]
      ]]
    },
    properties: {}
  };
  
  // Test dates
  const dates = [
    new Date().toISOString(), // Today
    new Date(Date.now() - 86400000).toISOString(), // Yesterday
    new Date(Date.now() - 2 * 86400000).toISOString() // 2 days ago
  ];
  
  console.log('Testing multiple dates to find available data...\n');
  
  for (const date of dates) {
    console.log(`📅 Testing date: ${date.split('T')[0]}`);
    
    try {
      const res = await fetch('/api/rasters/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon: testPolygon,
          time: date,
          layers: ['sst', 'chl']
        })
      });
      
      const data = await res.json();
      
      if (res.status === 503) {
        console.log('❌ Service not configured:', data.message || data.error);
        console.log('   Need to set COPERNICUS_USER and COPERNICUS_PASS in Vercel\n');
        break; // No point testing other dates if service not configured
      } else if (!res.ok) {
        console.log('❌ Error:', res.status, data.error);
      } else {
        console.log('✅ Response received!');
        
        // Check SST
        if (data.stats?.sst_mean !== undefined) {
          console.log(`   🌡️ SST: ${data.stats.sst_mean.toFixed(1)}°F (min: ${data.stats.sst_min.toFixed(1)}, max: ${data.stats.sst_max.toFixed(1)})`);
          console.log(`   📊 Coverage: ${(data.stats.coverage_pct * 100).toFixed(1)}%`);
        } else {
          console.log('   🌡️ SST: No data');
        }
        
        // Check CHL
        if (data.stats?.chl_mean !== undefined) {
          console.log(`   🌿 CHL: ${data.stats.chl_mean.toFixed(3)} mg/m³ (min: ${data.stats.chl_min.toFixed(3)}, max: ${data.stats.chl_max.toFixed(3)})`);
        } else {
          console.log('   🌿 CHL: No data');
        }
        
        console.log(`   🔍 Meta: ${data.meta.tiles} tiles at zoom ${data.meta.zoom}`);
        
        // If we got data, it's live!
        if (data.stats?.sst_mean !== undefined || data.stats?.chl_mean !== undefined) {
          console.log('\n🎉 OCEAN DATA IS LIVE! 🎉\n');
          return;
        }
      }
      
      console.log(''); // Blank line between dates
      
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
    }
  }
  
  console.log('\n⚠️  Ocean data not available. Possible issues:');
  console.log('1. COPERNICUS_USER and COPERNICUS_PASS not set in Vercel');
  console.log('2. Copernicus service is down');
  console.log('3. No data available for recent dates');
  console.log('\nTo fix: Add Copernicus credentials to Vercel environment variables');
})();
