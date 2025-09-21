'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Check environment variables
    const vars = {
      NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'NOT SET',
      NEXT_PUBLIC_MEMBERSTACK_APP_ID: process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET',
      NEXT_PUBLIC_POLYGONS_URL: process.env.NEXT_PUBLIC_POLYGONS_URL || 'NOT SET',
    };
    setEnvVars(vars);

    // Test critical dependencies
    const errorList: string[] = [];
    
    // Check if window is defined
    if (typeof window === 'undefined') {
      errorList.push('Window is undefined (SSR issue)');
    }

    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      errorList.push('localStorage is not available');
    }

    // Check for Mapbox
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      errorList.push('Mapbox token is missing');
    }

    setErrors(errorList);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🔍 Debug Information</h1>
      
      <div className="space-y-6">
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="text-gray-400 w-80">{key}:</span>
                <span className={value === 'NOT SET' ? 'text-red-500' : 'text-green-500'}>
                  {value === 'NOT SET' ? '❌ NOT SET' : '✅ ' + value.substring(0, 20) + '...'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Errors Detected</h2>
          {errors.length === 0 ? (
            <p className="text-green-500">✅ No errors detected</p>
          ) : (
            <ul className="space-y-2">
              {errors.map((error, i) => (
                <li key={i} className="text-red-500">❌ {error}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Browser Info</h2>
          <div className="space-y-2 text-sm">
            <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          </div>
        </section>

        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Check the red ❌ items above</li>
            <li>Add missing environment variables in Vercel Dashboard</li>
            <li>Go to: Settings → Environment Variables</li>
            <li>Add each missing variable for all environments</li>
            <li>Vercel will automatically redeploy</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
