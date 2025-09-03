/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.resolve(process.cwd(), "src");

function findFiles(dir, matcher, list = []) {
  const ents = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
  for (const ent of ents) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) findFiles(full, matcher, list);
    else if (matcher.test(full)) list.push(full);
  }
  return list;
}

function grepFiles(files, needles) {
  const hits = [];
  for (const file of files) {
    const txt = fs.readFileSync(file, "utf8");
    for (const needle of needles) {
      if (txt.toLowerCase().includes(needle.toLowerCase())) {
        hits.push({ file, needle });
        break;
      }
    }
  }
  return hits;
}

function banner() {
  const line = "─".repeat(72);
  console.log(`\n${line}`);
  console.log("ABFI Dev Guard");
  console.log(`${line}`);
  console.log("• Tip: Run `npm run clean:start` if you see bulk/cascading errors.");
  console.log("• Guard: Ensure you have exactly ONE map component (src/lib/MapRef.tsx).");
  console.log("• Guard: Map container must be empty/self-closing to avoid Mapbox warnings.");
  console.log(`${line}\n`);
}

function main() {
  banner();

  // 1) Check for duplicate map components
  const tsLike = findFiles(SRC_DIR, /\.(t|j)sx?$/);
  const mapHits = grepFiles(tsLike, ["MapShell", "MapRef"]);
  const files = [...new Set(mapHits.map(h => h.file))];

  // Heuristic: if we find a MapShell component file alongside MapRef, warn
  const suspicious = files.filter(f =>
    /mapshell|mapref/i.test(path.basename(f)) && !f.includes("src/lib/MapRef.tsx")
  );

  if (suspicious.length > 0) {
    console.log("⚠️  Potential duplicate map components detected:");
    for (const f of suspicious) console.log("   -", path.relative(process.cwd(), f));
    console.log("   → Keep only `src/lib/MapRef.tsx` and update imports to `@/lib/MapRef`.\n");
  }

  // 2) Gentle reminder to reset if node_modules/.next caches look odd
  const hasNext = fs.existsSync(".next");
  const hasNM = fs.existsSync("node_modules");
  if (hasNext && hasNM) {
    console.log("ℹ️  If you recently pulled big changes, consider:");
    console.log("    `npm run clean:start` (purges caches, installs clean, typechecks)\n");
  }

  // 3) WMTS env guard: try to auto-restore missing critical keys from .env.local.bak.*
  const criticalKeys = [
    'COPERNICUS_WMTS_BASE',
  ];
  const optionalKeys = [
    'LAYER_SST_DAILY',
    'LAYER_CHL_DAILY',
    'COPERNICUS_WMTS_MATRIXSET',
    'COPERNICUS_WMTS_STYLE',
    'COPERNICUS_AUTH_TYPE',
    'COPERNICUS_TOKEN',
    'COPERNICUS_BASIC_USER',
    'COPERNICUS_BASIC_PASS',
  ];

  const dotenvPath = path.resolve(process.cwd(), '.env.local');
  const hasEnv = fs.existsSync(dotenvPath);
  const currentLines = hasEnv ? fs.readFileSync(dotenvPath, 'utf8').split(/\r?\n/) : [];
  const currentMap = Object.fromEntries(
    currentLines
      .filter(l => /^[A-Za-z_][A-Za-z0-9_]*=/.test(l))
      .map(l => [l.split('=')[0], l])
  );

  const needs = criticalKeys.filter(k => !currentMap[k]);
  if (needs.length > 0) {
    // search backups
    const dir = process.cwd();
    const backups = fs.readdirSync(dir).filter(n => n.startsWith('.env.local.bak.'));
    let restored = [];
    for (const bak of backups) {
      try {
        const txt = fs.readFileSync(path.join(dir, bak), 'utf8');
        for (const key of [...needs, ...optionalKeys]) {
          if (currentMap[key]) continue;
          const m = txt.match(new RegExp(`^${key}=[^\n\r]+`, 'm'));
          if (m) {
            currentMap[key] = m[0];
            restored.push(key);
          }
        }
      } catch {}
    }
    if (restored.length > 0) {
      // backup current, then write merged file
      const ts = Date.now();
      try { fs.copyFileSync(dotenvPath, `.env.local.bak.${ts}`); } catch {}
      const keep = currentLines.filter(l => !/^(COPERNICUS_|LAYER_)/.test(l));
      const merged = [
        ...keep,
        ...Object.values(currentMap),
      ].join('\n');
      fs.writeFileSync(dotenvPath, merged + '\n');
      console.log('🔧 Dev-Guard: Restored WMTS keys from backup:', restored.join(', '));
    } else if (needs.length > 0) {
      console.log('⚠️  WMTS not fully configured. Missing:', needs.join(', '));
      console.log('    Add them to .env.local to enable SST/CHL tiles.');
    }
  }
}

main();


