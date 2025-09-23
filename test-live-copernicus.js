#!/usr/bin/env node

// Test script to verify Copernicus live data is working
// Run with: node test-live-copernicus.js

const testLiveData = async () => {
  console.log('🌊 Testing Copernicus Live Data...\n');
  
  // Test polygon (off Delaware coast)
  const polygon = {
    type: "Polygon",
    coordinates: [[
      [-75.5, 38.5],
      [-75.5, 39.0],
      [-75.0, 39.0],
      [-75.0, 38.5],
      [-75.5, 38.5]
    ]]
  };
  
  try {
    const response = await fetch('https://always-bent.vercel.app/api/rasters/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polygon,
        time: new Date().toISOString(),
        layers: ['sst', 'chl']
      })
    });
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (data.stats?.sst_mean !== undefined) {
      console.log('✅ SST DATA LIVE!');
      console.log(`   Mean: ${data.stats.sst_mean.toFixed(1)}°F`);
      console.log(`   Min:  ${data.stats.sst_min.toFixed(1)}°F`);
      console.log(`   Max:  ${data.stats.sst_max.toFixed(1)}°F`);
      console.log(`   Range: ${(data.stats.sst_max - data.stats.sst_min).toFixed(1)}°F\n`);
    } else {
      console.log('❌ SST: No data available\n');
    }
    
    if (data.stats?.chl_mean !== undefined) {
      console.log('✅ CHLOROPHYLL DATA LIVE!');
      console.log(`   Mean: ${data.stats.chl_mean.toFixed(2)} mg/m³`);
      console.log(`   Min:  ${data.stats.chl_min.toFixed(2)} mg/m³`);
      console.log(`   Max:  ${data.stats.chl_max.toFixed(2)} mg/m³\n`);
    } else {
      console.log('❌ CHL: No data available\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Metadata:');
    console.log(`  Coverage: ${(data.stats?.coverage_pct * 100 || 0).toFixed(0)}%`);
    console.log(`  No Data: ${(data.meta?.nodata_pct * 100 || 100).toFixed(0)}%`);
    console.log(`  Tiles: ${data.meta?.tiles || 0}`);
    console.log(`  Zoom: ${data.meta?.zoom || 0}`);
    
    if (data.meta?.nodata_pct === 1) {
      console.log('\n⚠️  100% no data - Possible issues:');
      console.log('  1. Copernicus credentials not set in Vercel');
      console.log('  2. Data not available for today\'s date');
      console.log('  3. Region outside coverage area');
    }
    
    if (data.error) {
      console.log('\n❌ Error:', data.error);
      console.log('Message:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch:', error.message);
  }
};

testLiveData();
