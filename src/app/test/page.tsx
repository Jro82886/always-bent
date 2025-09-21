export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>Test Page - App is Running!</h1>
      <p>If you can see this, the app deployed successfully.</p>
      
      <h2>Environment Check:</h2>
      <pre style={{ backgroundColor: '#2a2a2a', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify({
          MAPBOX: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'SET' : 'NOT SET',
          MEMBERSTACK: process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID ? 'SET' : 'NOT SET',
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
        }, null, 2)}
      </pre>
      
      <p>Check browser console for any errors.</p>
    </div>
  );
}
