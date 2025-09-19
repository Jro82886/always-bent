// QUICK CHL TEST - One line to paste

// Test API and show result
fetch('/api/tiles/chl/6/18/25?time=latest').then(r => console.log(`CHL API: ${r.status} ${r.status === 502 ? '❌ ENV NOT SET' : r.status === 200 ? '✅ WORKING' : '⚠️ ERROR'}`)).then(() => console.log(`Layer: ${!!map.getLayer('lyr:chl')} | Source: ${!!map.getSource('src:chl')} | Visible: ${map.getLayoutProperty('lyr:chl', 'visibility') || 'N/A'}`));

