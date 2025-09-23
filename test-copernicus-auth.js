#!/usr/bin/env node

// Direct test of Copernicus WMTS authentication
// This will help diagnose if credentials are working

const testAuth = async () => {
  console.log('🔐 Testing Copernicus Authentication...\n');
  
  // Test a simple GetCapabilities request
  const baseUrl = 'https://wmts.marine.copernicus.eu/teroWmts';
  
  // These should be your Copernicus credentials
  const user = process.env.COPERNICUS_USER || '';
  const pass = process.env.COPERNICUS_PASS || '';
  
  if (!user || !pass) {
    console.log('❌ COPERNICUS_USER or COPERNICUS_PASS not set in environment');
    console.log('Set them with:');
    console.log('  export COPERNICUS_USER="your-username"');
    console.log('  export COPERNICUS_PASS="your-password"');
    return;
  }
  
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass.substring(0, 3)}***\n`);
  
  const url = `${baseUrl}?service=WMTS&request=GetCapabilities&version=1.0.0`;
  
  try {
    console.log('Testing GetCapabilities...');
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
      }
    });
    
    console.log(`Response Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Authentication successful!');
      const text = await response.text();
      
      // Check if SST layer exists
      if (text.includes('GLOBAL_ANALYSISFORECAST_PHY_001_024')) {
        console.log('✅ SST layer found in capabilities');
      } else {
        console.log('❌ SST layer not found');
      }
      
      // Check if CHL layer exists  
      if (text.includes('OCEANCOLOUR_ATL_BGC_L4_MY_009_118')) {
        console.log('✅ CHL layer found in capabilities');
      } else {
        console.log('❌ CHL layer not found');
      }
      
    } else if (response.status === 401) {
      console.log('❌ Authentication failed - check credentials');
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testAuth();
