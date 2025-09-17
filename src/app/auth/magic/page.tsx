'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Mail, Sparkles, ArrowLeft, Zap, Shield, Anchor } from 'lucide-react';

export default function MagicLinkPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-10 shadow-[0_20px_70px_rgba(6,182,212,0.3)]">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <Mail className="w-20 h-20 text-cyan-400" />
                <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Check Your Inbox!
              </h2>
              
              <p className="text-lg text-cyan-300 mb-2">
                We sent a magic link to
              </p>
              
              <p className="text-xl font-mono text-cyan-400 mb-6 break-all">
                {email}
              </p>
              
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <p className="text-slate-300 mb-2">
                  Click the link in your email to instantly sign in.
                </p>
                <p className="text-sm text-slate-400">
                  No password needed! 🎉
                </p>
              </div>
              
              <div className="text-sm text-slate-400 space-y-2">
                <p>Can\'t find it? Check your spam folder</p>
                <p>Link expires in 1 hour</p>
              </div>
              
              <button
                onClick={() => {setSent(false); setEmail('');}}
                className="mt-6 text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Try different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-10 shadow-[0_20px_70px_rgba(6,182,212,0.3)]">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-4">
              <Anchor className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to ABFI
            </h1>
            <p className="text-slate-400">
              Sign in with just your email - no password needed!
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Your Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="captain@vessel.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-2">
                <Shield className="w-6 h-6 text-green-400 mx-auto" />
                <p className="text-xs text-slate-400">No Password</p>
              </div>
              <div className="space-y-2">
                <Sparkles className="w-6 h-6 text-yellow-400 mx-auto" />
                <p className="text-xs text-slate-400">Instant Access</p>
              </div>
            </div>
          </div>

          {/* Alternative options */}
          <div className="mt-6 text-center space-y-3">
            <Link
              href="/auth/login"
              className="text-sm text-slate-400 hover:text-cyan-400 transition-colors block"
            >
              Sign in with password instead
            </Link>
            <Link
              href="/legendary?mode=analysis&demo=true"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors block font-medium"
            >
              Try Demo Mode →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
