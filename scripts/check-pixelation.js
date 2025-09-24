#!/usr/bin/env node
const { execSync } = require('node:child_process');

function grep(pattern) {
  try {
    return execSync(`git grep -n -- ${JSON.stringify(pattern)} -- 'src/components/layers/**/*.tsx'`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
}

const sst = grep("'raster-resampling': 'linear'\n'\n' src/components/layers/SSTLayer.tsx");
const chl = grep("'raster-resampling': 'linear'\n'\n' src/components/layers/CHLLayer.tsx");

if (sst.includes("SSTLayer.tsx") || chl.includes("CHLLayer.tsx")) {
  console.error('\n[PIXELATION] Found linear resampling in SST/CHL layers. Please use \'nearest\'.');
  process.exit(1);
}

process.exit(0);


