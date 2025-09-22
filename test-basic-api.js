// Test basic API connectivity
console.log('Testing basic API...');

// Test with a simple timeout to see results
const testUrl = '/api/gfw/vessels?inletId=ocean-city&days=7';
console.log('Fetching:', testUrl);

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch(testUrl, { signal: controller.signal })
  .then(response => {
    clearTimeout(timeoutId);
    console.log('Response received!');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(text => {
    console.log('Body length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    try {
      const json = JSON.parse(text);
      console.log('Parsed successfully:', json);
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  })
  .catch(error => {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Request timed out after 5 seconds');
    } else {
      console.error('Fetch error:', error);
    }
  });

// Also check if we're in development or production
console.log('Current URL:', window.location.href);
console.log('Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');
