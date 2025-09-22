// COPY AND PASTE THIS INTO BROWSER CONSOLE ON TRACKING PAGE

console.log('🔍 Debugging Fleet & GFW APIs...\n');

// 1. Test Fleet API
console.log('1️⃣ Testing Fleet API:');
fetch('/api/fleet/online?inlet_id=ny-montauk')
  .then(r => {
    console.log('   Status:', r.status);
    return r.text();
  })
  .then(text => {
    try {
      const data = JSON.parse(text);
      console.log('   Response:', data);
    } catch {
      console.log('   Raw response:', text.substring(0, 200));
    }
  })
  .catch(e => console.error('   Error:', e));

// 2. Test GFW API
setTimeout(() => {
  console.log('\n2️⃣ Testing GFW API:');
  const bounds = map.getBounds();
  const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
  
  fetch(`/api/gfw/vessels?bbox=${bbox}`)
    .then(r => r.json())
    .then(data => {
      console.log('   Configured:', data.configured);
      console.log('   Vessels:', data.vessels?.length || 0);
      console.log('   Events:', data.events?.length || 0);
      if (!data.configured) {
        console.log('   ❌ GFW token not configured');
      } else if (data.vessels?.length > 0) {
        console.log('   ✅ GFW is working!');
        console.log('   First vessel:', data.vessels[0]);
      }
    })
    .catch(e => console.error('   Error:', e));
}, 1000);

// 3. Check if map layers exist
setTimeout(() => {
  console.log('\n3️⃣ Checking map layers:');
  const layers = ['gfw-vessels', 'gfw-tracks', 'gfw-events', 'fleet-dots', 'fleet-clusters'];
  layers.forEach(id => {
    const layer = map.getLayer(id);
    console.log(`   ${id}:`, layer ? '✅ exists' : '❌ missing');
  });
}, 2000);

// 4. Check Supabase connection
setTimeout(() => {
  console.log('\n4️⃣ Testing direct Supabase query:');
  fetch('/api/reports/health')
    .then(r => r.json())
    .then(data => {
      console.log('   Database:', data.database ? '✅ connected' : '❌ not connected');
      console.log('   Tables:', data.tables);
      console.log('   Env vars:', data.env);
    })
    .catch(e => console.error('   Error:', e));
}, 3000);

console.log('\n📋 Check results above for issues...');
