// Correct GFW debug - run this in browser console
(async () => {
  console.log('=== Testing GFW API ===');
  
  try {
    // Note: it's 'inletId' not 'inlet_id'
    const response = await fetch('/api/gfw/vessels?inletId=ocean-city&days=7');
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.configured === false) {
      console.warn('❌ GFW is returning configured: false - check GFW_API_TOKEN in Vercel');
    } else if (data.vessels && data.vessels.length > 0) {
      console.log('✅ Found vessels:', data.vessels.length);
      console.log('First vessel:', data.vessels[0]);
    } else {
      console.log('⚠️ No vessels found in this area');
    }
  } catch (e) {
    console.error('❌ API call failed:', e);
  }
})();
