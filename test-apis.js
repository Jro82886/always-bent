#!/usr/bin/env node

/**
 * Test script to verify all API integrations are working
 * Run with: node test-apis.js
 */

const https = require('https');
const http = require('http');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Test configuration
const tests = [
  {
    name: 'Supabase Connection',
    url: 'https://hobvjmmambhonsugehge.supabase.co/rest/v1/',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjcxMzEsImV4cCI6MjA3MzIwMzEzMX0.20xMzE0nYoDFzfLc4vIMnvprk48226exALM38FhXQqM',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYnZqbW1hbWJob25zdWdlaGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjcxMzEsImV4cCI6MjA3MzIwMzEzMX0.20xMzE0nYoDFzfLc4vIMnvprk48226exALM38FhXQqM'
    },
    expectedStatus: [200, 404] // 404 is ok if no default endpoint
  },
  {
    name: 'StormGlass Weather API',
    url: 'https://api.stormglass.io/v2/weather/point?lat=35.22&lng=-75.54&params=waterTemperature',
    headers: {
      'Authorization': 'b07a-0242ac130006-ad72e440-93f3-11f0-b07a-0242ac13000'
    },
    expectedStatus: [200]
  },
  {
    name: 'Global Fishing Watch API',
    // v3 API requires datasets in array format and either 'query' or 'where' parameter
    url: 'https://gateway.api.globalfishingwatch.org/v3/vessels/search?datasets[0]=public-global-vessel-identity:v3.0&query=fishing&limit=1',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJBQkZJIiwidXNlcklkIjo0OTc0NSwiYXBwbGljYXRpb25OYW1lIjoiQUJGSSIsImlkIjozMzIzLCJ0eXBlIjoidXNlci1hcHBsaWNhdGlvbiJ9LCJpYXQiOjE3NTg1NTQ0NzYsImV4cCI6MjA3MzkxNDQ3NiwiYXVkIjoiZ2Z3IiwiaXNzIjoiZ2Z3In0.H1s51GT1XBlDE2-CVD0EzfBOK1PUetSrEEJK94ipXtLEAc238nNIJnhnbjV4iYb7kCv4URJ8QZVBSQOpHs8kDFJhErYAIOGSi8igLzqPtx6KeceL0g03DQ3oQB2TkiL4Ad9O6oOJ8WfziZE9u8ILEldmJJI8Gp9rHoyVCAREl96st8AFSM6ZHW_U2i5FCn1zoDBkMoqP8-hZFLMGGnS8Qq8El92XfzTshvvHhWVdJSi0nU8-daAR1ttC2S6ewE0H2QI62dhEJCGe3Ni0yPKQPWamQyCgJW6NNvPeHZ_PyKQEFnSqGl-oRVRMOsXXKcE19GsGfxoBlJgwi-ldj6FfvRysafUP00-pkw6-nOF0OrIHCatQaW0rInTPjwYD4qZevESLsDI4Et-ZbtJPmottRjBP46eYAjw0WL8a6qrpyJBcCwfeaz5ia_nOK-snUVtSZnvg4v069FSmD5V9u_sA8EeO7uqsN9yyKKHbbAnk00HDuodstChh6As6iOveNR5m'
    },
    expectedStatus: [200]
  }
];

// Test local API endpoints
const localTests = [
  {
    name: 'Local Ocean Conditions API',
    url: 'http://localhost:3000/api/ocean-conditions?lat=35.22&lng=-75.54',
    expectedStatus: [200]
  },
  {
    name: 'Local GFW Vessels API',
    url: 'http://localhost:3000/api/gfw/vessels?bbox=-76,34,-74,36&days=1',
    expectedStatus: [200]
  },
  {
    name: 'Local StormIO API',
    url: 'http://localhost:3000/api/stormio?lat=35.22&lng=-75.54',
    expectedStatus: [200]
  }
];

// Test function
async function testAPI(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: test.headers || {}
    };

    const protocol = url.protocol === 'https:' ? https : http;

    console.log(`${colors.cyan}Testing: ${test.name}${colors.reset}`);
    console.log(`  URL: ${test.url.substring(0, 100)}...`);

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const success = test.expectedStatus.includes(res.statusCode);
        const color = success ? colors.green : colors.red;
        const symbol = success ? '✓' : '✗';

        console.log(`  Status: ${color}${res.statusCode} ${symbol}${colors.reset}`);

        if (!success) {
          console.log(`  ${colors.red}Expected: ${test.expectedStatus.join(' or ')}${colors.reset}`);
          if (data) {
            const preview = data.substring(0, 200);
            console.log(`  Response: ${preview}...`);
          }
        } else {
          console.log(`  ${colors.green}Success!${colors.reset}`);
        }
        console.log('');
        resolve(success);
      });
    });

    req.on('error', (error) => {
      console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
      console.log('');
      resolve(false);
    });

    req.setTimeout(10000, () => {
      console.log(`  ${colors.red}✗ Timeout${colors.reset}`);
      console.log('');
      req.abort();
      resolve(false);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`\n${colors.yellow}=== Testing External APIs ===${colors.reset}\n`);

  const externalResults = [];
  for (const test of tests) {
    const result = await testAPI(test);
    externalResults.push({ name: test.name, success: result });
  }

  console.log(`\n${colors.yellow}=== Testing Local API Endpoints ===${colors.reset}`);
  console.log(`${colors.cyan}Make sure your Next.js dev server is running on port 3000${colors.reset}\n`);

  const localResults = [];
  for (const test of localTests) {
    const result = await testAPI(test);
    localResults.push({ name: test.name, success: result });
  }

  // Summary
  console.log(`\n${colors.yellow}=== Test Summary ===${colors.reset}\n`);

  console.log('External APIs:');
  externalResults.forEach(r => {
    const symbol = r.success ? `${colors.green}✓` : `${colors.red}✗`;
    console.log(`  ${symbol} ${r.name}${colors.reset}`);
  });

  console.log('\nLocal Endpoints:');
  localResults.forEach(r => {
    const symbol = r.success ? `${colors.green}✓` : `${colors.red}✗`;
    console.log(`  ${symbol} ${r.name}${colors.reset}`);
  });

  const totalSuccess = [...externalResults, ...localResults].filter(r => r.success).length;
  const total = externalResults.length + localResults.length;

  console.log(`\n${colors.cyan}Results: ${totalSuccess}/${total} tests passed${colors.reset}\n`);

  if (totalSuccess === total) {
    console.log(`${colors.green}🎉 All tests passed! Your APIs are configured correctly.${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Check the configuration above.${colors.reset}\n`);
  }
}

// Run the tests
runTests().catch(console.error);