// Fail fast if expected schema modules are missing
const fs = require(fs);
const ok =
  fs.existsSync(src/schemas) &&
  (fs.existsSync(src/schemas/report.v1.ts) || fs.existsSync(src/schemas/report.v1.tsx)) &&
  (fs.existsSync(src/schemas/snip.v1.ts)   || fs.existsSync(src/schemas/snip.v1.tsx));
if (!ok) {
  console.error(Schema
