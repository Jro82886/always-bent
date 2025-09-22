// Enhanced Snip Tool Debug Script v2
// Paste this in the browser console to diagnose snip tool issues

(() => {
  console.log('%c=== ENHANCED SNIP TOOL DEBUG ===', 'color:#00e1a7;font-weight:bold');
  
  // 1. Check map instances
  const maps = {
    mapboxMap: (globalThis as any).mapboxMap,
    map: (window as any).map,
  };
  console.log('1. Map instances:', Object.entries(maps).filter(([k,v]) => !!v).map(([k]) => k));
  
  const map = maps.mapboxMap || maps.map;
  if (!map) {
    console.error('❌ No map instance found. Check window.mapboxMap or window.map');
    return;
  }
  
  // 2. Check current cursor
  const cursor = map.getCanvas().style.cursor;
  console.log('2. Current cursor:', cursor || '(default)');
  console.log('   Expected: crosshair (if in draw mode)');
  
  // 3. Check button and handlers
  const snipButton = document.querySelector('[data-snip-button]');
  console.log('3. Hidden snip button found?', !!snipButton);
  console.log('   window.startSnipping exists?', typeof window.startSnipping === 'function');
  
  // 4. Check for blocking overlays
  const canvas = map.getCanvas();
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + rect.width/2;
  const centerY = rect.top + rect.height/2;
  const elementsAtCenter = document.elementsFromPoint(centerX, centerY);
  
  console.log('4. Elements above map center:');
  elementsAtCenter.slice(0, 5).forEach((el, i) => {
    const styles = window.getComputedStyle(el);
    console.log(`   ${i}: ${el.tagName}.${el.className || '(no class)'}`, {
      zIndex: styles.zIndex,
      pointerEvents: styles.pointerEvents,
      position: styles.position
    });
  });
  
  // 5. Check Zustand state if available
  if (typeof useAppState !== 'undefined' && useAppState.getState) {
    const state = useAppState.getState();
    console.log('5. Zustand analysis state:', {
      showReviewCta: state.analysis?.showReviewCta,
      isZoomingToSnip: state.analysis?.isZoomingToSnip,
      pendingAnalysis: !!state.analysis?.pendingAnalysis,
      narrative: state.analysis?.narrative?.substring(0, 50) + '...'
    });
  } else {
    console.log('5. Zustand state not accessible from console');
  }
  
  // 6. Test actions
  console.log('\n%c🔧 TESTING ACTIONS:', 'color:#46E6D4;font-weight:bold');
  
  // Force crosshair
  console.log('6a. Forcing crosshair cursor...');
  map.getCanvas().style.cursor = 'crosshair';
  console.log('    Result:', map.getCanvas().style.cursor);
  
  // Try button click
  if (snipButton) {
    console.log('6b. Simulating button click...');
    console.log('    Watch for [SNIP] logs below:');
    snipButton.click();
  } else if (window.startSnipping) {
    console.log('6b. Calling window.startSnipping()...');
    window.startSnipping();
  } else {
    console.log('6b. ⚠️  No button or startSnipping function found');
  }
  
  // Check state after click
  setTimeout(() => {
    console.log('\n7. State after actions:');
    console.log('   Cursor:', map.getCanvas().style.cursor);
    console.log('   Canvas classes:', map.getCanvas().className);
    
    // Look for review CTA
    const reviewCta = document.querySelector('[data-review-cta]');
    console.log('   Review CTA visible?', !!reviewCta);
    
    // Check for snip outline
    const snipOutline = map.getSource('snip-outline');
    console.log('   Snip outline source exists?', !!snipOutline);
  }, 500);
  
  // 8. Failure diagnosis
  console.log('\n%c📊 COMMON ISSUES:', 'color:#ff6b6b');
  console.log('• No onClick logs → Button not wired or not mounted');
  console.log('• onClick but no "Button clicked" → Handler error');
  console.log('• Cursor won\'t change → Overlay blocking (check #4)');
  console.log('• Works once then dies → State stuck (check #5)');
  
  console.log('\n✅ Debug complete. Check logs above.');
  
  // Quick fix attempt
  console.log('\n%c🚑 QUICK FIX (force enable):', 'color:#ffd43b');
  console.log('map.getCanvas().style.cursor = "crosshair";');
  console.log('// Then try drawing');
})();
