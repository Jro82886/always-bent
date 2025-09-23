// Run this in browser console to check SST configuration
console.log('SST Template:', process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || 'NOT SET');
console.log('CHL Template:', process.env.NEXT_PUBLIC_CHL_WMTS_TEMPLATE || 'NOT SET');

// Check if SST layer exists
const map = window.mapboxMap;
if (map) {
  console.log('SST Source:', map.getSource('sst-src'));
  console.log('SST Layer:', map.getLayer('sst-lyr'));
  console.log('SST Visibility:', map.getLayoutProperty('sst-lyr', 'visibility'));
  
  // Try to add SST manually
  if (!map.getSource('sst-src')) {
    console.log('Adding SST source manually...');
    map.addSource('sst-src', {
      type: 'raster',
      tiles: ['https://wmts.marine.copernicus.eu/teroWmts/GLOBAL_ANALYSISFORECAST_PHY_001_024/cmems_mod_glo_phy_anfc_0.083deg_PT1H-m_202406/6/{y}/{x}.png'],
      tileSize: 512
    });
    map.addLayer({
      id: 'sst-lyr',
      type: 'raster',
      source: 'sst-src',
      paint: { 'raster-opacity': 0.7 }
    });
    console.log('SST added manually!');
  }
}
