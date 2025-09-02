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
}

main();


