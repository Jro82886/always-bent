// Test Different Colormaps for CHL
console.log('=== TESTING CHL COLORMAPS ===');
console.log('Finding the right colormap to show GREEN chlorophyll!\n');

// Test different colormaps
const colormaps = [
  { name: 'jet', description: 'Classic blue-green-yellow-red' },
  { name: 'turbo', description: 'Rainbow-like (your current issue: too much red/blue)' },
  { name: 'viridis', description: 'Purple-green-yellow' },
  { name: 'plasma', description: 'Purple-pink-yellow' },
  { name: 'algae', description: 'Designed for chlorophyll!' },
  { name: 'dense', description: 'Blue-green-yellow optimized' },
  { name: 'haline', description: 'Ocean-focused blue-green' },
  { name: 'matter', description: 'Ocean biogeochemistry colors' }
];

console.log('Testing colormaps on tile 6/18/25...\n');

// Create a grid to display test tiles
const container = document.createElement('div');
container.style.cssText = 'position:fixed;top:10px;right:10px;background:black;padding:10px;z-index:9999;border:2px solid lime;max-height:90vh;overflow-y:auto;';
container.innerHTML = '<h3 style="color:lime;margin:0 0 10px 0;">CHL Colormap Tests</h3>';
document.body.appendChild(container);

// Test each colormap
colormaps.forEach((cmap, index) => {
  const testUrl = `/api/tiles/chl/6/18/25?time=latest&style=${cmap.name}`;
  
  fetch(testUrl)
    .then(r => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const div = document.createElement('div');
      div.style.cssText = 'display:inline-block;margin:5px;text-align:center;';
      div.innerHTML = `
        <img src="${url}" style="width:100px;height:100px;border:1px solid #666;">
        <div style="color:white;font-size:11px;margin-top:2px;">
          <strong>${cmap.name}</strong><br>
          <span style="color:#aaa;font-size:9px;">${cmap.description}</span>
        </div>
      `;
      container.appendChild(div);
    })
    .catch(err => {
      console.log(`❌ ${cmap.name}: Failed (${err.message})`);
    });
});

// Add close button
const closeBtn = document.createElement('button');
closeBtn.textContent = 'Close Tests';
closeBtn.style.cssText = 'display:block;width:100%;margin-top:10px;background:red;color:white;border:none;padding:5px;cursor:pointer;';
closeBtn.onclick = () => container.remove();
container.appendChild(closeBtn);

console.log('🎨 Colormap test panel shown (top right)');
console.log('\nLook for colormaps that show:');
console.log('- Blue for open ocean');
console.log('- GREEN for productive waters');
console.log('- Yellow/bright for highest concentrations');
console.log('\nThe "algae" or "haline" colormaps might be perfect!');

// Also test if we can use a custom color scale
console.log('\n💡 To use a better colormap, update CMEMS_CHL_WMTS_TEMPLATE in Vercel');
console.log('Change: STYLE=cmap:turbo');
console.log('To: STYLE=cmap:algae (or whichever shows green best)');

