// Complete GFW testing suite

// 1) Health check - should resolve quickly
console.log('=== Test 1: Health Check ===');
fetch('/api/gfw/health')
  .then(r => r.json())
  .then(data => console.log('Health:', data))
  .catch(err => console.error('Health error:', err));

// 2) Inlet query with correct parameter
setTimeout(() => {
  console.log('\n=== Test 2: Inlet Query (inletId) ===');
  fetch('/api/gfw/vessels?inletId=ocean-city&days=7')
    .then(r => {
      console.log('Status:', r.status, 'OK:', r.ok);
      return r.text();
    })
    .then(txt => {
      console.log('Response length:', txt.length);
      console.log('First 200 chars:', txt.slice(0, 200));
      try {
        const json = JSON.parse(txt);
        console.log('Parsed JSON:', json);
        if (json.vessels) {
          console.log('Vessel count:', json.vessels.length);
        }
      } catch (e) {
        console.warn('Parse error:', e.message);
      }
    })
    .catch(err => console.error('Fetch error:', err));
}, 1000);

// 3) Try with inlet_id parameter (your original)
setTimeout(() => {
  console.log('\n=== Test 3: Inlet Query (inlet_id) ===');
  fetch('/api/gfw/vessels?inlet_id=ocean-city&days=7')
    .then(r => {
      console.log('Status:', r.status, 'OK:', r.ok);
      return r.text();
    })
    .then(txt => {
      console.log('Response:', txt.slice(0, 200));
    })
    .catch(err => console.error('Fetch error:', err));
}, 2000);

// 4) BBOX test (if map available)
setTimeout(() => {
  console.log('\n=== Test 4: BBOX Query ===');
  // Try different possible map references
  const map = window.mapboxMap || window.map || document.querySelector('.mapboxgl-map')?._mapboxMap;
  
  if (!map || !map.getBounds) {
    console.warn('No map found to test bbox');
    return;
  }
  
  const bounds = map.getBounds();
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(), 
    bounds.getEast(),
    bounds.getNorth()
  ].join(',');
  
  console.log('Using bbox:', bbox);
  
  fetch(`/api/gfw/vessels?bbox=${bbox}&days=7`)
    .then(r => {
      console.log('Status:', r.status, 'OK:', r.ok);
      return r.text();
    })
    .then(txt => {
      console.log('Response:', txt.slice(0, 200));
    })
    .catch(err => console.error('Fetch error:', err));
}, 3000);
