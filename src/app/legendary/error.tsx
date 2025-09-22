'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorBoundary({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/80 backdrop-blur-lg rounded-xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Something went sideways</h2>
          </div>
          
          <p className="text-slate-300 mb-6">
            We hit a snag loading this view. This can happen when switching between tabs quickly or if there's a connection issue.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-medium rounded-lg border border-cyan-500/30 transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Reload this view
            </button>
            
            <button
              onClick={() => window.location.href = '/legendary/analysis'}
              className="w-full px-4 py-3 bg-slate-800/50 hover:bg-slate-800/70 text-slate-300 font-medium rounded-lg border border-slate-700 transition-all duration-200"
            >
              Go to Analysis
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                Error details (dev only)
              </summary>
              <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-red-400 overflow-auto">
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
