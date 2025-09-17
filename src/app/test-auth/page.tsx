'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/AuthProvider';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestAuthPage() {
  const { user, loading } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // Check if Supabase is configured
    const checkSupabase = async () => {
      try {
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        setEnvVars({
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
          anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
          urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
        });

        if (hasUrl && hasAnon) {
          setSupabaseStatus('connected');
        } else {
          setSupabaseStatus('error');
        }
      } catch (error) {
        setSupabaseStatus('error');
      }
    };

    checkSupabase();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8">
        <h1 className="text-2xl font-bold text-cyan-300 mb-6">🔐 Auth System Status</h1>
        
        {/* Supabase Connection */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            {supabaseStatus === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
            {supabaseStatus === 'connected' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {supabaseStatus === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
            <h2 className="text-lg font-semibold text-white">Supabase Connection</h2>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className="text-cyan-300 font-mono text-xs">{envVars.url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className="text-cyan-300 font-mono text-xs">{envVars.anon}</span>
            </div>
            <div className="mt-2 p-2 bg-slate-900 rounded">
              <span className="text-gray-500 text-xs">URL: {envVars.urlValue}</span>
            </div>
          </div>
        </div>

        {/* Auth Status */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            {loading && <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
            {!loading && user && <CheckCircle className="w-5 h-5 text-green-400" />}
            {!loading && !user && <XCircle className="w-5 h-5 text-yellow-400" />}
            <h2 className="text-lg font-semibold text-white">Authentication Status</h2>
          </div>
          
          <div className="space-y-2 text-sm">
            {loading ? (
              <p className="text-gray-400">Checking authentication...</p>
            ) : user ? (
              <>
                <p className="text-green-400">✅ User is logged in</p>
                <p className="text-gray-400">Email: <span className="text-cyan-300">{user.email}</span></p>
                <p className="text-gray-400">User ID: <span className="text-cyan-300 font-mono text-xs">{user.id}</span></p>
              </>
            ) : (
              <p className="text-yellow-400">⚠️ No user logged in</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {!user ? (
            <>
              <a 
                href="/auth/login" 
                className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg text-center hover:bg-cyan-600 transition-colors"
              >
                Go to Login
              </a>
              <a 
                href="/auth/signup" 
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-600 transition-colors"
              >
                Go to Signup
              </a>
            </>
          ) : (
            <a 
              href="/legendary?mode=analysis" 
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg text-center hover:bg-green-600 transition-colors"
            >
              Go to App (You're Authenticated!)
            </a>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">🔍 What This Shows:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Whether Supabase environment variables are loaded</li>
            <li>• Whether you're currently authenticated</li>
            <li>• Your user details if logged in</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
// Force clean build without cache
