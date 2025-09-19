// Quick diagnostic to check if env var contains the variable name itself

const envValue = process.env.CMEMS_CHL_WMTS_TEMPLATE;

console.log('Raw env value:', envValue);
console.log('Length:', envValue?.length);
console.log('Starts with "CMEMS"?', envValue?.startsWith('CMEMS'));
console.log('Starts with "https"?', envValue?.startsWith('https'));
console.log('First 100 chars:', envValue?.substring(0, 100));

// Check if it accidentally includes the variable name
if (envValue?.includes('CMEMS_CHL_WMTS_TEMPLATE=')) {
  console.log('\n⚠️  WARNING: Env var contains its own name!');
  console.log('Clean value would be:', envValue.replace('CMEMS_CHL_WMTS_TEMPLATE=', ''));
}
