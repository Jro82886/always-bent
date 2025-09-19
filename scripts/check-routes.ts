import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(process.cwd(), 'src');
const offenders: string[] = [];

function walk(p: string) {
  for (const f of readdirSync(p)) {
    const fp = join(p, f);
    const st = statSync(fp);
    if (st.isDirectory()) {
      walk(fp);
    } else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
      const s = readFileSync(fp, 'utf8');
      
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
