'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Anchor, Shield, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get email from Squarespace redirect if provided
  const emailFromSquarespace = searchParams.get('email');
  const tokenFromSquarespace = searchParams.get('token');
  
  useEffect(() => {
    // If we have Squarespace credentials, auto-login
    if (emailFromSquarespace && tokenFromSquarespace) {
      handleSquarespaceAuth(emailFromSquarespace, tokenFromSquarespace);
    } else {
      // Check if user is already logged in
      checkUser();
    }
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Always go to legendary welcome after auth to collect captain/boat info
        router.replace('/legendary/welcome');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [emailFromSquarespace, tokenFromSquarespace, router]);
  
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is logged in, send them to welcome screen
      router.replace('/legendary/welcome');
    }
  };

  const handleSquarespaceAuth = async (email: string, token: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Verify the Squarespace token with our backend
      const response = await fetch('/api/auth/squarespace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token })
      });
      
      if (!response.ok) {
        throw new Error('Invalid Squarespace credentials');
      }
      
      const { session } = await response.json();
      
      if (session) {
        // Set the session in Supabase client
        await supabase.auth.setSession(session);
        router.replace('/legendary/welcome');
      }
    } catch (error: any) {
      console.error('Squarespace auth error:', error);
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSquarespaceLogin = () => {
    setLoading(true);
    setError('');
    
    // For now, create a simple email/password flow
    // This will be replaced when you have your actual Squarespace domain
    const email = prompt('Enter your email address:');
    
    if (!email) {
      setLoading(false);
      return;
    }
    
    // Generate a token for this session
    const token = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    
    // Authenticate with our backend
    handleSquarespaceAuth(email, token);
  };
  
  // Main login screen with Squarespace SSO
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
              Welcome to ABFI
            </h1>
            <p className="text-slate-400 mt-2">Always Bent Fishing Intelligence</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Squarespace SSO Login */}
          <div className="space-y-4">
            <button
              onClick={handleSquarespaceLogin}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Sign in with Squarespace
                </>
              )}
            </button>
            
            {/* Benefits */}
            <div className="space-y-2 mt-6">
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Use your existing Squarespace account</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Seamless integration with Always Bent membership</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>Secure and encrypted connection</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-4 text-slate-500 text-sm">Secure SSO</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              By signing in, you agree to our Terms of Service
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Access provided through Always Bent membership
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500">
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}