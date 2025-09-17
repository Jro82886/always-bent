'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/AuthProvider';
import { configureSessionPersistence } from '@/lib/supabase/session';
import { Loader2, Anchor, AlertCircle, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();  // Remove user and authLoading - we don't need to check
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to remember
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NO AUTO-REDIRECT AT ALL - Users must click the button
  // This ensures Squarespace users see the page and choose to enter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Configure session persistence based on Remember Me
    await configureSessionPersistence(rememberMe);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message || 'Failed to sign in');
      setLoading(false);
    } else {
      // Small delay to ensure auth state propagates before redirect
      setTimeout(() => {
        // Use replace instead of push to avoid back button issues
        router.replace('/legendary?mode=analysis');
      }, 100);
    }
  };

  // Don't wait for auth check - just show the login form immediately
  // The useEffect will redirect if already logged in
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Anchor className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Welcome Back, Captain
            </h1>
            <p className="text-slate-400 mt-2">Sign in to ABFI Command Bridge</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cyan-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="captain@vessel.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cyan-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                required
                disabled={loading}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                  rememberMe 
                    ? 'bg-cyan-500 border-cyan-500' 
                    : 'bg-slate-800/50 border-cyan-500/30'
                }`}>
                  {rememberMe && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="text-sm text-slate-300">
                  Keep me logged in for 30 days
                </span>
              </label>
              
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          {/* INSTANT DEMO ACCESS - ONE CLICK! */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/80 text-slate-400">Skip the hassle</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                // Use the confirmed demo account
                const { error } = await signIn('demo@alwaysbent.com', 'demo123456');
                if (!error) {
                  setTimeout(() => {
                    router.replace('/legendary?mode=analysis');
                  }, 100);
                } else {
                  // If demo account doesn't exist, create it on the fly
                  setError('Setting up demo access...');
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="mt-4 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-600 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
            >
              ⚡ Try It Now - Instant Access
            </button>
            
            <p className="text-xs text-slate-500 text-center mt-2">
              No signup required • Full features • Ready to explore
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="px-4 text-sm text-slate-500">or</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-slate-400">
              New to ABFI?{' '}
              <Link 
                href="/auth/signup" 
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Skip auth for testing */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <Link 
              href="/legendary/welcome"
              className="block text-center text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              Continue without account (limited features)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
