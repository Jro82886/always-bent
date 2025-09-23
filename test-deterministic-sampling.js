#!/usr/bin/env node

/**
 * Test script to verify deterministic sampling
 * Should return IDENTICAL results for repeated calls
 */

const testPolygon = {
  type: "Polygon",
  coordinates: [[
    [-75.5, 38.5],
    [-75.5, 39.0],
    [-75.0, 39.0],
    [-75.0, 38.5],
    [-75.5, 38.5]
  ]]
};

const timeISO = new Date().toISOString();

async function testDeterministic() {
  console.log('🧪 Testing Deterministic Sampling\n');
  console.log('This should return IDENTICAL results for 3 consecutive calls:\n');
  
  const results = [];
  
  // Run 3 identical requests
  for (let i = 1; i <= 3; i++) {
    console.log(`Run #${i}:`);
    
    try {
      const response = await fetch('http://localhost:3000/api/rasters/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon: testPolygon,
          timeISO: timeISO,
          layers: ['sst', 'chl']
        })
      });
      
      const data = await response.json();
      
      if (data.ok && data.stats) {
        const sst = data.stats.sst;
        const chl = data.stats.chl;
        
        const result = {
          sst_mean: sst?.mean_f,
          sst_gradient: sst?.gradient_f,
          sst_valid: sst?.n_valid,
          chl_mean: chl?.mean,
          chl_gradient: chl?.gradient,
          chl_valid: chl?.n_valid
        };
        
        results.push(result);
        
        console.log(`  SST: ${sst?.mean_f?.toFixed(2)}°F ± ${sst?.gradient_f?.toFixed(2)}°F (${sst?.n_valid}/${sst?.n_valid + sst?.n_nodata} valid)`);
        console.log(`  CHL: ${chl?.mean?.toFixed(3)} mg/m³ ± ${chl?.gradient?.toFixed(3)} (${chl?.n_valid}/${chl?.n_valid + chl?.n_nodata} valid)\n`);
      } else {
        console.log('  ❌ Error:', data.error || 'Unknown error\n');
        results.push(null);
      }
    } catch (error) {
      console.log('  ❌ Request failed:', error.message, '\n');
      results.push(null);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Check if results are identical
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Deterministic Check:\n');
  
  if (results.every(r => r === null)) {
    console.log('❌ All requests failed - cannot verify determinism');
    return;
  }
  
  const validResults = results.filter(r => r !== null);
  const first = validResults[0];
  
  let allIdentical = true;
  for (let i = 1; i < validResults.length; i++) {
    const current = validResults[i];
    
    // Check if all values match
    for (const key in first) {
      if (first[key] !== current[key]) {
        console.log(`❌ Mismatch in ${key}: Run 1 = ${first[key]}, Run ${i+1} = ${current[key]}`);
        allIdentical = false;
      }
    }
  }
  
  if (allIdentical) {
    console.log('✅ DETERMINISTIC: All runs returned identical results!');
  } else {
    console.log('❌ NON-DETERMINISTIC: Results vary between runs');
  }
  
  console.log('\n📝 Acceptance Criteria:');
  console.log('  [' + (allIdentical ? '✓' : '✗') + '] Repeatability: Same polygon + time → identical numbers');
  console.log('  [ ] Viewport independence: Pan/zoom doesn\'t affect results');
  console.log('  [ ] Layer toggles: Only requested layers return data');
  console.log('  [ ] Nodata handling: Land polygons return null');
}

// Add test for viewport independence
async function testViewportIndependence() {
  console.log('\n\n🔍 Testing Viewport Independence\n');
  console.log('(In production, changing map zoom/pan should NOT affect results)\n');
  
  // This would need to be tested in the browser with actual map interaction
  console.log('⚠️  This test requires browser interaction - test manually by:');
  console.log('  1. Draw a polygon and get analysis');
  console.log('  2. Zoom in/out dramatically');
  console.log('  3. Draw the same polygon again');
  console.log('  4. Results should be IDENTICAL');
}

// Run tests
testDeterministic()
  .then(() => testViewportIndependence())
  .catch(console.error);
