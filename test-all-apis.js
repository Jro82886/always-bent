// Test all failing APIs
const testAPIs = async () => {
  const baseUrl = 'https://always-bent.vercel.app';
  
  console.log('Testing API endpoints...\n');
  
  // 1. Test fleet/online
  console.log('1. Testing /api/fleet/online');
  try {
    const fleetRes = await fetch(`${baseUrl}/api/fleet/online?inlet_id=ny-montauk`);
    console.log('   Status:', fleetRes.status);
    if (!fleetRes.ok) {
      const text = await fleetRes.text();
      console.log('   Error:', text.substring(0, 200));
    } else {
      const data = await fleetRes.json();
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200));
    }
  } catch (e) {
    console.log('   Failed:', e.message);
  }
  
  // 2. Test GFW
  console.log('\n2. Testing /api/gfw/vessels');
  try {
    const gfwRes = await fetch(`${baseUrl}/api/gfw/vessels?bbox=-74,39,-73,41`);
    const gfwData = await gfwRes.json();
    console.log('   Status:', gfwRes.status);
    console.log('   Configured:', gfwData.configured);
    console.log('   Vessels:', gfwData.vessels?.length || 0);
  } catch (e) {
    console.log('   Failed:', e.message);
  }
  
  // 3. Test weather
  console.log('\n3. Testing /api/weather');
  try {
    const weatherRes = await fetch(`${baseUrl}/api/weather?inlet=ny-montauk`);
    console.log('   Status:', weatherRes.status);
    const weatherData = await weatherRes.json();
    console.log('   Has SST:', !!weatherData.weather?.sstC);
  } catch (e) {
    console.log('   Failed:', e.message);
  }
};

testAPIs();
