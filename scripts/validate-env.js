#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Ensures all required environment variables are properly set
 */

const fs = require('fs');
const path = require('path');

// Define required environment variables
const REQUIRED_ENV_VARS = {
  // Copernicus/CMEMS
  COPERNICUS_USER: {
    description: 'Copernicus Marine username',
    example: 'jrosenkilde'
  },
  COPERNICUS_PASS: {
    description: 'Copernicus Marine password',
    example: 'your-password'
  },
  CMEMS_SST_WMTS_TEMPLATE: {
    description: 'SST WMTS endpoint template',
    example: 'https://wmts.marine.copernicus.eu/...'
  },
  CMEMS_CHL_WMTS_TEMPLATE: {
    description: 'Chlorophyll WMTS endpoint template',
    example: 'https://wmts.marine.copernicus.eu/...'
  },
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: {
    description: 'Supabase project URL',
    example: 'https://xxxxx.supabase.co'
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    description: 'Supabase anonymous key',
    example: 'eyJ...'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase service role key',
    example: 'eyJ...'
  },
  
  // Mapbox
  NEXT_PUBLIC_MAPBOX_TOKEN: {
    description: 'Mapbox access token',
    example: 'pk.eyJ1I...'
  }
};

// Load .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

console.log('🔍 Validating Environment Variables\n');

let hasErrors = false;
const missing = [];
const invalid = [];

// Check each required variable
Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
  const value = process.env[key];
  
  if (!value) {
    missing.push({ key, ...config });
    hasErrors = true;
  } else {
    // Basic validation
    if (key.includes('_URL') && !value.startsWith('http')) {
      invalid.push({ key, value, reason: 'Must be a valid URL' });
      hasErrors = true;
    }
    if (key.includes('_KEY') && value.length < 20) {
      invalid.push({ key, value: value.substring(0, 10) + '...', reason: 'Key seems too short' });
      hasErrors = true;
    }
  }
});

// Report results
if (missing.length > 0) {
  console.log('❌ Missing Environment Variables:\n');
  missing.forEach(({ key, description, example }) => {
    console.log(`  ${key}`);
    console.log(`    Description: ${description}`);
    console.log(`    Example: ${example}\n`);
  });
}

if (invalid.length > 0) {
  console.log('⚠️  Invalid Environment Variables:\n');
  invalid.forEach(({ key, value, reason }) => {
    console.log(`  ${key} = ${value}`);
    console.log(`    Issue: ${reason}\n`);
  });
}

if (!hasErrors) {
  console.log('✅ All required environment variables are set!\n');
  
  // Show current Copernicus config
  console.log('📊 Copernicus Configuration:');
  console.log(`  User: ${process.env.COPERNICUS_USER}`);
  console.log(`  SST Layer: ${process.env.CMEMS_SST_WMTS_TEMPLATE ? 'Configured' : 'Not configured'}`);
  console.log(`  CHL Layer: ${process.env.CMEMS_CHL_WMTS_TEMPLATE ? 'Configured' : 'Not configured'}`);
} else {
  console.log('\n💡 Next Steps:');
  console.log('1. Add missing variables to .env.local');
  console.log('2. Run: npm run validate-env');
  console.log('3. Copy variables to Vercel dashboard');
  process.exit(1);
}
