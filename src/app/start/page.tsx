'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, ArrowRight, Loader2 } from 'lucide-react';

export default function StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDemoAccess = async () => {
    setLoading(true);
    
    // Set demo user in localStorage
    localStorage.setItem('abfi_captain_name', 'Demo Captain');
    localStorage.setItem('abfi_boat_name', 'Demo Vessel');
    localStorage.setItem('abfi_user_id', `demo-${Date.now()}`);
    
    // Redirect to app
    setTimeout(() => {
      router.push('/legendary');
    }, 500);
  };

  const handleSignIn = () => {
    router.push('/legendary?mode=analysis');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mb-4">
              <Anchor className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Always Bent
            </h1>
            <p className="text-cyan-400 text-lg">
              Fishing Intelligence Platform
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading Demo...
                </>
              ) : (
                <>
                  Try Demo Access
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-slate-800 text-cyan-400 py-3 px-4 rounded-lg font-medium hover:bg-slate-700 transition-colors border border-cyan-500/30"
            >
              Enter Your Details
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Beta Version 1.0</p>
            <p className="mt-1">© 2025 Always Bent Fishing Intelligence</p>
          </div>
        </div>
      </div>
    </div>
  );
}