// Quick test to check the API
const fetch = require('node-fetch');

async function testReportsAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/reports?limit=50');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Total reports:', data.data?.length || 0);
    
    if (data.data) {
      const snips = data.data.filter(r => r.type === 'snip');
      const bites = data.data.filter(r => r.type === 'bite');
      
      console.log('Snips:', snips.length);
      console.log('Bites:', bites.length);
      
      if (bites.length > 0) {
        console.log('\nFirst bite:', JSON.stringify(bites[0], null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testReportsAPI();
