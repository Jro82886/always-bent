#!/usr/bin/env node

/**
 * Quick TypeScript Check
 * Runs before build to catch type errors early
 */

const { exec } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Running TypeScript type check...\n'));

// Critical files that MUST pass type checking
const CRITICAL_FILES = [
  'src/components/SnipController.tsx',
  'src/components/SnipTool.tsx',
  'src/lib/analysis/sst-analyzer.ts',
  'src/lib/analysis/comprehensive-analyzer.ts',
  'src/lib/analysis/tile-data-extractor.ts'
];

// Run tsc with no emit to just check types
exec('npx tsc --noEmit --pretty', (error, stdout, stderr) => {
  if (!error) {
    console.log(chalk.green('✅ All TypeScript checks passed!\n'));
    process.exit(0);
  }

  // Parse errors
  console.log(chalk.red('❌ TypeScript errors found:\n'));
  
  const output = stdout || stderr;
  const lines = output.split('\n');
  
  let criticalError = false;
  let errorCount = 0;
  
  lines.forEach(line => {
    if (line.includes('error TS')) {
      errorCount++;
      
      // Check if it's in a critical file
      const isCritical = CRITICAL_FILES.some(file => line.includes(file));
      if (isCritical) {
        criticalError = true;
        console.log(chalk.red.bold('🚨 CRITICAL: ' + line));
      } else {
        console.log(chalk.yellow(line));
      }
    } else if (line.trim()) {
      console.log(line);
    }
  });

  console.log(chalk.red(`\n📊 Total errors: ${errorCount}`));
  
  if (criticalError) {
    console.log(chalk.red.bold('\n⛔ Build blocked due to critical errors!'));
    console.log(chalk.yellow('Fix errors in critical files before proceeding.\n'));
    process.exit(1);
  } else {
    console.log(chalk.yellow('\n⚠️  Non-critical errors found.'));
    console.log(chalk.yellow('Consider fixing these before deployment.\n'));
    // Allow build to continue for non-critical errors
    process.exit(0);
  }
});
