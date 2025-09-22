// Test GFW API again
const testGFW = async () => {
  console.log('Testing GFW API after token update...\n');
  
  try {
    const response = await fetch('https://always-bent.vercel.app/api/gfw/vessels?bbox=-74,39,-73,41');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.configured === false) {
      console.log('\n❌ Still showing configured: false');
      console.log('The deployment may need time to pick up the new env var');
      console.log('Or the token might need to be regenerated');
    } else if (data.error) {
      console.log('\n⚠️  GFW API error:', data.error);
      console.log('This might indicate a token issue');
    } else if (data.vessels) {
      console.log(`\n✅ GFW is working! Found ${data.vessels.length} vessels`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Test multiple times with delay
const runTests = async () => {
  await testGFW();
  console.log('\nWaiting 5 seconds and testing again...');
  setTimeout(async () => {
    await testGFW();
  }, 5000);
};

runTests();
