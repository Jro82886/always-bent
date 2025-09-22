// Check various API endpoints
console.log('=== API Health Check ===');

const endpoints = [
  '/api/gfw/vessels',
  '/api/gfw/vessels?inletId=ocean-city',
  '/api/fleet/online?inlet_id=ocean-city',
  '/api/weather?inlet=ocean-city'
];

endpoints.forEach(url => {
  fetch(url)
    .then(r => console.log(`✓ ${url} => ${r.status}`))
    .catch(e => console.log(`✗ ${url} => ERROR`));
});
