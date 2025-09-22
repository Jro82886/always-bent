// Test GFW normalization - run this in browser console after deployment
(async () => {
  console.log('=== Testing GFW API Normalization ===');
  
  try {
    const response = await fetch('/api/gfw/vessels?inletId=ny-shinnecock&days=7');
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Full response:', data);
    
    if (data.configured === false) {
      console.warn('❌ GFW is returning configured: false');
      return;
    }
    
    // Check structure
    if (data.vessels && data.vessels.length > 0) {
      const vessel = data.vessels[0];
      console.log('\n✅ First vessel structure:');
      console.log('- gear:', vessel.gear);
      console.log('- last_pos:', vessel.last_pos);
      console.log('- track length:', vessel.track?.length);
      
      // Verify expected fields
      const hasExpectedFields = 
        vessel.gear !== undefined &&
        vessel.last_pos?.lon !== undefined &&
        vessel.last_pos?.lat !== undefined &&
        vessel.last_pos?.t !== undefined &&
        Array.isArray(vessel.track);
        
      if (hasExpectedFields) {
        console.log('\n✅ All expected fields present!');
      } else {
        console.log('\n❌ Missing expected fields');
      }
    } else {
      console.log('No vessels in response');
    }
    
    console.log('\nEvents count:', data.events?.length || 0);
    
  } catch (e) {
    console.error('❌ API call failed:', e);
  }
})();
