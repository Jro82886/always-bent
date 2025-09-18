// Compare SST (working) vs CHL (not showing)

console.log('=== SST vs CHL Comparison ===');

// Check if SST is visible
const sstVisible = map.getLayer('sst-lyr') && map.getLayoutProperty('sst-lyr', 'visibility') === 'visible';
const chlVisible = map.getLayer('chl-lyr') && map.getLayoutProperty('chl-lyr', 'visibility') === 'visible';

console.log('SST layer exists:', !!map.getLayer('sst-lyr'), '| visible:', sstVisible);
console.log('CHL layer exists:', !!map.getLayer('chl-lyr'), '| visible:', chlVisible);

// Compare their positions
const layers = map.getStyle().layers;
const sstIndex = layers.findIndex(l => l.id === 'sst-lyr');
const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');

console.log('\nLayer positions (0 = bottom):');
console.log('SST position:', sstIndex);
console.log('CHL position:', chlIndex);

// Compare paint properties
if (map.getLayer('sst-lyr')) {
  console.log('\nSST paint properties:');
  console.log('  opacity:', map.getPaintProperty('sst-lyr', 'raster-opacity'));
  console.log('  saturation:', map.getPaintProperty('sst-lyr', 'raster-saturation'));
}

if (map.getLayer('chl-lyr')) {
  console.log('\nCHL paint properties:');
  console.log('  opacity:', map.getPaintProperty('chl-lyr', 'raster-opacity'));
  console.log('  saturation:', map.getPaintProperty('chl-lyr', 'raster-saturation'));
}

// Test both tiles
console.log('\nTesting tiles at zoom 5, x:9, y:12...');
Promise.all([
  fetch('/api/tiles/sst/5/9/12?time=latest').then(r => ({ type: 'SST', status: r.status, blob: r.blob() })),
  fetch('/api/tiles/chl/5/9/12?time=latest').then(r => ({ type: 'CHL', status: r.status, blob: r.blob() }))
]).then(async results => {
  for (const result of results) {
    const blob = await result.blob;
    console.log(`${result.type}: status=${result.status}, size=${blob.size} bytes`);
  }
});
