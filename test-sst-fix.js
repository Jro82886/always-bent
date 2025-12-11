#!/usr/bin/env node
/**
 * Test SST Temperature Conversion Fix
 *
 * This script tests the Kelvin → Fahrenheit conversion
 * by sampling a polygon in the Mid-Atlantic ocean.
 */

const testPolygon = {
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-75.5, 38.0],  // Western edge (Ocean City, MD area)
      [-75.0, 38.0],  // Eastern edge
      [-75.0, 38.5],  // Northeast
      [-75.5, 38.5],  // Northwest
      [-75.5, 38.0]   // Close polygon
    ]]
  },
  "properties": {}
};

const testData = {
  polygon: testPolygon,
  timeISO: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
  layers: ['sst']
};

console.log('\n═══════════════════════════════════════════════════════════');
console.log('Testing SST Temperature Conversion Fix');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Test Area: Mid-Atlantic Ocean (Ocean City, MD)');
console.log('Expected Result: SST values in 40-65°F range (typical for this area)\n');
console.log('Sending request to http://localhost:3000/api/rasters/sample...\n');

fetch('http://localhost:3000/api/rasters/sample', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
  .then(res => {
    console.log(`Response Status: ${res.status} ${res.statusText}\n`);
    return res.json();
  })
  .then(data => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (!data.ok) {
      console.error('❌ API Error:', data.error);
      process.exit(1);
    }

    if (!data.stats.sst) {
      console.error('❌ No SST data returned');
      console.log('Raw response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const sst = data.stats.sst;

    console.log('SST Statistics:');
    console.log('─────────────────────────────────────────────────────────\n');
    console.log(`  Mean:     ${sst.mean_f?.toFixed(1)}°F`);
    console.log(`  Minimum:  ${sst.min_f?.toFixed(1)}°F`);
    console.log(`  Maximum:  ${sst.max_f?.toFixed(1)}°F`);
    console.log(`  Gradient: ${sst.gradient_f?.toFixed(1)}°F`);
    console.log(`  Valid Pixels: ${sst.n_valid}`);
    console.log(`  No Data: ${sst.n_nodata}`);
    console.log(`  Zoom Used: ${sst.zoom_used}`);
    console.log(`  Tiles Touched: ${sst.tiles_touched}\n`);

    console.log('─────────────────────────────────────────────────────────\n');

    // Validation
    const isValid = sst.mean_f >= 28 && sst.mean_f <= 95;
    const inTypicalRange = sst.mean_f >= 40 && sst.mean_f <= 70;

    if (!isValid) {
      console.error('❌ FAILED: Temperature out of valid range (28-95°F)');
      console.error(`   Got: ${sst.mean_f?.toFixed(1)}°F`);
      console.error('\n   This suggests the conversion is still broken!');
      console.error('   Expected: 40-70°F for Mid-Atlantic in November');
      console.error('   If seeing 200\'s-300\'s: Conversion not applied (raw Kelvin)');
      console.error('   If seeing negative values: Double conversion bug\n');
      process.exit(1);
    }

    if (!inTypicalRange) {
      console.warn('⚠️  WARNING: Temperature is valid but outside typical range');
      console.warn(`   Got: ${sst.mean_f?.toFixed(1)}°F`);
      console.warn('   Expected: 40-70°F for Mid-Atlantic');
      console.warn('   This may be normal (cold front, unusual conditions)');
      console.warn('   Or may indicate a partial conversion issue\n');
    }

    if (isValid && inTypicalRange) {
      console.log('✅ SUCCESS: SST conversion is working correctly!\n');
      console.log('   Temperature is in expected range for this area.');
      console.log('   Conversion formula (K → °F) is functioning properly.\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Check server logs reminder
    console.log('💡 TIP: Check your terminal running `npm run dev` for logs like:');
    console.log('   [SST_CONV] 283.15K → 50.0°F');
    console.log('   This confirms the conversion is happening.\n');

  })
  .catch(err => {
    console.error('\n❌ Request failed:', err.message);
    console.error('\nMake sure:');
    console.error('  1. Dev server is running (npm run dev)');
    console.error('  2. You are on the fix/sst-conversion-final branch');
    console.error('  3. COPERNICUS_USER and COPERNICUS_PASS are set in .env.local\n');
    process.exit(1);
  });
