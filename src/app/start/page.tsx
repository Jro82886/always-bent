'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Anchor, ArrowRight, Loader2 } from 'lucide-react';

export default function StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoAccess = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Sign in with the demo account
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@alwaysbent.com',
        password: 'demo123456'
      });

      if (signInError) {
        setError('Demo access temporarily unavailable. Please try again.');
        setLoading(false);
        return;
      }

      // Success - redirect to app
      router.push('/legendary?mode=analysis');
    } catch (err) {
      setError('Something went wrong. Please refresh and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      {/* Ocean effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-12 shadow-[0_20px_70px_rgba(6,182,212,0.2)]">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-6">
              <Anchor className="w-12 h-12 text-cyan-400" />
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-3">
              Always Bent
            </h1>
            <p className="text-xl text-cyan-400 font-semibold">
              Fishing Intelligence
            </p>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-lg">
              Welcome, Captain!
            </p>
            <p className="text-slate-400 mt-2">
              Your advanced ocean analysis platform is ready.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* ONE BIG BUTTON */}
          <button
            onClick={handleDemoAccess}
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Loading Platform...
              </>
            ) : (
              <>
                Enter ABFI Platform
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>

          {/* Simple footer */}
          <p className="text-center text-xs text-slate-500 mt-8">
            By clicking above, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
