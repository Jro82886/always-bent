#!/usr/bin/env node
const { execSync } = require('node:child_process');

function grep(pattern) {
  try {
    return execSync(`git grep -n -- ${JSON.stringify(pattern)} -- 'src/components/layers/**/*.tsx'`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    return '';
  }
}

const sst = grep("'raster-resampling': 'nearest'");
const chl = grep("'raster-resampling': 'nearest'");

if (sst.includes("SSTLayer.tsx") || chl.includes("CHLLayer.tsx")) {
  console.error('\n[SMOOTH RENDERING] Found nearest resampling in SST/CHL layers. Please use \'linear\' for smooth rendering.');
  process.exit(1);
}

process.exit(0);


