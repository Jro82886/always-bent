#!/usr/bin/env node

/**
 * ABFI Automated Audit System
 * Continuously monitors code quality and reports issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ABFIAuditSystem {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.stats = {};
  }

  // Run all audit checks
  async runFullAudit() {
    console.log('🔍 ABFI Automated Audit System Starting...\n');
    
    const startTime = Date.now();
    
    // Run all checks
    this.checkBuildErrors();
    this.checkTypeScriptErrors();
    this.checkConsoleStatements();
    this.checkTodoComments();
    this.checkMockData();
    this.checkEnvVariables();
    this.checkUnusedDependencies();
    this.checkFileSize();
    this.checkSecurity();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Generate report
    this.generateReport(duration);
    
    // Exit with error if critical issues found
    if (this.issues.length > 0) {
      process.exit(1);
    }
  }

  checkBuildErrors() {
    console.log('📦 Checking build...');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      console.log('✅ Build successful\n');
    } catch (error) {
      this.issues.push({
        type: 'BUILD_ERROR',
        severity: 'CRITICAL',
        message: 'Build failed - check npm run build for details'
      });
      console.log('❌ Build failed\n');
    }
  }

  checkTypeScriptErrors() {
    console.log('🔷 Checking TypeScript...');
    try {
      const output = execSync('npx tsc --noEmit 2>&1', { stdio: 'pipe' }).toString();
      if (output.includes('error')) {
        const errorCount = (output.match(/error/g) || []).length;
        this.issues.push({
          type: 'TYPE_ERROR',
          severity: 'HIGH',
          message: `Found ${errorCount} TypeScript errors`
        });
        console.log(`❌ ${errorCount} TypeScript errors found\n`);
      } else {
        console.log('✅ No TypeScript errors\n');
      }
    } catch (error) {
      // TypeScript returns non-zero exit code when errors found
      const output = error.stdout ? error.stdout.toString() : '';
      const errorCount = (output.match(/error TS/g) || []).length;
      if (errorCount > 0) {
        this.issues.push({
          type: 'TYPE_ERROR',
          severity: 'HIGH',
          message: `Found ${errorCount} TypeScript errors`
        });
        console.log(`❌ ${errorCount} TypeScript errors found\n`);
      }
    }
  }

  checkConsoleStatements() {
    console.log('🗣️ Checking console statements...');
    try {
      const output = execSync('grep -r "console\\." src --include="*.ts" --include="*.tsx" | wc -l', { stdio: 'pipe' }).toString();
      const count = parseInt(output.trim());
      
      if (count > 50) {
        this.warnings.push({
          type: 'CONSOLE_LOGS',
          severity: 'MEDIUM',
          message: `Found ${count} console statements (threshold: 50)`
        });
        console.log(`⚠️  ${count} console statements found (consider removing)\n`);
      } else if (count > 0) {
        console.log(`📝 ${count} console statements found (acceptable)\n`);
      } else {
        console.log('✅ No console statements\n');
      }
      
      this.stats.consoleLogs = count;
    } catch (error) {
      console.log('⚠️  Could not check console statements\n');
    }
  }

  checkTodoComments() {
    console.log('📋 Checking TODO comments...');
    try {
      const output = execSync('grep -r "TODO\\|FIXME\\|XXX\\|HACK" src --include="*.ts" --include="*.tsx" | wc -l', { stdio: 'pipe' }).toString();
      const count = parseInt(output.trim());
      
      if (count > 20) {
        this.warnings.push({
          type: 'TODO_COMMENTS',
          severity: 'LOW',
          message: `Found ${count} TODO/FIXME comments`
        });
        console.log(`⚠️  ${count} TODO comments found\n`);
      } else if (count > 0) {
        console.log(`📝 ${count} TODO comments found\n`);
      } else {
        console.log('✅ No TODO comments\n');
      }
      
      this.stats.todos = count;
    } catch (error) {
      console.log('⚠️  Could not check TODO comments\n');
    }
  }

  checkMockData() {
    console.log('🎭 Checking for mock data...');
    try {
      const output = execSync('grep -r "mock\\|Mock\\|MOCK\\|fake\\|Fake\\|FAKE" src --include="*.ts" --include="*.tsx" | wc -l', { stdio: 'pipe' }).toString();
      const count = parseInt(output.trim());
      
      if (count > 30) {
        this.warnings.push({
          type: 'MOCK_DATA',
          severity: 'MEDIUM',
          message: `Found ${count} references to mock/fake data`
        });
        console.log(`⚠️  ${count} mock data references found\n`);
      } else if (count > 0) {
        console.log(`📝 ${count} mock data references found\n`);
      } else {
        console.log('✅ No mock data references\n');
      }
      
      this.stats.mockData = count;
    } catch (error) {
      console.log('⚠️  Could not check mock data\n');
    }
  }

  checkEnvVariables() {
    console.log('🔐 Checking environment variables...');
    
    // Check if .env.example exists
    if (!fs.existsSync('.env.example')) {
      this.warnings.push({
        type: 'ENV_MISSING',
        severity: 'HIGH',
        message: 'Missing .env.example file'
      });
      console.log('⚠️  No .env.example file found\n');
    } else {
      console.log('✅ .env.example exists\n');
    }
  }

  checkUnusedDependencies() {
    console.log('📚 Checking dependencies...');
    try {
      // This is a simple check - for production use depcheck package
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
      
      console.log(`📦 ${depCount} dependencies, ${devDepCount} dev dependencies\n`);
      
      this.stats.dependencies = depCount;
      this.stats.devDependencies = devDepCount;
    } catch (error) {
      console.log('⚠️  Could not check dependencies\n');
    }
  }

  checkFileSize() {
    console.log('📏 Checking build size...');
    try {
      const output = execSync('du -sh .next 2>/dev/null || echo "0"', { stdio: 'pipe' }).toString();
      const size = output.split('\t')[0];
      console.log(`📦 Build size: ${size}\n`);
      this.stats.buildSize = size;
    } catch (error) {
      console.log('⚠️  Could not check build size\n');
    }
  }

  checkSecurity() {
    console.log('🔒 Checking security...');
    try {
      const output = execSync('npm audit --json 2>/dev/null', { stdio: 'pipe' }).toString();
      const audit = JSON.parse(output);
      
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const total = vulns.total || 0;
        
        if (vulns.critical > 0) {
          this.issues.push({
            type: 'SECURITY',
            severity: 'CRITICAL',
            message: `${vulns.critical} critical vulnerabilities found`
          });
          console.log(`❌ ${vulns.critical} critical vulnerabilities\n`);
        } else if (vulns.high > 0) {
          this.warnings.push({
            type: 'SECURITY',
            severity: 'HIGH',
            message: `${vulns.high} high vulnerabilities found`
          });
          console.log(`⚠️  ${vulns.high} high vulnerabilities\n`);
        } else if (total > 0) {
          console.log(`📝 ${total} low/moderate vulnerabilities\n`);
        } else {
          console.log('✅ No vulnerabilities found\n');
        }
        
        this.stats.vulnerabilities = total;
      }
    } catch (error) {
      console.log('⚠️  Could not run security audit\n');
    }
  }

  generateReport(duration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT REPORT SUMMARY');
    console.log('='.repeat(60));
    
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      duration: `${duration}s`,
      status: this.issues.length === 0 ? 'PASSED' : 'FAILED',
      issues: this.issues,
      warnings: this.warnings,
      stats: this.stats
    };
    
    // Write JSON report
    fs.writeFileSync(
      'audit-report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Write Markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync('AUDIT_REPORT.md', markdown);
    
    // Console output
    if (this.issues.length > 0) {
      console.log(`\n❌ FAILED - ${this.issues.length} critical issues found:`);
      this.issues.forEach(issue => {
        console.log(`   • [${issue.severity}] ${issue.message}`);
      });
    } else {
      console.log('\n✅ PASSED - No critical issues found');
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warnings:`);
      this.warnings.forEach(warning => {
        console.log(`   • [${warning.severity}] ${warning.message}`);
      });
    }
    
    console.log('\n📈 Statistics:');
    Object.entries(this.stats).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });
    
    console.log(`\n📄 Full reports saved to:`);
    console.log(`   • audit-report.json`);
    console.log(`   • AUDIT_REPORT.md`);
    console.log(`\n⏱️  Audit completed in ${duration} seconds\n`);
  }

  generateMarkdownReport(report) {
    return `# 🔍 ABFI Automated Audit Report

**Generated:** ${report.timestamp}  
**Duration:** ${report.duration}  
**Status:** ${report.status}

## ${report.status === 'PASSED' ? '✅' : '❌'} Overall Status

${report.issues.length === 0 
  ? 'No critical issues found. System is healthy!' 
  : `Found ${report.issues.length} critical issues that need attention.`}

## 🚨 Critical Issues
${report.issues.length === 0 
  ? 'None' 
  : report.issues.map(i => `- **[${i.severity}]** ${i.message}`).join('\n')}

## ⚠️ Warnings
${report.warnings.length === 0 
  ? 'None' 
  : report.warnings.map(w => `- **[${w.severity}]** ${w.message}`).join('\n')}

## 📊 Statistics
${Object.entries(report.stats).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}

## 🎯 Recommendations

${this.generateRecommendations(report)}

---
*This report was automatically generated by the ABFI Audit System*
`;
  }

  generateRecommendations(report) {
    const recs = [];
    
    if (report.stats.consoleLogs > 50) {
      recs.push('- Remove excessive console.log statements before production');
    }
    
    if (report.stats.todos > 20) {
      recs.push('- Address TODO comments or move to issue tracker');
    }
    
    if (report.stats.mockData > 30) {
      recs.push('- Replace mock data with real implementations');
    }
    
    if (report.stats.vulnerabilities > 0) {
      recs.push('- Run `npm audit fix` to resolve security vulnerabilities');
    }
    
    if (!fs.existsSync('.env.example')) {
      recs.push('- Create .env.example file for deployment documentation');
    }
    
    return recs.length > 0 ? recs.join('\n') : '- System is in good shape!';
  }
}

// Run audit if called directly
if (require.main === module) {
  const audit = new ABFIAuditSystem();
  audit.runFullAudit();
}

module.exports = ABFIAuditSystem;
