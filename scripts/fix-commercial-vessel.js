#!/usr/bin/env node
const fs = require('fs');

// Read the file
const filePath = './src/components/tracking/CommercialVesselLayer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove any stray backticks and console.log fragments
content = content.replace(/^\s*`\);\s*$/gm, ''); // Remove lines with just `);
content = content.replace(/^\s*\);\s*$/gm, ''); // Remove lines with just );

// Fix the specific issue around line 102-103
content = content.replace(
  /if \(latestPosition\.lon > coastlineLng\) \{\s*`\);/g,
  'if (latestPosition.lon > coastlineLng) {'
);

// Remove duplicate style settings (cssText and individual)
content = content.replace(
  /el\.style\.cssText = `[^`]*`;\s*(el\.style\.position[^;]*;\s*el\.style\.width[^;]*;\s*el\.style\.height[^;]*;\s*el\.style\.cursor[^;]*;)?/g,
  `el.style.position = 'relative';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.cursor = 'pointer';`
);

// Write the fixed content back
fs.writeFileSync(filePath, content);
console.log('✅ Fixed CommercialVesselLayer.tsx');
