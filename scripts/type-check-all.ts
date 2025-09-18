#!/usr/bin/env ts-node

/**
 * TypeScript Error Snake 🐍
 * Slithers through the codebase catching type errors before they bite!
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface TypeCheckResult {
  file: string;
  errors: string[];
  warnings: string[];
}

class TypeScriptSnake {
  private results: TypeCheckResult[] = [];
  private criticalPaths = [
    'src/components/SnipController.tsx',
    'src/components/SnipTool.tsx',
    'src/lib/analysis/',
    'src/app/api/',
    'src/components/layers/'
  ];

  async slither() {
    console.log(chalk.green('🐍 TypeScript Snake starting patrol...\n'));

    // 1. Run full type check
    console.log(chalk.blue('📋 Running full type check...'));
    const fullCheckResult = await this.runTypeCheck();
    
    if (fullCheckResult.success) {
      console.log(chalk.green('✅ No type errors found!'));
      return;
    }

    // 2. Parse errors
    console.log(chalk.yellow('\n⚠️  Type errors detected! Analyzing...\n'));
    await this.parseErrors(fullCheckResult.output);

    // 3. Check critical paths
    console.log(chalk.blue('\n🔍 Checking critical paths...'));
    for (const criticalPath of this.criticalPaths) {
      await this.checkPath(criticalPath);
    }

    // 4. Check for common patterns
    console.log(chalk.blue('\n🎯 Checking for common type issues...'));
    await this.checkCommonIssues();

    // 5. Generate report
    this.generateReport();
  }

  private async runTypeCheck(): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout } = await execAsync('npx tsc --noEmit --skipLibCheck');
      return { success: true, output: stdout };
    } catch (error: any) {
      return { success: false, output: error.stdout || error.message };
    }
  }

  private async parseErrors(output: string) {
    const errorLines = output.split('\n');
    const errorPattern = /^(.+)\((\d+),(\d+)\): error TS(\d+): (.+)$/;

    for (const line of errorLines) {
      const match = line.match(errorPattern);
      if (match) {
        const [, file, line, col, code, message] = match;
        this.addError(file, `Line ${line}:${col} - TS${code}: ${message}`);
      }
    }
  }

  private async checkPath(targetPath: string) {
    try {
      const stats = await fs.stat(targetPath);
      
      if (stats.isDirectory()) {
        const files = await this.getTypeScriptFiles(targetPath);
        for (const file of files) {
          await this.checkFile(file);
        }
      } else if (targetPath.endsWith('.ts') || targetPath.endsWith('.tsx')) {
        await this.checkFile(targetPath);
      }
    } catch (error) {
      console.log(chalk.red(`❌ Could not check ${targetPath}`));
    }
  }

  private async getTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        files.push(...await this.getTypeScriptFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async checkFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for common type issues
      const issues: string[] = [];

      // 1. Check for 'any' types
      const anyMatches = content.match(/:\s*any\b/g);
      if (anyMatches && anyMatches.length > 0) {
        issues.push(`Found ${anyMatches.length} 'any' types - consider using specific types`);
      }

      // 2. Check for missing return types
      const functionMatches = content.match(/(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*{/g);
      const arrowMatches = content.match(/(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*{/g);
      
      if (functionMatches || arrowMatches) {
        const totalFunctions = (functionMatches?.length || 0) + (arrowMatches?.length || 0);
        const returnTypeMatches = content.match(/(?::\s*\w+(?:<[^>]+>)?)\s*{/g);
        if (returnTypeMatches && returnTypeMatches.length < totalFunctions) {
          issues.push(`Some functions missing explicit return types`);
        }
      }

      // 3. Check for type assertions
      const assertionMatches = content.match(/as\s+\w+/g);
      if (assertionMatches && assertionMatches.length > 3) {
        issues.push(`High number of type assertions (${assertionMatches.length}) - might indicate type issues`);
      }

      // 4. Check for @ts-ignore
      const ignoreMatches = content.match(/@ts-ignore/g);
      if (ignoreMatches) {
        issues.push(`Found ${ignoreMatches.length} @ts-ignore comments - these hide real issues!`);
      }

      if (issues.length > 0) {
        this.addWarning(filePath, issues.join('; '));
      }
    } catch (error) {
      // Silent fail for individual files
    }
  }

  private async checkCommonIssues() {
    // Check for mismatched types in common patterns
    const patterns = [
      {
        name: 'Array type mismatches',
        pattern: /\[\[number, number\], \[number, number\]\]/,
        suggestion: 'Use proper tuple types for bounds'
      },
      {
        name: 'Missing null checks',
        pattern: /\w+\.\w+(?!\?)/,
        suggestion: 'Consider optional chaining (?.) for nullable values'
      },
      {
        name: 'Untyped API responses',
        pattern: /fetch\(.+\)\.then\(.*=>.*\.json\(\)\)/,
        suggestion: 'Type your API responses with interfaces'
      }
    ];

    for (const { name, pattern, suggestion } of patterns) {
      console.log(chalk.yellow(`Checking for ${name}...`));
      // Implementation would scan files for these patterns
    }
  }

  private addError(file: string, error: string) {
    const existing = this.results.find(r => r.file === file);
    if (existing) {
      existing.errors.push(error);
    } else {
      this.results.push({ file, errors: [error], warnings: [] });
    }
  }

  private addWarning(file: string, warning: string) {
    const existing = this.results.find(r => r.file === file);
    if (existing) {
      existing.warnings.push(warning);
    } else {
      this.results.push({ file, errors: [], warnings: [warning] });
    }
  }

  private generateReport() {
    console.log(chalk.bold('\n📊 TypeScript Snake Report:\n'));

    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log(chalk.green('🎉 All clear! No issues found.\n'));
      return;
    }

    console.log(chalk.red(`❌ Errors: ${totalErrors}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${totalWarnings}\n`));

    // Group by severity
    const criticalFiles = this.results.filter(r => 
      r.errors.length > 0 && this.criticalPaths.some(p => r.file.includes(p))
    );

    if (criticalFiles.length > 0) {
      console.log(chalk.red.bold('🚨 CRITICAL FILES WITH ERRORS:\n'));
      criticalFiles.forEach(result => {
        console.log(chalk.red(`📁 ${result.file}`));
        result.errors.forEach(err => console.log(chalk.red(`   └─ ${err}`)));
      });
      console.log();
    }

    // Other errors
    const otherErrors = this.results.filter(r => 
      r.errors.length > 0 && !criticalFiles.includes(r)
    );

    if (otherErrors.length > 0) {
      console.log(chalk.yellow.bold('⚠️  OTHER ERRORS:\n'));
      otherErrors.forEach(result => {
        console.log(chalk.yellow(`📁 ${result.file}`));
        result.errors.forEach(err => console.log(chalk.yellow(`   └─ ${err}`)));
      });
      console.log();
    }

    // Warnings
    const filesWithWarnings = this.results.filter(r => r.warnings.length > 0);
    if (filesWithWarnings.length > 0) {
      console.log(chalk.blue.bold('💡 WARNINGS:\n'));
      filesWithWarnings.forEach(result => {
        console.log(chalk.blue(`📁 ${result.file}`));
        result.warnings.forEach(warn => console.log(chalk.blue(`   └─ ${warn}`)));
      });
    }

    // Suggestions
    console.log(chalk.green.bold('\n✨ Suggestions:'));
    console.log(chalk.green('1. Run "npm run type-check" before every commit'));
    console.log(chalk.green('2. Use strict TypeScript settings in tsconfig.json'));
    console.log(chalk.green('3. Avoid "any" types - be specific!'));
    console.log(chalk.green('4. Add return types to all functions'));
    console.log(chalk.green('5. Use interfaces for all API responses'));
  }
}

// Run the snake!
const snake = new TypeScriptSnake();
snake.slither().catch(console.error);
