const fs = require('fs');
const path = require('path');

// Allowed top-level routes in src/app
const ALLOWED_ROOTS = [
  '/',
  '/auth',  // Keep auth routes for now
  '/api',   // API routes
  '/legendary',
  '/legendary/analysis',
  '/legendary/tracking', 
  '/legendary/community',
  '/legendary/trends',
  '/legendary/profile',
  '/legendary/welcome',
  '/legendary/debug'
];

const APP_DIR = path.join(process.cwd(), 'src/app');
const violations = [];

// Check for non-trunk app routes
function checkAppRoutes(dir, relativePath = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const itemPath = path.join(relativePath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Check if this directory contains a page.tsx
      const pagePath = path.join(fullPath, 'page.tsx');
      if (fs.existsSync(pagePath)) {
        const route = '/' + itemPath.replace(/\\/g, '/');
        
        // Check if this route is allowed
        const isAllowed = ALLOWED_ROOTS.some(allowed => 
          route === allowed || 
          route.startsWith(allowed + '/') ||
          (allowed === '/auth' && route.startsWith('/auth/')) ||
          (allowed === '/api' && route.startsWith('/api/'))
        );
        
        if (!isAllowed) {
          violations.push(route);
        }
      }
      
      // Recurse into subdirectories
      checkAppRoutes(fullPath, itemPath);
    }
  }
}

// Check for hardcoded non-legendary routes in code
const SRC_DIR = path.join(process.cwd(), 'src');
const offenders = [];

function checkCode(p) {
  for (const f of fs.readdirSync(p)) {
    const fp = path.join(p, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      checkCode(fp);
    } else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
      const s = fs.readFileSync(fp, 'utf8');
      
      // Check for hardcoded routes without legendary
      const bad =
        /href=['"]\/(community|trends|tracking|analysis)\b(?!\/legendary)/.test(s) ||
        /router\.(push|replace)\(['"]\/(community|trends|tracking|analysis)\b(?!\/legendary)/.test(s) ||
        /redirect\(['"]\/(community|trends|tracking|analysis)\b(?!\/legendary)/.test(s) ||
        /pathname\.startsWith\(['"]\/(community|trends|tracking|analysis)\b(?!\/legendary)/.test(s);
      
      if (bad) {
        offenders.push(fp.replace(process.cwd(), '.'));
      }
    }
  }
}

// Run checks
checkAppRoutes(APP_DIR);
checkCode(SRC_DIR);

// Report results
let hasErrors = false;

if (violations.length > 0) {
  console.error('❌ Non-trunk routes found:');
  violations.forEach(route => console.error(`  - ${route}`));
  hasErrors = true;
}

if (offenders.length > 0) {
  console.error('❌ Non-legendary route references found:');
  offenders.forEach(file => console.error(`  - ${file}`));
  hasErrors = true;
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('✅ Route check passed');
}
