// Snip Tool Debug Helper
// Paste this in the browser console to debug the snip tool

(() => {
  console.log('=== SNIP TOOL DEBUG ===');
  
  // Check if map exists
  const map = window.map || window.mapboxMap || window.abfiMap;
  console.log('1. Map instance exists?', !!map);
  
  if (!map) {
    console.error('❌ No map instance found. Check window.map');
    return;
  }
  
  // Check current cursor
  const cursor = map.getCanvas().style.cursor;
  console.log('2. Current cursor:', cursor || '(default)');
  
  // Check if startSnipping exists
  console.log('3. window.startSnipping exists?', typeof window.startSnipping === 'function');
  
  // Check snip button
  const snipButton = document.querySelector('[data-snip-button]');
  console.log('4. Hidden snip button found?', !!snipButton);
  
  // Check for overlays that might block
  const canvas = map.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const elementsAtCenter = document.elementsFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
  console.log('5. Elements above map center:', elementsAtCenter.map(el => ({
    tag: el.tagName,
    class: el.className,
    zIndex: window.getComputedStyle(el).zIndex
  })));
  
  // Try to force crosshair
  console.log('\n🔧 Forcing crosshair cursor...');
  map.getCanvas().style.cursor = 'crosshair';
  console.log('Cursor after force:', map.getCanvas().style.cursor);
  
  // Try clicking the button
  if (snipButton) {
    console.log('\n🔧 Clicking hidden snip button...');
    snipButton.click();
  } else if (window.startSnipping) {
    console.log('\n🔧 Calling window.startSnipping()...');
    window.startSnipping();
  }
  
  // Check state after click
  setTimeout(() => {
    console.log('\n📊 State after button click:');
    console.log('- Cursor:', map.getCanvas().style.cursor);
    console.log('- Canvas classes:', map.getCanvas().className);
    
    // Check Zustand store if available
    if (window.useAppState?.getState) {
      const state = window.useAppState.getState();
      console.log('- Store analysis state:', {
        showReviewCta: state.analysis?.showReviewCta,
        isZoomingToSnip: state.analysis?.isZoomingToSnip,
        pendingAnalysis: !!state.analysis?.pendingAnalysis
      });
    }
  }, 100);
  
  console.log('\n✅ Debug complete. Check logs above for issues.');
})();
