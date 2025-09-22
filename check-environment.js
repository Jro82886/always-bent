// Check what environment we're in
console.log('=== Environment Check ===');
console.log('Current URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Protocol:', window.location.protocol);
console.log('Port:', window.location.port || '(default)');

const isDev = window.location.hostname === 'localhost';
const isVercel = window.location.hostname.includes('vercel.app');
const isProd = window.location.hostname === 'always-bent-g4pw1ic8n-jro82886s-projects.vercel.app';

console.log('\nEnvironment:', isDev ? 'Development' : isVercel ? 'Vercel Preview/Prod' : 'Unknown');

// Try a simple test endpoint
console.log('\n=== Testing Simple Endpoint ===');
fetch('/api/test-chat-read?inlet_id=ocean-city')
  .then(r => {
    console.log('Test endpoint status:', r.status);
    return r.text();
  })
  .then(text => {
    console.log('Test response:', text.substring(0, 100));
  })
  .catch(err => console.error('Test error:', err));

// If in development, check if the dev server is running properly
if (isDev) {
  console.log('\n=== Dev Server Check ===');
  console.log('If APIs are hanging in dev, try:');
  console.log('1. Restart the dev server (Ctrl+C then npm run dev)');
  console.log('2. Check terminal for any error messages');
  console.log('3. Make sure .env.local has all required variables');
}
