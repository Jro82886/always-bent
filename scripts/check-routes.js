const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'src');
const offenders = [];

function walk(p) {
  for (const f of fs.readdirSync(p)) {
    const fp = path.join(p, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      walk(fp);
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

walk(ROOT);

if (offenders.length) {
  console.error('❌ Non-legendary routes found:\n' + offenders.join('\n'));
  process.exit(1);
}

console.log('✅ Route check passed');
