'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-lg border border-red-500/20 p-8">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong!</h2>
        
        <div className="bg-slate-900 rounded p-4 mb-4">
          <p className="text-sm text-gray-300 font-mono break-all">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-400 mb-6">
          <p>This could be due to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Missing environment variables</li>
            <li>Network connectivity issues</li>
            <li>Browser compatibility</li>
          </ul>
        </div>

        <button
          onClick={reset}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
