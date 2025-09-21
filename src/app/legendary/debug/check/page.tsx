'use client';

import { useEffect, useState } from 'react';

export default function CheckPage() {
  const [status, setStatus] = useState<any>({
    checking: true,
    mapboxToken: null,
    mapboxValid: false,
    error: null
  });

  useEffect(() => {
    const checkMapbox = async () => {
      try {
        // Check if token exists
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        
        if (!token) {
          setStatus({
            checking: false,
            mapboxToken: null,
            mapboxValid: false,
            error: 'Token not found'
          });
          return;
        }

        // Token exists, show it (partially hidden)
        const hiddenToken = token.substring(0, 10) + '...' + token.substring(token.length - 10);
        
        // Try to validate with Mapbox
        const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`;
        const response = await fetch(testUrl);
        
        setStatus({
          checking: false,
          mapboxToken: hiddenToken,
          mapboxValid: response.ok,
          error: response.ok ? null : `Mapbox API returned ${response.status}`,
          fullToken: token // For debugging
        });

      } catch (error) {
        setStatus({
          checking: false,
          mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Set but error' : null,
          mapboxValid: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkMapbox();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Environment Check</h1>
      
      {status.checking ? (
        <div className="text-cyan-400 animate-pulse">Checking configuration...</div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Mapbox Token Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Token Present:</span>
                <span className={status.mapboxToken ? 'text-green-500' : 'text-red-500'}>
                  {status.mapboxToken ? '✅ YES' : '❌ NO'}
                </span>
              </div>
              
              {status.mapboxToken && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Token Value:</span>
                    <code className="text-cyan-400 bg-gray-900 px-2 py-1 rounded text-sm">
                      {status.mapboxToken}
                    </code>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Token Valid:</span>
                    <span className={status.mapboxValid ? 'text-green-500' : 'text-red-500'}>
                      {status.mapboxValid ? '✅ YES' : '❌ NO'}
                    </span>
                  </div>
                </>
              )}
              
              {status.error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded">
                  <p className="text-red-400">Error: {status.error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">All Environment Variables</h2>
            <div className="space-y-2 font-mono text-sm">
              <div>NEXT_PUBLIC_MAPBOX_TOKEN: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ Set' : '❌ Not set'}</div>
              <div>NEXT_PUBLIC_MEMBERSTACK_APP_ID: {process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID ? '✅ Set' : '❌ Not set'}</div>
              <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</div>
              <div>NEXT_PUBLIC_POLYGONS_URL: {process.env.NEXT_PUBLIC_POLYGONS_URL ? '✅ Set' : '❌ Not set'}</div>
            </div>
          </div>

          {status.mapboxToken && status.mapboxValid && (
            <div className="bg-green-900/20 border border-green-500/50 rounded p-4">
              <p className="text-green-400">✅ Mapbox is properly configured! The map should work.</p>
              <a href="/legendary/analysis" className="text-cyan-400 underline">Go to map →</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
