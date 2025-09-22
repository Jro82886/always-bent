// Run this in browser console to debug GFW
(async () => {
  console.log('=== GFW Debug ===');
  
  // Test the API directly
  try {
    const response = await fetch('/api/gfw/vessels?inletId=ny-shinnecock&days=7');
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.configured === false) {
      console.warn('GFW is returning configured: false');
    } else if (data.vessels) {
      console.log('Found vessels:', data.vessels.length);
    }
  } catch (e) {
    console.error('API call failed:', e);
  }
})();
