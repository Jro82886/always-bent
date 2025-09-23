// Test GFW API endpoints
// Run in browser console on the deployed site

console.log('🌊 Testing GFW API...\n');

// 1. Health check
fetch('/api/gfw/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Health:', data);
    if (!data.token?.present) {
      console.warn('⚠️ Token not configured!');
    }
  })
  .catch(e => console.error('❌ Health failed:', e));

// 2. Test with inlet
fetch('/api/gfw/vessels?inletId=ocean-city&days=7')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Inlet query response:', {
      configured: data.configured,
      vesselsCount: data.vessels?.length || 0,
      eventsCount: data.events?.length || 0,
      error: data.error
    });
    
    if (data.vessels?.length > 0) {
      console.log('First vessel:', data.vessels[0]);
      console.log('Gears found:', [...new Set(data.vessels.map(v => v.gear))]);
    }
    
    if (data.error) {
      console.error('⚠️ API returned error:', data.error);
    }
  })
  .catch(e => console.error('❌ Vessels query failed:', e));

// 3. Test with bbox (if map is available)
if (window.mapboxMap?.getBounds) {
  const bounds = window.mapboxMap.getBounds();
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(), 
    bounds.getEast(),
    bounds.getNorth()
  ].join(',');
  
  fetch(`/api/gfw/vessels?bbox=${bbox}&days=7`)
    .then(r => r.json())
    .then(data => {
      console.log('✅ BBOX query response:', {
        vesselsCount: data.vessels?.length || 0,
        eventsCount: data.events?.length || 0
      });
    })
    .catch(e => console.error('❌ BBOX query failed:', e));
} else {
  console.log('ℹ️ Map not available for BBOX test');
}

// 4. Check if GFW layer is visible
if (window.mapboxMap) {
  const hasLayer = window.mapboxMap.getLayer('gfw-dots');
  const hasSource = window.mapboxMap.getSource('gfw-vessels');
  console.log('Map state:', {
    hasGfwLayer: !!hasLayer,
    hasGfwSource: !!hasSource,
    layerVisible: hasLayer ? window.mapboxMap.getLayoutProperty('gfw-dots', 'visibility') : 'no layer'
  });
}

console.log('\n📝 If vessels are returned but not showing:');
console.log('1. Check that gear values are: "longliner", "trawler", or "drifting_longline"');
console.log('2. Verify Commercial Vessels toggle is ON');
console.log('3. Check browser console for [GFW] logs');
console.log('4. Ensure GFW_API_TOKEN is set in Vercel (no quotes)');