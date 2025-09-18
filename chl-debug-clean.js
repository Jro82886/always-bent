// Copy and paste this entire block into your browser console:

// Force CHL to maximum visibility
if (map.getLayer('chl-lyr')) {
  map.setPaintProperty('chl-lyr', 'raster-opacity', 1);
  map.setPaintProperty('chl-lyr', 'raster-saturation', 1);
  map.setPaintProperty('chl-lyr', 'raster-contrast', 0.5);
  map.setPaintProperty('chl-lyr', 'raster-brightness-min', 0);
  map.setPaintProperty('chl-lyr', 'raster-brightness-max', 1);
  map.setPaintProperty('chl-lyr', 'raster-hue-rotate', 40);
  
  // Check layer order
  const layers = map.getStyle().layers;
  const chlIndex = layers.findIndex(l => l.id === 'chl-lyr');
  const landIndex = layers.findIndex(l => l.id.includes('land'));
  console.log('CHL at position:', chlIndex);
  console.log('Land at position:', landIndex);
  console.log('CHL is below land:', chlIndex < landIndex);
  
  // Move CHL to top temporarily to test
  const topLayer = layers[layers.length - 1];
  map.moveLayer('chl-lyr', topLayer.id);
  console.log('Moved CHL to top!');
}

// Test a single tile directly
fetch('/api/tiles/chl/5/9/12?time=latest')
  .then(r => {
    console.log('Tile status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    return r.blob();
  })
  .then(blob => {
    console.log('Blob size:', blob.size);
    console.log('Blob type:', blob.type);
    
    // Create an image to verify it's valid
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      console.log('✅ Image valid!', img.width + 'x' + img.height);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      console.log('❌ Image invalid!');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
