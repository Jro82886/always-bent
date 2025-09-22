// Test GFW API endpoint
const testGFW = async () => {
  try {
    // Test the API endpoint
    const response = await fetch('https://always-bent.vercel.app/api/gfw/vessels?bbox=-74,39,-73,41');
    const data = await response.json();
    
    console.log('GFW API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.configured === false) {
      console.log('\n❌ GFW is returning configured: false');
      console.log('This means the GFW_API_TOKEN is not set in Vercel');
    } else if (data.vessels) {
      console.log(`\n✅ GFW is working! Found ${data.vessels.length} vessels`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testGFW();
