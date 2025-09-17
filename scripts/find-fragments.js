#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/copernicus-sla/[z]/[x]/[y]/route.ts',
  'src/app/api/copernicus-thermocline/[z]/[x]/[y]/route.ts',
  'src/app/api/copernicus/[z]/[x]/[y]/route.ts',
  'src/app/api/sst-features/route.ts',
  'src/app/api/tiles/chl/[z]/[x]/[y]/route.ts',
  'src/app/api/tiles/sst/[z]/[x]/[y]/route.ts',
  'src/app/auth/signup/page.tsx',
  'src/app/legendary/analysis/page.tsx',
  'src/app/legendary/tracking/page.tsx',
  'src/components/CatchReportForm.tsx',
  'src/components/layers/SSTLayer.tsx',
  'src/components/LayersRuntime.tsx',
  'src/components/ReportCatchButton.tsx',
  'src/components/SnipController.tsx',
  'src/components/SnipTool.tsx',
  'src/components/tracking/CommercialVesselLayer.tsx',
  'src/components/tracking/DepartureMonitor.tsx',
  'src/components/tracking/VesselLayer.tsx',
  'src/components/trends/TrendsMode.tsx',
  'src/lib/analysis/pixel-extractor.ts'
];

// Patterns that indicate console.log fragments
const suspiciousPatterns = [
  /^\s*'\);/m,           // Line starting with ');
  /^\s*`\);/m,           // Line starting with `);
  /^\s*\);$/m,           // Line with just );
  /^\s*,\s*'[^']*'\);/m, // Line starting with , 'text');
  /^\s*}\w+/m,           // Line starting with }word (like }mi)
  /^\s*\]\}`\);/m,       // Line ending with ]}`);
  /^\s*\[0\]}`\);/m,     // Pattern like [0]}`);
  /^\s*\+ '[^']*'\);/m,  // Pattern like + 'text');
];

console.log('Scanning files for console.log fragments...\n');

let totalIssues = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          line: index + 1,
          content: line.trim(),
          pattern: pattern.toString()
        });
      }
    });
  });
  
  if (issues.length > 0) {
    console.log(`\n📁 ${file}`);
    console.log(`   Found ${issues.length} suspicious patterns:`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: "${issue.content}"`);
    });
    totalIssues += issues.length;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Total issues found: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('✅ No console.log fragments detected!');
} else {
  console.log('❌ Please fix the issues above before building.');
}
