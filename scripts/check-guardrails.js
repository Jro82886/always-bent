const { readdirSync, statSync, readFileSync } = require('fs');
const { join } = require('path');

const offenders = [];

function scan(dir) {
  for (const f of readdirSync(dir)) {
    const fp = join(dir, f);
    const st = statSync(fp);
    if (st.isDirectory()) {
      scan(fp);
    } else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
      const s = readFileSync(fp, 'utf8');
      
      // Check for bad dynamic imports
      if (/import\s*{\s*dynamic\s*}\s*from\s*['"]next\/dynamic['"]/.test(s)) {
        offenders.push(fp + ' — bad dynamic import');
      }
      
      // Check for shadowed dynamic
      if (/^\s*const\s+dynamic\s*=/m.test(s)) {
        offenders.push(fp + ' — dynamic shadowed');
      }
      
      // Check for non-legendary routes
      if (/href=['"]\/(community|analysis|tracking|trends)\b(?!\/legendary)/.test(s)) {
        offenders.push(fp + ' — non-legendary route');
      }
    }
  }
}

scan(join(process.cwd(), 'src'));

if (offenders.length) {
  console.error('❌ Guardrail violations found:\n' + offenders.join('\n'));
  process.exit(1);
}

console.log('✅ Guardrails check passed');
