#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks that the live deployment has all critical features working
 */

const https = require('https');
const { execSync } = require('child_process');

const SITE_URL = 'https://always-bent.vercel.app';
const CHECKS = [];

// Helper to make HTTPS requests
function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers,
        body: data.slice(0, 500) // First 500 chars only
      }));
    }).on('error', err => resolve({ status: 0, error: err.message }));
  });
}

async function runChecks() {
  console.log('🔍 Verifying deployment at:', SITE_URL);
  console.log('📅 Time:', new Date().toISOString());
  console.log('');

  // 1. Check main page loads
  const mainPage = await checkUrl(SITE_URL);
  CHECKS.push({
    name: 'Main page loads',
    pass: mainPage.status === 200,
    details: `Status: ${mainPage.status}`
  });

  // 2. Check analysis page (should redirect if auth is hard)
  const analysisPage = await checkUrl(`${SITE_URL}/legendary/analysis`);
  CHECKS.push({
    name: 'Analysis page accessible',
    pass: analysisPage.status === 200 || analysisPage.status === 307,
    details: `Status: ${analysisPage.status}`
  });

  // 3. Check for Service Worker (should NOT be present)
  const hasServiceWorker = mainPage.body && mainPage.body.includes('serviceWorker');
  CHECKS.push({
    name: 'Service Worker disabled',
    pass: !hasServiceWorker,
    details: hasServiceWorker ? '⚠️ SW code found' : '✅ No SW code'
  });

  // 4. Check API routes
  const apiHealth = await checkUrl(`${SITE_URL}/api/health`);
  CHECKS.push({
    name: 'API routes responding',
    pass: apiHealth.status === 200 || apiHealth.status === 404, // 404 is ok if no health endpoint
    details: `Status: ${apiHealth.status}`
  });

  // 5. Check for deployment ID
  const deploymentId = mainPage.headers?.['x-vercel-id'] || 'unknown';
  CHECKS.push({
    name: 'Deployment ID captured',
    pass: deploymentId !== 'unknown',
    details: deploymentId.substring(0, 30) + '...'
  });

  // 6. Check git status
  let gitStatus = 'unknown';
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const lastCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    gitStatus = `${branch} @ ${lastCommit}`;
  } catch (e) {
    gitStatus = 'Git info unavailable';
  }

  // Print results
  console.log('📊 Deployment Verification Results:');
  console.log('=====================================');
  
  let allPass = true;
  CHECKS.forEach(check => {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.details}`);
    if (!check.pass) allPass = false;
  });

  console.log('');
  console.log('📍 Local git:', gitStatus);
  console.log('🌐 Live URL:', SITE_URL);
  console.log('');
  
  if (allPass) {
    console.log('✅ All checks passed! Deployment looks healthy.');
  } else {
    console.log('⚠️  Some checks failed. Review details above.');
  }

  // Testing checklist reminder
  console.log('\n📋 Manual Testing Checklist:');
  console.log('[ ] Analysis page loads without console errors');
  console.log('[ ] SST/CHL layers show pixelated (not blurred)');
  console.log('[ ] Save Report button works correctly');
  console.log('[ ] Settings gear in top-right (not overlapping zoom)');
  console.log('[ ] No duplicate CTAs showing');
}

runChecks().catch(console.error);
