// Simple GFW debug with immediate feedback
console.log('Starting GFW test...');

// First, let's check with the correct parameter name
fetch('/api/gfw/vessels?inletId=ocean-city&days=7')
  .then(r => {
    console.log('HTTP Status:', r.status);
    return r.text();
  })
  .then(text => {
    console.log('Raw response:', text);
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Not JSON:', e.message);
    }
  })
  .catch(err => {
    console.error('Fetch error:', err);
  });

// Also try with inlet_id (your original parameter)
setTimeout(() => {
  console.log('\nTrying with inlet_id parameter...');
  fetch('/api/gfw/vessels?inlet_id=ocean-city&days=7')
    .then(r => {
      console.log('HTTP Status (inlet_id):', r.status);
      return r.text();
    })
    .then(text => {
      console.log('Raw response (inlet_id):', text);
    })
    .catch(err => {
      console.error('Fetch error (inlet_id):', err);
    });
}, 1000);
