'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('🚨 Route Error Boundary triggered:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/50 backdrop-blur border border-red-500/20 rounded-xl p-8 text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Navigation Error
            </h1>
            <p className="text-slate-400 text-sm">
              Something went wrong while loading this page. This is likely a temporary issue.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors font-medium"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>
            
            <Link
              href="/legendary"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>

          <details className="text-left">
            <summary className="text-xs text-slate-500 cursor-pointer">
              Technical Details
            </summary>
            <pre className="text-xs text-red-400 mt-2 p-3 bg-black/50 rounded overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
              {error.digest && `\nError ID: ${error.digest}`}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}