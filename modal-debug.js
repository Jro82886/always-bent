// 🔍 MODAL DEBUG COMMANDS
// Run these in console to debug why modal isn't showing

console.log('=== 🔍 MODAL DEBUG ===\n');

// 1. Check if modal exists in DOM
const modal = document.querySelector('[data-analysis-modal]');
console.log('1. Modal in DOM:', !!modal);
if (modal) {
  const styles = window.getComputedStyle(modal);
  console.log('   Display:', styles.display);
  console.log('   Opacity:', styles.opacity);
  console.log('   Z-index:', styles.zIndex);
  console.log('   Visibility:', styles.visibility);
}

// 2. Check React DevTools for SnipController state
console.log('\n2. To check React state:');
console.log('   - Open React DevTools');
console.log('   - Find SnipController component');
console.log('   - Check: showModal, currentAnalysis states');

// 3. Force show modal for testing
console.log('\n3. Force show test modal:');
console.log(`
// Create a test div to ensure modal can display
const testDiv = document.createElement('div');
testDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#000;color:#fff;padding:20px;z-index:99999;border:2px solid cyan;';
testDiv.innerHTML = '<h2>TEST: Modal should appear here</h2><p>If you see this, the modal system works</p>';
testDiv.onclick = () => testDiv.remove();
document.body.appendChild(testDiv);
`);

// 4. Check console for modal logs
console.log('\n4. Look for these logs when drawing:');
console.log('   - "Opening analysis modal with comprehensive data..."');
console.log('   - "AnalysisModal state: {visible: true, hasAnalysis: true}"');
console.log('   - "✅ Showing modal with analysis data"');

// 5. Manual trigger
console.log('\n5. After drawing a rectangle, check if analysis ran:');
console.log('   - Were there any red errors?');
console.log('   - Did you see "Extracted X real SST data points"?');

console.log('\n=== END DEBUG ===');
