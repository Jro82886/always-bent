// Test new GFW API implementation
console.log('=== Testing New GFW API ===\n');

// 1. Health check
console.log('1. Health check...');
fetch('/api/gfw/health')
  .then(r => r.json())
  .then(data => {
    console.log('✓ Health:', data);
    if (data.token?.present) {
      console.log('✓ Token is configured!');
    } else {
      console.warn('⚠️ Token not configured');
    }
  })
  .catch(err => console.error('✗ Health error:', err));

// 2. Test with inlet
setTimeout(() => {
  console.log('\n2. Testing Ocean City inlet...');
  fetch('/api/gfw/vessels?inlet_id=ocean-city&days=7')
    .then(r => r.json())
    .then(data => {
      console.log('Response:', data);
      if (data.ok && data.data?.vessels) {
        console.log(`✓ Found ${data.data.vessels.length} vessels`);
        if (data.data.vessels.length > 0) {
          console.log('First vessel:', data.data.vessels[0]);
        }
      } else if (!data.ok) {
        console.error('✗ Error:', data.stage, data.error);
      }
    })
    .catch(err => console.error('✗ Fetch error:', err));
}, 500);

// 3. Test with bbox (Ocean City area)
setTimeout(() => {
  console.log('\n3. Testing with bbox...');
  const bbox = '-75.4,37.6,-74.8,38.6';
  fetch(`/api/gfw/vessels?bbox=${bbox}&days=7`)
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        console.log(`✓ Bbox query returned ${data.data?.vessels?.length || 0} vessels`);
      } else {
        console.log('✗ Bbox error:', data.stage, data.error);
      }
    })
    .catch(err => console.error('✗ Fetch error:', err));
}, 1000);
