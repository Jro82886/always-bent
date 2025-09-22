// Direct API tests without needing map

console.log('=== Testing GFW API directly ===\n');

// 1) Health check first
console.log('1. Health check...');
fetch('/api/gfw/health')
  .then(r => {
    console.log('Health status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('Health response:', data);
    console.log('Token present:', data.token?.present);
    console.log('Token preview:', data.token?.preview);
  })
  .catch(err => console.error('Health error:', err));

// 2) Test with a known inlet
setTimeout(() => {
  console.log('\n2. Testing with Ocean City inlet...');
  const url = '/api/gfw/vessels?inletId=ocean-city&days=7';
  console.log('Fetching:', url);
  
  fetch(url)
    .then(r => {
      console.log('Response status:', r.status);
      console.log('Response OK:', r.ok);
      console.log('Response headers:', Object.fromEntries(r.headers.entries()));
      return r.text();
    })
    .then(text => {
      console.log('Response length:', text.length);
      if (text.length === 0) {
        console.warn('Empty response!');
        return;
      }
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
        
        if (data.configured === false) {
          console.warn('GFW not configured - check token');
        } else if (data.vessels) {
          console.log('Found vessels:', data.vessels.length);
          if (data.vessels.length > 0) {
            console.log('First vessel:', data.vessels[0]);
          }
        }
      } catch (e) {
        console.error('Parse error:', e);
        console.log('Raw text:', text.substring(0, 500));
      }
    })
    .catch(err => console.error('Fetch error:', err));
}, 1000);

// 3) Test with a hardcoded bbox (Ocean City area)
setTimeout(() => {
  console.log('\n3. Testing with bbox...');
  // Ocean City approximate bbox
  const bbox = '-74.8,-38.9,-74.3,-38.4';
  const url = `/api/gfw/vessels?bbox=${bbox}&days=7`;
  
  fetch(url)
    .then(r => {
      console.log('Bbox response status:', r.status);
      return r.text();
    })
    .then(text => {
      console.log('Bbox response preview:', text.substring(0, 200));
    })
    .catch(err => console.error('Bbox error:', err));
}, 2000);
