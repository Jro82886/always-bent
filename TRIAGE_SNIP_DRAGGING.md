# Snip Tool Map Dragging - Triage Guide

## Quick Console Tests (paste in browser)

```javascript
// 1. Check what snip tools are loaded
console.log('Window snip functions:', {
  startSnipping: typeof window.startSnipping,
  armSnipTool: typeof window.armSnipTool,
  testSnipOverlay: typeof window.testSnipOverlay
});

// 2. Check if multiple instances
const allSnipButtons = document.querySelectorAll('[data-snip-button]');
console.log('Snip buttons found:', allSnipButtons.length);
allSnipButtons.forEach((btn, i) => console.log(`Button ${i}:`, btn));

// 3. Test map freeze directly
const map = window.mapboxMap;
if (map) {
  console.log('Before freeze:', {
    dragPan: map.dragPan.isEnabled(),
    interactive: map._interactive
  });
  
  // Try nuclear freeze
  map.dragPan.disable();
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.dragRotate.disable();
  map.doubleClickZoom.disable();
  map.keyboard.disable();
  map.touchZoomRotate.disable();
  map._interactive = false;
  
  console.log('After freeze:', {
    dragPan: map.dragPan.isEnabled(),
    interactive: map._interactive
  });
  
  // Test if you can still drag (you shouldn't be able to)
  console.log('Try dragging now - map should be frozen');
}

// 4. Check event listeners on canvas
const canvas = map?.getCanvas();
if (canvas) {
  // Get all event listeners (Chrome DevTools)
  console.log('Canvas listeners:', getEventListeners?.(canvas));
}

// 5. Force remove ALL map handlers
if (map) {
  map.off(); // Remove all event listeners
  console.log('All map event listeners removed - try drawing now');
}
```

## Nuclear Options to Try

### Option 1: CSS Pointer Lock
```javascript
// Add to map container
const mapContainer = document.querySelector('.mapboxgl-map');
mapContainer.style.cssText += 'pointer-events: none !important;';
```

### Option 2: Invisible Blocking Iframe
```javascript
const iframe = document.createElement('iframe');
iframe.style.cssText = `
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 999999;
  background: transparent;
  pointer-events: auto;
`;
document.body.appendChild(iframe);
```

### Option 3: Request Pointer Lock API
```javascript
canvas.requestPointerLock();
// This locks the mouse to the canvas
```

## Surgical Fixes (in order)

1. **Remove ALL old snip tools**
   - Delete imports of old SnipTool
   - Remove from UnifiedToolbar
   - Only keep SnipOverlay approach

2. **Use document-level capture**
   ```javascript
   document.addEventListener('mousedown', handler, true);
   // Not canvas, not map, but document
   ```

3. **Disable map before mounting snip tool**
   ```javascript
   map.remove(); // Nuclear option
   // Draw rectangle
   map = new mapboxgl.Map(...); // Recreate
   ```

4. **Use pointer-events CSS**
   ```css
   .mapboxgl-canvas-container {
     pointer-events: none !important;
   }
   ```
