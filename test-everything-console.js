// PASTE THIS IN BROWSER CONSOLE ON TRACKING PAGE
// Tests Fleet, GFW, Chat, and Map layers

console.log('🔍 COMPREHENSIVE SYSTEM TEST\n');

// 1. Test Fleet API
console.log('1️⃣ FLEET VESSELS:');
fetch('/api/fleet/online?inlet_id=' + (window.selectedInletId || 'ny-montauk'))
  .then(r => {
    console.log('   Status:', r.status, r.status === 200 ? '✅' : '❌');
    return r.json();
  })
  .then(data => {
    if (Array.isArray(data)) {
      console.log('   Vessels found:', data.length);
      if (data.length > 0) console.log('   First vessel:', data[0]);
    } else {
      console.log('   Error:', data);
    }
  })
  .catch(e => console.error('   Failed:', e));

// 2. Test GFW API
setTimeout(() => {
  console.log('\n2️⃣ GFW COMMERCIAL VESSELS:');
  const bounds = map.getBounds();
  const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
  
  fetch(`/api/gfw/vessels?bbox=${bbox}`)
    .then(r => r.json())
    .then(data => {
      console.log('   Configured:', data.configured, data.configured ? '✅' : '❌');
      console.log('   Vessels:', data.vessels?.length || 0);
      console.log('   Events:', data.events?.length || 0);
      
      if (data.configured && data.vessels?.length > 0) {
        console.log('   ✅ GFW WORKING! Sample vessel:', {
          name: data.vessels[0].name,
          type: data.vessels[0].type,
          flag: data.vessels[0].flag
        });
      } else if (!data.configured) {
        console.log('   ❌ GFW token not set in Vercel');
      }
    });
}, 500);

// 3. Check current user for chat
setTimeout(() => {
  console.log('\n3️⃣ CHAT USER:');
  const store = window.useAppState?.getState();
  console.log('   User ID:', store?.user?.id || 'NOT SET ❌');
  console.log('   Anonymous ID in localStorage:', localStorage.getItem('abfi_anon_uid'));
  
  if (!store?.user?.id) {
    console.log('   ⚠️  Chat won\'t work without user ID');
  } else {
    console.log('   ✅ Chat should work');
  }
}, 1000);

// 4. Check map layers
setTimeout(() => {
  console.log('\n4️⃣ MAP LAYERS:');
  const layers = {
    'fleet-dots': 'Fleet vessels',
    'fleet-clusters': 'Fleet clusters',
    'gfw-vessels': 'GFW vessels',
    'gfw-tracks': 'GFW tracks', 
    'gfw-events': 'Fishing events',
    'user-vessel': 'Your vessel',
    'sst-layer': 'SST overlay',
    'chl-layer': 'Chlorophyll overlay'
  };
  
  Object.entries(layers).forEach(([id, name]) => {
    const exists = !!map.getLayer(id);
    console.log(`   ${name}:`, exists ? '✅' : '❌', id);
  });
}, 1500);

// 5. Quick database check
setTimeout(() => {
  console.log('\n5️⃣ DATABASE CONNECTION:');
  fetch('/api/reports/health')
    .then(r => r.json())
    .then(data => {
      console.log('   Database:', data.database ? '✅ Connected' : '❌ Not connected');
      console.log('   Reports table:', data.tables?.reports ? '✅' : '❌');
      console.log('   Chat table:', data.tables?.chat_messages ? '✅' : '❌');
      console.log('   Vessels view:', data.tables?.vessels_latest ? '✅' : '❌');
    })
    .catch(() => console.log('   ❌ Health check failed'));
}, 2000);

console.log('\n⏳ Running tests... check results above in 2 seconds');
